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

export async function verifyWithPerplexity(jobData: {
  title: string;
  company: string;
  description: string;
  location?: string;
  companyWebsite?: string;
}): Promise<PerplexityVerification> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const query = [
    `Company: ${jobData.company}`,
    `Job Title: ${jobData.title}`,
    jobData.location ? `Location: ${jobData.location}` : null,
    jobData.companyWebsite ? `Website: ${jobData.companyWebsite}` : null,
  ]
    .filter(Boolean)
    .join("\n");

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
        {
          role: "system",
          content: `You are a company verification specialist. Your job is to verify whether a company and its job listing appear legitimate by searching the web for real information. Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Verify this company and job listing. Search the web for real information about the company.

${query}

Brief job description excerpt: ${jobData.description.substring(0, 500)}

Return ONLY valid JSON matching this schema:
{
  "companyExists": true/false (does this company appear to be a real, established entity?),
  "companyVerified": true/false (could you find credible web presence - official site, LinkedIn, news, reviews?),
  "verificationFlags": [
    {
      "severity": "critical" | "high" | "medium" | "low",
      "message": "specific finding about the company",
      "category": "company"
    }
  ],
  "companySummary": "Brief summary of what you found about the company (2-3 sentences)",
  "industryMatch": true/false (does the job title match what this company actually does?),
  "webPresenceScore": 0-100 (how strong is the company's web presence, higher = more established),
  "sources": ["urls of sources you found"]
}

If you find negative information (lawsuits, scam reports, BBB complaints, Glassdoor warnings), include those as verificationFlags. If the company has no web presence at all, that is itself a major red flag.`,
        },
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

  if (!content) {
    throw new Error("Perplexity returned empty response");
  }

  let jsonStr = content;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());

  const validSeverities = ["critical", "high", "medium", "low"];

  const verificationFlags: RedFlag[] = (parsed.verificationFlags || [])
    .filter(
      (f: any) =>
        f &&
        typeof f.message === "string" &&
        validSeverities.includes(f.severity)
    )
    .map((f: any) => ({
      severity: f.severity as RedFlagSeverity,
      message: `[Verified] ${f.message}`,
      category: "company" as const,
    }));

  const sources: string[] = [];
  if (data.citations && Array.isArray(data.citations)) {
    sources.push(...data.citations.slice(0, 5));
  }
  if (parsed.sources && Array.isArray(parsed.sources)) {
    for (const s of parsed.sources) {
      if (typeof s === "string" && !sources.includes(s)) {
        sources.push(s);
      }
    }
  }

  return {
    companyExists: !!parsed.companyExists,
    companyVerified: !!parsed.companyVerified,
    verificationFlags,
    companySummary: parsed.companySummary || "",
    industryMatch: parsed.industryMatch !== false,
    webPresenceScore: Math.max(0, Math.min(100, Math.round(parsed.webPresenceScore || 0))),
    sources: sources.slice(0, 8),
  };
}
