import type { RedFlag, RedFlagSeverity } from "@shared/schema";

export interface PerplexityVerification {
  companyExists: boolean;
  companyVerified: boolean;
  verificationFlags: RedFlag[];
  companySummary: string;
  industryMatch: boolean;
  webPresenceScore: number;
  sources: string[];
}

async function callPerplexity(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.1,
      return_images: false,
      return_related_questions: false,
    }),
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Perplexity returned empty response");

  const sources: string[] = [];
  if (data.citations && Array.isArray(data.citations)) {
    sources.push(...data.citations.slice(0, 8));
  }

  return JSON.stringify({ content, sources });
}

function parseVerificationJson(raw: string, sources: string[]): PerplexityVerification {
  let jsonStr = raw;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  const parsed = JSON.parse(jsonStr.trim());
  const validSeverities = ["critical", "high", "medium", "low"];

  const verificationFlags: RedFlag[] = (parsed.verificationFlags || [])
    .filter(
      (f: any) =>
        f && typeof f.message === "string" && validSeverities.includes(f.severity)
    )
    .map((f: any) => ({
      severity: f.severity as RedFlagSeverity,
      message: `[Verified] ${f.message}`,
      category: "company" as const,
    }));

  const allSources = [...sources];
  if (parsed.sources && Array.isArray(parsed.sources)) {
    for (const s of parsed.sources) {
      if (typeof s === "string" && !allSources.includes(s)) allSources.push(s);
    }
  }

  return {
    companyExists: !!parsed.companyExists,
    companyVerified: !!parsed.companyVerified,
    verificationFlags,
    companySummary: parsed.companySummary || "",
    industryMatch: parsed.industryMatch !== false,
    webPresenceScore: Math.max(0, Math.min(100, Math.round(parsed.webPresenceScore || 0))),
    sources: allSources.slice(0, 8),
  };
}

export async function verifyWithPerplexity(jobData: {
  title: string;
  company: string;
  description: string;
  location?: string;
  companyWebsite?: string;
}): Promise<PerplexityVerification> {
  const query = [
    `Company: ${jobData.company}`,
    `Job Title: ${jobData.title}`,
    jobData.location ? `Location: ${jobData.location}` : null,
    jobData.companyWebsite ? `Website: ${jobData.companyWebsite}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callPerplexity(
    `You are a company verification specialist. Your job is to verify whether a company and its job listing appear legitimate by searching the web for real information. Return ONLY valid JSON.`,
    `Verify this company and job listing. Search the web for real information about the company.

${query}

Brief job description excerpt: ${jobData.description.substring(0, 500)}

Return ONLY valid JSON matching this schema:
{
  "companyExists": true/false,
  "companyVerified": true/false,
  "verificationFlags": [{ "severity": "critical"|"high"|"medium"|"low", "message": "finding", "category": "company" }],
  "companySummary": "2-3 sentence summary of what you found",
  "industryMatch": true/false (does the job title match what this company actually does?),
  "webPresenceScore": 0-100 (higher = more established web presence),
  "sources": ["urls"]
}

Flag negative information (lawsuits, scam reports, BBB complaints, Glassdoor warnings). No web presence at all is a major red flag.`
  );

  const { content, sources } = JSON.parse(raw);
  return parseVerificationJson(content, sources);
}

export async function followUpWithPerplexity(followUpQuery: string): Promise<PerplexityVerification> {
  const raw = await callPerplexity(
    `You are an investigative researcher doing a targeted follow-up search about a company or job posting. Return ONLY valid JSON.`,
    `Search the web for the following specific information:

${followUpQuery}

Return ONLY valid JSON matching this schema:
{
  "companyExists": true/false,
  "companyVerified": true/false,
  "verificationFlags": [{ "severity": "critical"|"high"|"medium"|"low", "message": "specific finding", "category": "company" }],
  "companySummary": "Summary of what you found for this specific query",
  "industryMatch": true/false,
  "webPresenceScore": 0-100,
  "sources": ["urls"]
}

Be specific about what you found. Focus only on answering the follow-up query.`
  );

  const { content, sources } = JSON.parse(raw);
  return parseVerificationJson(content, sources);
}
