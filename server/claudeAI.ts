import Anthropic from "@anthropic-ai/sdk";
import type { RedFlag, RedFlagSeverity } from "@shared/schema";
import type { PerplexityVerification } from "./perplexityAI";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export interface ClaudeLanguageAnalysis {
  toneFlags: RedFlag[];
  manipulativeLanguage: boolean;
  vaguenesScore: number;
  professionalismScore: number;
  writingQualityNotes: string[];
  overallAssessment: string;
  needsMoreInfo: boolean;
  followUpQuery?: string;
}

export async function analyzeLanguageWithClaude(
  jobData: {
    title: string;
    company: string;
    description: string;
    salary?: string | number;
    requirements?: string;
  },
  companyContext?: PerplexityVerification,
  extraContext?: PerplexityVerification
): Promise<ClaudeLanguageAnalysis> {
  const jobText = [
    `Job Title: ${jobData.title}`,
    `Company: ${jobData.company}`,
    `Description: ${jobData.description}`,
    jobData.salary ? `Salary: ${jobData.salary}` : null,
    jobData.requirements ? `Requirements: ${jobData.requirements}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const contextSection = buildContextSection(companyContext, extraContext);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a senior investigative analyst combining linguistics expertise with company intelligence to detect ghost jobs, scam postings, and misleading listings.

${contextSection ? `COMPANY INTELLIGENCE (from web search):\n${contextSection}\n\n` : ""}Analyze this job posting for deceptive language, suspicious patterns, and red flags. Use the company intelligence above to inform your language analysis — e.g., if the company is unverified, vague language becomes MORE suspicious; if the company is well-established, some generic language may be acceptable.

Return ONLY valid JSON matching this schema:
{
  "toneFlags": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "message": "specific issue found",
      "category": "content" | "company" | "patterns" | "communication"
    }
  ],
  "manipulativeLanguage": true/false,
  "vaguenessScore": 0-100 (higher = more vague),
  "professionalismScore": 0-100 (higher = more professional),
  "writingQualityNotes": ["specific observations"],
  "overallAssessment": "1-2 sentence summary",
  "needsMoreInfo": true/false (set true if a specific unanswered question about this company/posting would meaningfully change your assessment),
  "followUpQuery": "specific web search query to resolve uncertainty (only if needsMoreInfo is true, max 1 query)"
}

Look for:
- Emotional manipulation (FOMO, artificial urgency, flattery)
- Evasive or vague language about duties, pay, or company identity
- Inconsistent tone (corporate speak mixed with informal hype)
- Template/copy-paste language in mass-produced listings
- Grammatical patterns common in scam postings
- Overuse of buzzwords without substance
- Promises without specifics
- Mismatches between company context (from web search) and how the company describes itself in the posting

Only set needsMoreInfo=true if the follow-up would genuinely change your red flag assessment — not just for curiosity.

Job posting:
${jobText}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Claude returned non-text response");

  let jsonStr = content.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  const parsed = JSON.parse(jsonStr.trim());

  const validSeverities = ["critical", "high", "medium", "low"];
  const validCategories = ["content", "company", "patterns", "communication"];

  const toneFlags: RedFlag[] = (parsed.toneFlags || [])
    .filter(
      (f: any) =>
        f &&
        typeof f.message === "string" &&
        validSeverities.includes(f.severity) &&
        validCategories.includes(f.category)
    )
    .map((f: any) => ({
      severity: f.severity as RedFlagSeverity,
      message: `[Language] ${f.message}`,
      category: f.category as RedFlag["category"],
    }));

  return {
    toneFlags,
    manipulativeLanguage: !!parsed.manipulativeLanguage,
    vaguenesScore: Math.max(0, Math.min(100, Math.round(parsed.vaguenessScore || 0))),
    professionalismScore: Math.max(0, Math.min(100, Math.round(parsed.professionalismScore || 50))),
    writingQualityNotes: Array.isArray(parsed.writingQualityNotes) ? parsed.writingQualityNotes : [],
    overallAssessment: parsed.overallAssessment || "",
    needsMoreInfo: !!parsed.needsMoreInfo,
    followUpQuery: typeof parsed.followUpQuery === "string" ? parsed.followUpQuery : undefined,
  };
}

function buildContextSection(
  companyContext?: PerplexityVerification,
  extraContext?: PerplexityVerification
): string {
  const parts: string[] = [];

  if (companyContext) {
    parts.push(`Company exists: ${companyContext.companyExists}`);
    parts.push(`Company verified: ${companyContext.companyVerified}`);
    parts.push(`Web presence score: ${companyContext.webPresenceScore}/100`);
    parts.push(`Industry match: ${companyContext.industryMatch}`);
    if (companyContext.companySummary) parts.push(`Summary: ${companyContext.companySummary}`);
    if (companyContext.verificationFlags.length > 0) {
      parts.push(`Verification flags: ${companyContext.verificationFlags.map(f => `[${f.severity}] ${f.message}`).join("; ")}`);
    }
  }

  if (extraContext) {
    parts.push(`\nFollow-up research findings:`);
    if (extraContext.companySummary) parts.push(`  ${extraContext.companySummary}`);
    if (extraContext.verificationFlags.length > 0) {
      parts.push(`  Additional flags: ${extraContext.verificationFlags.map(f => `[${f.severity}] ${f.message}`).join("; ")}`);
    }
  }

  return parts.join("\n");
}
