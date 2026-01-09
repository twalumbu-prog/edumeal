import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomUUID } from "crypto";
import { supabaseAuth } from "./supabaseAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === WEBHOOKS (Public - no auth required) ===
  app.post(api.webhooks.quickbooks.path, async (req, res) => {
    // Log every attempt for debugging with top-level fields for the UI
    await storage.createLog('webhook_attempt', {
      studentId: req.body.studentId || "N/A",
      productType: req.body.productType || "N/A",
      body: req.body
    });

    const {
      studentId,
      productType,
      amount,
      transactionId,
      grade,
      class: className,
      description,
      serviceDate
    } = req.body;

    if (!studentId || !productType) {
      return res.status(400).json({ success: false, message: "Missing studentId or productType" });
    }

    const idString = String(studentId).trim();
    const parts = idString.split(/\s+/);

    // The "Real ID" is either the whole string, or the last part if it's a name+ID combo
    const schoolId = parts.length > 1 ? parts[parts.length - 1] : idString;

    let student = await storage.getStudentBySchoolId(schoolId);

    // Auto-create student if not found
    if (!student) {
      let firstName = schoolId; // Fallback to ID if name missing
      let lastName = "Student";

      if (parts.length >= 3) {
        // Pattern: First Last SchoolID
        firstName = parts[0];
        lastName = parts.slice(1, -1).join(" ");
      } else if (parts.length === 2) {
        // Pattern: Name SchoolID
        firstName = parts[0];
        lastName = "Customer";
      }

      // Smart Grade Parsing (Regex)
      let finalGrade = grade;
      if (!finalGrade) {
        const searchStr = `${description || ''} ${productType || ''}`;
        const gradeMatch = searchStr.match(/Grade\s*(\d+[A-Z]*)/i) || searchStr.match(/G\s*(\d+[A-Z]*)/i);
        if (gradeMatch) {
          finalGrade = `Grade ${gradeMatch[1].toUpperCase()}`;
        }
      }

      try {
        student = await storage.createStudent({
          studentId: schoolId,
          firstName,
          lastName,
          grade: finalGrade || "N/A",
          class: className || "-",
          isActive: true,
          mealsRemaining: 0
        });
        await storage.createLog('webhook', { action: 'auto_create_student', studentId: schoolId });
      } catch (err) {
        // Fallback check if student was created simultaneously
        student = await storage.getStudentBySchoolId(schoolId);
        if (!student) {
          await storage.createLog('webhook', { error: 'creation_failed', studentId: schoolId });
          return res.status(500).json({ success: false, message: "Could not create student" });
        }
      }
    }

    // Safely parse amount
    const numericAmount = Number(amount) || 0;

    // Determine meals based on product type or amount (fuzzy matching)
    let mealsToAdd = 1;
    const type = String(productType).toLowerCase();

    if (type.includes('weekly')) {
      mealsToAdd = 5;
    } else if (type.includes('monthly')) {
      mealsToAdd = 20;
    } else if (type.includes('termly')) {
      mealsToAdd = 60; // Assuming 60 days per term
    } else if (type.includes('daily')) {
      mealsToAdd = 1;
    }

    // Parse Service Date
    let startDate = new Date().toISOString().split('T')[0];
    if (serviceDate) {
      const parsedDate = new Date(serviceDate);
      if (!isNaN(parsedDate.getTime())) {
        startDate = parsedDate.toISOString().split('T')[0];
      }
    }

    // Update student
    await storage.updateStudent(student.id, { mealsRemaining: student.mealsRemaining + mealsToAdd });

    // Create subscription record
    await storage.createSubscription({
      studentId: student.id,
      planType: productType,
      startDate: startDate,
      amountPaid: Math.round(numericAmount * 100), // Cents, ensure no NaN
      totalMeals: mealsToAdd,
      mealsRemaining: mealsToAdd,
      status: 'active',
      qbTransactionId: transactionId || 'unknown'
    });

    await storage.createLog('webhook', { success: true, studentId, mealsAdded: mealsToAdd });

    // Update integration last sync
    await storage.updateIntegration('quickbooks', {
      status: 'active',
      lastSync: new Date()
    });

    res.json({ success: true });
  });

  // Supabase auth middleware for all other API routes (skip webhooks)
  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/webhooks/")) {
      return next(); // Skip auth for webhooks
    }
    return supabaseAuth(req, res, next);
  });

  // Auth status endpoint (uses Supabase token)
  app.get("/api/auth/user", (req: any, res) => {
    if (!req.user) {
      return res.status(401).json(null);
    }
    res.json(req.user);
  });

  // === STUDENTS ===
  app.get(api.students.list.path, async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });

  app.get(api.students.get.path, async (req, res) => {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  });

  app.post(api.students.create.path, async (req, res) => {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.students.update.path, async (req, res) => {
    try {
      const input = api.students.update.input.parse(req.body);
      const student = await storage.updateStudent(Number(req.params.id), input);
      res.json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === TICKETS ===
  app.post(api.tickets.generate.path, async (req, res) => {
    // Logic: Find all active subscriptions.
    // For each student with active sub and meals > 0, generate a ticket for date.
    const date = req.body.date;
    const students = await storage.getStudents();
    let generatedCount = 0;

    for (const student of students) {
      if (student.isActive && student.mealsRemaining > 0) {
        // Check if ticket already exists
        const existing = await storage.getTicketForStudentDate(student.id, date);
        if (!existing) {
          await storage.createTicket({
            studentId: student.id,
            date: date,
            ticketId: randomUUID(), // QR payload
            securityHash: randomUUID(), // Simplified for MVP
            session: "lunch",
            status: "valid"
          });
          generatedCount++;
        }
      }
    }

    res.status(201).json({ count: generatedCount, message: `Generated ${generatedCount} tickets` });
  });

  app.post(api.tickets.scan.path, async (req, res) => {
    const { ticketId, offline } = req.body;

    // 1. Find ticket
    const ticket = await storage.getTicketByUuid(ticketId);

    if (!ticket) {
      await storage.createLog('scan', { ticketId, result: 'invalid_ticket' });
      return res.json({ valid: false, message: "Invalid Ticket" });
    }

    // 2. Check status
    if (ticket.status === 'used') {
      await storage.createLog('scan', { ticketId, result: 'duplicate_used' });
      return res.json({ valid: false, message: "Ticket Already Used" });
    }

    if (ticket.status !== 'valid') {
      await storage.createLog('scan', { ticketId, result: 'invalid_status' });
      return res.json({ valid: false, message: "Ticket Void" });
    }

    // 3. Check Date (Skip if offline sync?)
    const today = new Date().toISOString().split('T')[0];
    if (ticket.date !== today) {
      await storage.createLog('scan', { ticketId, result: 'wrong_date', expected: today, actual: ticket.date });
      return res.json({ valid: false, message: "Wrong Date" });
    }

    // 4. Mark Used & Deduct Meal
    await storage.updateTicketStatus(ticket.id, 'used', new Date());

    // Deduct meal from student
    const student = await storage.getStudent(ticket.studentId);
    if (student) {
      await storage.updateStudent(student.id, { mealsRemaining: student.mealsRemaining - 1 });
    }

    await storage.createLog('scan', { ticketId, result: 'success', studentId: ticket.studentId });

    res.json({
      valid: true,
      message: "Valid",
      student: student ? {
        name: `${student.firstName} ${student.lastName}`,
        class: student.class,
        mealsRemaining: (student?.mealsRemaining || 1) - 1
      } : undefined
    });
  });

  app.get(api.tickets.list.path, async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const tickets = await storage.getTicketsByDate(date);
    res.json(tickets);
  });

  // === ELIGIBILITY REPORTS ===
  app.get("/api/eligibility-reports", async (req, res) => {
    const reports = await storage.getEligibilityReports();
    res.json(reports);
  });

  app.post("/api/eligibility-reports", async (req, res) => {
    const { date } = req.body;
    const existing = await storage.getEligibilityReportByDate(date);
    if (existing) {
      return res.status(400).json({ message: "Report already exists for this date" });
    }
    const report = await storage.createEligibilityReport({
      date,
      status: "published",
      generatedBy: (req.user as any)?.username || "admin"
    });
    res.status(201).json(report);
  });

  // === REPORTS ===
  app.get(api.reports.dashboard.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get(api.reports.eligibility.path, async (req, res) => {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const report = await getEligibilityReportData(dateStr);
    res.json(report);
  });

  app.get(api.reports.export.path, async (req, res) => {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const data = await getEligibilityReportData(dateStr);

    // Simple CSV conversion
    const headers = ["Student ID", "Name", "Grade", "Class", "Plan", "Meals Remaining", "Status", "Used Today", "Used At"];
    const rows = data.map(item => [
      item.studentId,
      item.name,
      item.grade,
      item.class,
      item.planType,
      item.mealsRemaining,
      item.status,
      item.usedToday ? "Yes" : "No",
      item.usedAt || ""
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=eligibility_report_${dateStr}.csv`);
    res.send(csvContent);
  });

  // === INTEGRATIONS ===
  app.get(api.integrations.list.path, async (req, res) => {
    const data = await storage.getIntegrations();
    res.json(data);
  });

  app.post(api.integrations.update.path, async (req, res) => {
    const { name } = req.params;
    const body = api.integrations.update.input.parse(req.body);
    const updated = await storage.updateIntegration(name, body);
    res.json(updated);
  });

  app.get(api.integrations.logs.path, async (req, res) => {
    const logs = await storage.getRecentLogs(50);
    // Filter for webhook/sync related logs
    const filtered = logs.filter(l => ['webhook', 'sync'].includes(l.type));
    res.json(filtered);
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function getEligibilityReportData(dateStr: string) {
  const allStudents = await storage.getStudents();
  const todayTickets = await storage.getTicketsByDate(dateStr);

  const report = [];
  for (const student of allStudents) {
    const activeSub = await storage.getActiveSubscription(student.id);
    const ticket = todayTickets.find(t => t.studentId === student.id);

    let status = 'expired';
    if (student.isActive && student.mealsRemaining > 0) {
      status = 'valid';
    } else if (student.mealsRemaining <= 0) {
      status = 'exhausted';
    }

    report.push({
      studentId: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      class: student.class,
      planType: activeSub?.planType || 'None',
      mealsRemaining: student.mealsRemaining,
      status: status,
      usedToday: ticket?.status === 'used',
      usedAt: ticket?.usedAt?.toISOString()
    });
  }
  return report;
}

async function seedDatabase() {
  const students = await storage.getStudents();
  if (students.length === 0) {
    console.log("Seeding database...");
    const s1 = await storage.createStudent({
      studentId: "STU001",
      firstName: "John",
      lastName: "Doe",
      grade: "5",
      class: "5A",
      mealsRemaining: 10,
      isActive: true
    });

    const s2 = await storage.createStudent({
      studentId: "STU002",
      firstName: "Jane",
      lastName: "Smith",
      grade: "6",
      class: "6B",
      mealsRemaining: 5,
      isActive: true
    });

    // Create tickets for today
    const today = new Date().toISOString().split('T')[0];
    await storage.createTicket({
      studentId: s1.id,
      ticketId: "TICKET-001",
      date: today,
      securityHash: "hash123",
      session: "lunch",
      status: "valid"
    });
  }
}
