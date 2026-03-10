import { z } from "zod";

export * from "./models/auth";

export const jobPostingSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  description: z.string().min(1, "Description is required"),
  salary: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  requirements: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  postingDate: z.string().optional(),
  contactMethod: z.enum(["email", "phone", "text_only", "in_person", "other"]).optional(),
  responseTime: z.union([z.string(), z.number()]).optional(),
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

export interface RepostDetection {
  isRepost: boolean;
  repostCount: number;
  firstSeen: string | null;
  sites: string[];
  similarListings: Array<{
    title: string;
    source: string;
    date: string;
    ghostScore: number | null;
  }>;
}

export interface EmployerReputation {
  company: string;
  reputationScore: number;
  totalListings: number;
  repostCount: number;
  avgGhostScore: number;
  highRiskCount: number;
  vaguePayCount: number;
  perpetualHiring: boolean;
  lastUpdated: string | null;
}

export interface LanguageAnalysis {
  manipulativeLanguage: boolean;
  vaguenessScore: number;
  professionalismScore: number;
  writingQualityNotes: string[];
  overallAssessment: string;
}

export interface CompanyVerification {
  companyExists: boolean;
  companyVerified: boolean;
  companySummary: string;
  industryMatch: boolean;
  webPresenceScore: number;
  sources: string[];
}

export interface AIModelContributions {
  chatgpt: { scored: boolean };
  claude: { scored: boolean; languageAnalysis?: LanguageAnalysis };
  perplexity: { scored: boolean; verification?: CompanyVerification };
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
  repostDetection?: RepostDetection;
  employerReputation?: EmployerReputation;
  aiModels?: AIModelContributions;
}
