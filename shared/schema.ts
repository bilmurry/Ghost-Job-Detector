import { z } from "zod";

export const jobPostingSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  salary: z.number().optional(),
  requirements: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  postingDate: z.string().optional(),
  contactMethod: z.enum(["email", "phone", "text_only", "in_person", "other"]).optional(),
  responseTime: z.number().optional(),
});

export type JobPosting = z.infer<typeof jobPostingSchema>;

export type RedFlagSeverity = "critical" | "high" | "medium" | "low";

export interface RedFlag {
  severity: RedFlagSeverity;
  message: string;
  category: "content" | "company" | "patterns" | "communication";
}

export interface CategoryAnalysis {
  score: number;
  flags: string[];
}

export interface AnalysisResult {
  ghostScore: number;
  confidence: number;
  recommendation: string;
  riskLevel: "high" | "medium" | "low-medium" | "low";
  redFlags: RedFlag[];
  detailedAnalysis: {
    contentAnalysis: CategoryAnalysis;
    companyVerification: CategoryAnalysis;
    postingPatterns: CategoryAnalysis;
    communication: CategoryAnalysis;
  };
}
