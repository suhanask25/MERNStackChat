import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const medicalReports = pgTable("medical_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  extractedData: jsonb("extracted_data"),
  analysisComplete: integer("analysis_complete").notNull().default(0),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => medicalReports.id),
  answers: jsonb("answers").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const riskScores = pgTable("risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => medicalReports.id),
  assessmentId: varchar("assessment_id").references(() => assessments.id),
  score: integer("score").notNull(),
  riskLevel: text("risk_level").notNull(),
  interpretation: text("interpretation").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => medicalReports.id),
  taskType: text("task_type").notNull(),
  description: text("description").notNull(),
  target: text("target"),
  completed: integer("completed").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const medicalParameters = pgTable("medical_parameters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => medicalReports.id).notNull(),
  parameterName: text("parameter_name").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  referenceRange: text("reference_range"),
  status: text("status"),
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
});

export const insights = pgTable("insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => medicalReports.id),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  severity: text("severity"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMedicalReportSchema = createInsertSchema(medicalReports).omit({
  id: true,
  uploadedAt: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  completedAt: true,
});

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  calculatedAt: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalParameterSchema = createInsertSchema(medicalParameters).omit({
  id: true,
  extractedAt: true,
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  createdAt: true,
});

export type MedicalReport = typeof medicalReports.$inferSelect;
export type InsertMedicalReport = z.infer<typeof insertMedicalReportSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type RiskScore = typeof riskScores.$inferSelect;
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type MedicalParameter = typeof medicalParameters.$inferSelect;
export type InsertMedicalParameter = z.infer<typeof insertMedicalParameterSchema>;
export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
