import Anthropic from "@anthropic-ai/sdk";
import type { RedFlag, RedFlagSeverity } from "@shared/schema";

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
}

export async function analyzeLanguageWithClaude(jobData: {
  title: string;
  company: string;
  description: string;
  salary?: string | number;
  requirements?: string;
}): Promise<ClaudeLanguageAnalysis> {
  const jobText = [
    `Job Title: ${jobData.title}`,
    `Company: ${jobData.company}`,
    `Description: ${jobData.description}`,
    jobData.salary ? `Salary: ${jobData.salary}` : null,
    jobData.requirements ? `Requirements: ${jobData.requirements}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a linguistics expert analyzing job postings for deceptive, manipulative, or low-quality language patterns. Focus purely on the LANGUAGE and WRITING -- not business logic.

Analyze this job posting and return ONLY valid JSON matching this schema:
{
  "toneFlags": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "message": "description of the language issue",
      "category": "content" | "company" | "patterns" | "communication"
    }
  ],
  "manipulativeLanguage": true/false,
  "vaguenessScore": 0-100 (how vague is the posting, higher = more vague),
  "professionalismScore": 0-100 (how professional is the writing, higher = more professional),
  "writingQualityNotes": ["specific observations about writing quality"],
  "overallAssessment": "1-2 sentence summary of language analysis"
}

Look for:
- Emotional manipulation (fear of missing out, artificial urgency, flattery)
- Evasive or deliberately vague language about job duties, pay, or company identity
- Inconsistent tone (mixing corporate speak with informal hype)
- Copy-paste or template language that suggests mass-produced listings
- Grammatical patterns common in scam postings (odd phrasing, non-native patterns used to evade filters)
- Overuse of buzzwords without substance
- Passive voice to hide who does what
- Promises without specifics

Be fair. Many legitimate postings use some marketing language. Flag only genuinely concerning patterns.

Job posting:
${jobText}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Claude returned non-text response");
  }

  let jsonStr = content.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

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
  };
}
