import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export Auth tables
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(), // School ID
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  mealsRemaining: integer("meals_remaining").default(0).notNull(),
  parentEmail: text("parent_email"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(), // FK to students.id (serial)
  planType: text("plan_type").notNull(), // 'daily', 'weekly', 'monthly', 'termly'
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  amountPaid: integer("amount_paid").notNull(), // In cents
  totalMeals: integer("total_meals").notNull(),
  mealsRemaining: integer("meals_remaining").notNull(),
  status: text("status").notNull(), // 'active', 'exhausted', 'expired'
  qbTransactionId: text("qb_transaction_id"), // QuickBooks ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketId: text("ticket_id").notNull().unique(), // UUID for QR code
  studentId: integer("student_id").notNull(), // FK to students.id
  date: date("date").notNull(), // YYYY-MM-DD
  session: text("session").default("lunch").notNull(),
  securityHash: text("security_hash").notNull(),
  status: text("status").default("valid").notNull(), // 'valid', 'used', 'expired', 'void'
  generatedAt: timestamp("generated_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'scan', 'override', 'sync', 'error', 'system'
  details: jsonb("details").notNull(),
  actorId: text("actor_id"), // User ID if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

export const eligibilityReports = pgTable("eligibility_reports", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  status: text("status").default("draft").notNull(), // 'draft', 'published'
  generatedBy: text("generated_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const studentsRelations = relations(students, ({ many }) => ({
  subscriptions: many(subscriptions),
  tickets: many(tickets),
}));

export const eligibilityReportsRelations = relations(eligibilityReports, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  student: one(students, {
    fields: [tickets.studentId],
    references: [students.id],
  }),
  report: one(eligibilityReports, {
    fields: [tickets.date],
    references: [eligibilityReports.date],
  }),
}));

// === BASE SCHEMAS ===
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, generatedAt: true, usedAt: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, createdAt: true });
export const insertEligibilityReportSchema = createInsertSchema(eligibilityReports).omit({ id: true, createdAt: true, updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type EligibilityReport = typeof eligibilityReports.$inferSelect;
export type InsertEligibilityReport = z.infer<typeof insertEligibilityReportSchema>;

// Request/Response Types
export type CreateStudentRequest = InsertStudent;
export type UpdateStudentRequest = Partial<InsertStudent>;

export type ScanTicketRequest = {
  ticketId: string; // The UUID from the QR code
  offline?: boolean;
};

export type ScanResponse = {
  valid: boolean;
  message: string;
  student?: {
    name: string;
    class: string;
    mealsRemaining: number;
    photoUrl?: string;
  };
  ticket?: Ticket;
};

export type ManualOverrideRequest = {
  studentId: number; // Database ID
  reason: string;
};

export type DashboardStats = {
  mealsServedToday: number;
  eligibleStudents: number;
  activeSubscriptions: number;
  recentLogs: Log[];
};

export type WebhookQuickBooksRequest = {
  studentId: string; // School ID
  productType: string;
  startDate: string;
  amount: number;
  transactionId: string;
};

export type EligibilityReportItem = {
  studentId: string;
  name: string;
  grade: string;
  class: string;
  planType: string;
  mealsRemaining: number;
  status: 'valid' | 'expired' | 'exhausted';
  usedToday: boolean;
  usedAt?: string;
};
