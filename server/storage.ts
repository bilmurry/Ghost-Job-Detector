import { analyses, type Analysis, type InsertAnalysis } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IAnalysisStorage {
  saveAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getUserAnalyses(userId: string): Promise<Analysis[]>;
  getAnalysis(id: string, userId: string): Promise<Analysis | undefined>;
  deleteAnalysis(id: string, userId: string): Promise<boolean>;
}

class AnalysisStorage implements IAnalysisStorage {
  async saveAnalysis(data: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(data)
      .returning();
    return analysis;
  }

  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    return await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  async getAnalysis(id: string, userId: string): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    
    if (analysis && analysis.userId === userId) {
      return analysis;
    }
    return undefined;
  }

  async deleteAnalysis(id: string, userId: string): Promise<boolean> {
    const analysis = await this.getAnalysis(id, userId);
    if (!analysis) return false;
    
    await db.delete(analyses).where(eq(analyses.id, id));
    return true;
  }
}

export const analysisStorage = new AnalysisStorage();
