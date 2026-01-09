import { db } from "./db";
import {
  students, subscriptions, tickets, logs, eligibilityReports, integrations,
  type Student, type InsertStudent, type UpdateStudentRequest,
  type Subscription, type InsertSubscription,
  type Ticket, type InsertTicket,
  type Log,
  type DashboardStats,
  type EligibilityReport, type InsertEligibilityReport,
  type Integration, type InsertIntegration
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentBySchoolId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, updates: UpdateStudentRequest): Promise<Student>;

  // Subscriptions
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  getActiveSubscription(studentId: number): Promise<Subscription | undefined>;

  // Tickets
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketByUuid(uuid: string): Promise<Ticket | undefined>;
  getTicketForStudentDate(studentId: number, date: string): Promise<Ticket | undefined>;
  updateTicketStatus(id: number, status: string, usedAt?: Date): Promise<Ticket>;
  getTicketsByDate(date: string): Promise<Ticket[]>;

  // Logs
  createLog(type: string, details: any, actorId?: string): Promise<Log>;
  getRecentLogs(limit?: number): Promise<Log[]>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;

  // Eligibility Reports
  getEligibilityReports(): Promise<EligibilityReport[]>;
  getEligibilityReport(id: number): Promise<EligibilityReport | undefined>;
  getEligibilityReportByDate(date: string): Promise<EligibilityReport | undefined>;
  createEligibilityReport(report: InsertEligibilityReport): Promise<EligibilityReport>;

  // Integrations
  getIntegrations(): Promise<Integration[]>;
  getIntegrationByName(name: string): Promise<Integration | undefined>;
  updateIntegration(name: string, updates: Partial<Integration>): Promise<Integration>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods (delegated or implemented)
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;

  // Students
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.lastName);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentBySchoolId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: number, updates: UpdateStudentRequest): Promise<Student> {
    const [updated] = await db.update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  // Subscriptions
  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const [newSub] = await db.insert(subscriptions).values(sub).returning();
    return newSub;
  }

  async getActiveSubscription(studentId: number): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.studentId, studentId),
        eq(subscriptions.status, 'active')
      ));
    return sub;
  }

  // Tickets
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async getTicketByUuid(uuid: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketId, uuid));
    return ticket;
  }

  async getTicketForStudentDate(studentId: number, date: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets)
      .where(and(
        eq(tickets.studentId, studentId),
        eq(tickets.date, date)
      ));
    return ticket;
  }

  async updateTicketStatus(id: number, status: string, usedAt?: Date): Promise<Ticket> {
    const [updated] = await db.update(tickets)
      .set({ status, usedAt })
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async getTicketsByDate(date: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.date, date));
  }

  // Logs
  async createLog(type: string, details: any, actorId?: string): Promise<Log> {
    const [log] = await db.insert(logs).values({
      type,
      details,
      actorId,
    }).returning();
    return log;
  }

  async getRecentLogs(limit = 20): Promise<Log[]> {
    return await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit);
  }

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    // Basic stats implementation
    // This is simplified for MVP. Real SQL aggregations would be better.
    const today = new Date().toISOString().split('T')[0];

    // Meals served today (tickets used)
    const served = await db.select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(and(eq(tickets.date, today), eq(tickets.status, 'used')));

    // Eligible students (meals > 0 and active)
    const eligible = await db.select({ count: sql<number>`count(*)` })
      .from(students)
      .where(and(eq(students.isActive, true), sql`${students.mealsRemaining} > 0`));

    // Active subscriptions
    const activeSubs = await db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const recent = await this.getRecentLogs(10);

    return {
      mealsServedToday: Number(served[0].count),
      eligibleStudents: Number(eligible[0].count),
      activeSubscriptions: Number(activeSubs[0].count),
      recentLogs: recent,
    };
  }

  // Eligibility Reports
  async getEligibilityReports(): Promise<EligibilityReport[]> {
    return await db.select().from(eligibilityReports).orderBy(desc(eligibilityReports.date));
  }

  async getEligibilityReport(id: number): Promise<EligibilityReport | undefined> {
    const [report] = await db.select().from(eligibilityReports).where(eq(eligibilityReports.id, id));
    return report;
  }

  async getEligibilityReportByDate(date: string): Promise<EligibilityReport | undefined> {
    const [report] = await db.select().from(eligibilityReports).where(eq(eligibilityReports.date, date));
    return report;
  }

  async createEligibilityReport(report: InsertEligibilityReport): Promise<EligibilityReport> {
    const [newReport] = await db.insert(eligibilityReports).values(report).returning();
    return newReport;
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations);
  }

  async getIntegrationByName(name: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.name, name));
    return integration;
  }

  async updateIntegration(name: string, updates: Partial<Integration>): Promise<Integration> {
    const [updated] = await db.update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.name, name))
      .returning();

    if (!updated) {
      // Create if doesn't exist (upsert pattern for integrations)
      const [newIntegration] = await db.insert(integrations).values({
        name,
        status: updates.status || 'inactive',
        settings: updates.settings || {},
      }).returning();
      return newIntegration;
    }
    return updated;
  }
}

export const storage = new DatabaseStorage();
