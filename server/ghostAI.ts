import OpenAI from "openai";
import type { AnalysisResult, RedFlag, RedFlagSeverity } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getRiskLevel(score: number): AnalysisResult["riskLevel"] {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low-medium";
  return "low";
}

export async function analyzeJobWithAI(jobData: {
  title: string;
  company: string;
  description: string;
  salary?: number;
  requirements?: string;
  contactEmail?: string;
}): Promise<AnalysisResult> {
  const jobText = [
    `Job Title: ${jobData.title}`,
    `Company: ${jobData.company}`,
    `Description: ${jobData.description}`,
    jobData.salary ? `Salary: $${jobData.salary.toLocaleString()}` : null,
    jobData.requirements ? `Requirements: ${jobData.requirements}` : null,
    jobData.contactEmail ? `Contact Email: ${jobData.contactEmail}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert job market analyst specializing in detecting ghost jobs, scam postings, and misleading listings. Analyze job postings and return a structured JSON assessment.

A "ghost job" is a listing posted without genuine intent to hire — used for data harvesting, benchmarking, or maintaining appearances.

Evaluate these dimensions:
1. Content quality: vague descriptions, unrealistic promises, payment requests, MLM indicators
2. Company legitimacy: generic names, missing info, mismatched domains
3. Posting patterns: urgency tactics, evergreen listings, talent pool language
4. Communication: suspicious emails, excessive data requests, unusual contact methods

Return ONLY valid JSON matching this exact schema:
{
  "ghostScore": <number 0-100, higher = more suspicious>,
  "confidence": <number 0-100, how confident you are>,
  "riskLevel": <"low" | "low-medium" | "medium" | "high">,
  "recommendation": <string, 1-2 sentence actionable advice>,
  "redFlags": [
    {
      "severity": <"critical" | "high" | "medium" | "low">,
      "message": <string, clear description of the issue>,
      "category": <"content" | "company" | "patterns" | "communication">
    }
  ],
  "detailedAnalysis": {
    "contentAnalysis": { "score": <number 0-40>, "flags": [<string>] },
    "companyVerification": { "score": <number 0-25>, "flags": [<string>] },
    "postingPatterns": { "score": <number 0-20>, "flags": [<string>] },
    "communication": { "score": <number 0-15>, "flags": [<string>] }
  }
}

Be thorough but fair. Not every imperfect posting is a scam. Consider industry norms.`,
      },
      {
        role: "user",
        content: jobText,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty response");
  }

  const parsed = JSON.parse(content);

  const validSeverities = ["critical", "high", "medium", "low"];
  const validCategories = ["content", "company", "patterns", "communication"];

  const redFlags: RedFlag[] = (parsed.redFlags || [])
    .filter(
      (f: any) =>
        f &&
        typeof f.message === "string" &&
        validSeverities.includes(f.severity) &&
        validCategories.includes(f.category)
    )
    .map((f: any) => ({
      severity: f.severity as RedFlagSeverity,
      message: f.message,
      category: f.category as RedFlag["category"],
    }));

  const ghostScore = Math.max(0, Math.min(100, Math.round(parsed.ghostScore || 0)));

  const da = parsed.detailedAnalysis || {};

  return {
    ghostScore,
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence || 50))),
    riskLevel: getRiskLevel(ghostScore),
    recommendation: parsed.recommendation || "Review this posting carefully before proceeding.",
    redFlags,
    detailedAnalysis: {
      contentAnalysis: {
        score: Math.round(da.contentAnalysis?.score ?? 0),
        flags: Array.isArray(da.contentAnalysis?.flags) ? da.contentAnalysis.flags : [],
      },
      companyVerification: {
        score: Math.round(da.companyVerification?.score ?? 0),
        flags: Array.isArray(da.companyVerification?.flags) ? da.companyVerification.flags : [],
      },
      postingPatterns: {
        score: Math.round(da.postingPatterns?.score ?? 0),
        flags: Array.isArray(da.postingPatterns?.flags) ? da.postingPatterns.flags : [],
      },
      communication: {
        score: Math.round(da.communication?.score ?? 0),
        flags: Array.isArray(da.communication?.flags) ? da.communication.flags : [],
      },
    },
  };
}
