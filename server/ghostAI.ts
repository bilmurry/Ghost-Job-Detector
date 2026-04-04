import OpenAI from "openai";
import type { AnalysisResult, RedFlag, RedFlagSeverity } from "@shared/schema";
import type { PerplexityVerification } from "./perplexityAI";
import type { ClaudeLanguageAnalysis } from "./claudeAI";

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

export async function analyzeJobWithAI(
  jobData: {
    title: string;
    company: string;
    description: string;
    salary?: number;
    requirements?: string;
    contactEmail?: string;
  },
  companyContext?: PerplexityVerification,
  extraContext?: PerplexityVerification,
  languageAnalysis?: ClaudeLanguageAnalysis
): Promise<AnalysisResult> {
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

  const contextBlock = buildContextBlock(companyContext, extraContext, languageAnalysis);

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert job market analyst specializing in detecting ghost jobs, scam postings, and misleading listings.

A "ghost job" is a listing posted without genuine intent to hire — used for data harvesting, benchmarking, or maintaining appearances.

You are the FINAL SCORING step in a multi-model analysis pipeline. You have been given:
1. The raw job posting
2. Company intelligence gathered from live web searches (Perplexity)
3. Linguistic analysis performed by a language model (Claude)

Use ALL of this context to produce a final, well-calibrated risk score. Do not re-derive findings already established — synthesize them into a verdict.

Return ONLY valid JSON matching this exact schema:
{
  "ghostScore": <number 0-100, higher = more suspicious>,
  "confidence": <number 0-100, how confident you are — higher if company context was confirmed>,
  "riskLevel": <"low" | "low-medium" | "medium" | "high">,
  "recommendation": <string, 1-2 sentence actionable advice for the job seeker>,
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

Be thorough but fair. A well-established, verified company can still post a ghost job. An unverified company posting vague descriptions is a much stronger signal. Weight the combination of signals, not each in isolation.`,
      },
      {
        role: "user",
        content: `JOB POSTING:
${jobText}

${contextBlock}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");

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

function buildContextBlock(
  companyContext?: PerplexityVerification,
  extraContext?: PerplexityVerification,
  languageAnalysis?: ClaudeLanguageAnalysis
): string {
  const parts: string[] = [];

  if (companyContext) {
    parts.push("COMPANY INTELLIGENCE (Perplexity web search):");
    parts.push(`  Exists: ${companyContext.companyExists}`);
    parts.push(`  Verified: ${companyContext.companyVerified}`);
    parts.push(`  Web presence score: ${companyContext.webPresenceScore}/100`);
    parts.push(`  Industry match: ${companyContext.industryMatch}`);
    if (companyContext.companySummary) parts.push(`  Summary: ${companyContext.companySummary}`);
    if (companyContext.verificationFlags.length > 0) {
      parts.push(`  Flags: ${companyContext.verificationFlags.map(f => `[${f.severity}] ${f.message}`).join("; ")}`);
    }
    if (companyContext.sources.length > 0) {
      parts.push(`  Sources: ${companyContext.sources.slice(0, 3).join(", ")}`);
    }
  }

  if (extraContext) {
    parts.push("\nFOLLOW-UP INTELLIGENCE (targeted Perplexity search):");
    if (extraContext.companySummary) parts.push(`  ${extraContext.companySummary}`);
    if (extraContext.verificationFlags.length > 0) {
      parts.push(`  Additional flags: ${extraContext.verificationFlags.map(f => `[${f.severity}] ${f.message}`).join("; ")}`);
    }
  }

  if (languageAnalysis) {
    parts.push("\nLANGUAGE ANALYSIS (Claude):");
    parts.push(`  Manipulative language: ${languageAnalysis.manipulativeLanguage}`);
    parts.push(`  Vagueness score: ${languageAnalysis.vaguenesScore}/100`);
    parts.push(`  Professionalism score: ${languageAnalysis.professionalismScore}/100`);
    if (languageAnalysis.overallAssessment) {
      parts.push(`  Assessment: ${languageAnalysis.overallAssessment}`);
    }
    if (languageAnalysis.toneFlags.length > 0) {
      parts.push(`  Language flags: ${languageAnalysis.toneFlags.map(f => `[${f.severity}] ${f.message}`).join("; ")}`);
    }
  }

  return parts.join("\n");
}
