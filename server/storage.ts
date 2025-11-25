import type {
  MedicalReport,
  InsertMedicalReport,
  Assessment,
  InsertAssessment,
  RiskScore,
  InsertRiskScore,
  DailyTask,
  InsertDailyTask,
  MedicalParameter,
  InsertMedicalParameter,
  Insight,
  InsertInsight,
} from "@shared/schema";

export interface IStorage {
  createMedicalReport(report: InsertMedicalReport): Promise<MedicalReport>;
  getMedicalReport(id: string): Promise<MedicalReport | undefined>;
  getAllMedicalReports(): Promise<MedicalReport[]>;
  updateMedicalReport(id: string, data: Partial<MedicalReport>): Promise<MedicalReport>;
  
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getLatestAssessment(): Promise<Assessment | undefined>;
  
  createRiskScore(riskScore: InsertRiskScore): Promise<RiskScore>;
  getLatestRiskScore(): Promise<RiskScore | undefined>;
  
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  getDailyTasks(reportId?: string): Promise<DailyTask[]>;
  updateDailyTask(id: string, completed: boolean): Promise<DailyTask>;
  
  createMedicalParameter(parameter: InsertMedicalParameter): Promise<MedicalParameter>;
  getMedicalParametersByReportId(reportId: string): Promise<MedicalParameter[]>;
  getAllMedicalParameters(): Promise<MedicalParameter[]>;
  getLatestMedicalParameters(): Promise<MedicalParameter[]>;
  
  createInsight(insight: InsertInsight): Promise<Insight>;
  getInsightsByReportId(reportId?: string): Promise<Insight[]>;
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export class DatabaseStorage implements IStorage {
  async createMedicalReport(insertReport: InsertMedicalReport): Promise<MedicalReport> {
    const [report] = await db
      .insert(schema.medicalReports)
      .values(insertReport)
      .returning();
    return report;
  }

  async getMedicalReport(id: string): Promise<MedicalReport | undefined> {
    const [report] = await db
      .select()
      .from(schema.medicalReports)
      .where(eq(schema.medicalReports.id, id));
    return report || undefined;
  }

  async getAllMedicalReports(): Promise<MedicalReport[]> {
    return await db
      .select()
      .from(schema.medicalReports)
      .orderBy(desc(schema.medicalReports.uploadedAt));
  }

  async updateMedicalReport(id: string, data: Partial<MedicalReport>): Promise<MedicalReport> {
    const [report] = await db
      .update(schema.medicalReports)
      .set(data)
      .where(eq(schema.medicalReports.id, id))
      .returning();
    return report;
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db
      .insert(schema.assessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  async getLatestAssessment(): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(schema.assessments)
      .orderBy(desc(schema.assessments.completedAt))
      .limit(1);
    return assessment || undefined;
  }

  async createRiskScore(insertRiskScore: InsertRiskScore): Promise<RiskScore> {
    const [riskScore] = await db
      .insert(schema.riskScores)
      .values(insertRiskScore)
      .returning();
    return riskScore;
  }

  async getLatestRiskScore(): Promise<RiskScore | undefined> {
    const [riskScore] = await db
      .select()
      .from(schema.riskScores)
      .orderBy(desc(schema.riskScores.calculatedAt))
      .limit(1);
    return riskScore || undefined;
  }

  async createDailyTask(insertTask: InsertDailyTask): Promise<DailyTask> {
    const [task] = await db
      .insert(schema.dailyTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async getDailyTasks(reportId?: string): Promise<DailyTask[]> {
    if (reportId) {
      return await db
        .select()
        .from(schema.dailyTasks)
        .where(eq(schema.dailyTasks.reportId, reportId))
        .orderBy(desc(schema.dailyTasks.createdAt));
    }
    return await db
      .select()
      .from(schema.dailyTasks)
      .orderBy(desc(schema.dailyTasks.createdAt));
  }

  async updateDailyTask(id: string, completed: boolean): Promise<DailyTask> {
    const [task] = await db
      .update(schema.dailyTasks)
      .set({ completed: completed ? 1 : 0 })
      .where(eq(schema.dailyTasks.id, id))
      .returning();
    return task;
  }

  async createMedicalParameter(insertParameter: InsertMedicalParameter): Promise<MedicalParameter> {
    const [parameter] = await db
      .insert(schema.medicalParameters)
      .values(insertParameter)
      .returning();
    return parameter;
  }

  async getMedicalParametersByReportId(reportId: string): Promise<MedicalParameter[]> {
    return await db
      .select()
      .from(schema.medicalParameters)
      .where(eq(schema.medicalParameters.reportId, reportId));
  }

  async getAllMedicalParameters(): Promise<MedicalParameter[]> {
    return await db
      .select()
      .from(schema.medicalParameters);
  }

  async getLatestMedicalParameters(): Promise<MedicalParameter[]> {
    const reports = await this.getAllMedicalReports();
    if (reports.length === 0) return [];
    const latestReport = reports[0];
    return this.getMedicalParametersByReportId(latestReport.id);
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
    const [insight] = await db
      .insert(schema.insights)
      .values(insertInsight)
      .returning();
    return insight;
  }

  async getInsightsByReportId(reportId?: string): Promise<Insight[]> {
    if (reportId) {
      return await db
        .select()
        .from(schema.insights)
        .where(eq(schema.insights.reportId, reportId))
        .orderBy(desc(schema.insights.createdAt));
    }
    return await db
      .select()
      .from(schema.insights)
      .orderBy(desc(schema.insights.createdAt));
  }
}

export const storage = new DatabaseStorage();
