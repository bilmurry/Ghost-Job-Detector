import type { AnalysisResult } from "@shared/schema";
import type { JobPosting } from "@shared/schema";
import { verifyWithPerplexity, followUpWithPerplexity, type PerplexityVerification } from "./perplexityAI";
import { analyzeLanguageWithClaude, type ClaudeLanguageAnalysis } from "./claudeAI";
import { analyzeJobWithAI } from "./ghostAI";

export interface AgentState {
  listing: JobPosting;
  companyContext?: PerplexityVerification;
  extraContext?: PerplexityVerification;
  analysis?: ClaudeLanguageAnalysis;
  verdict?: AnalysisResult;
}

export interface AgentResult {
  verdict: AnalysisResult;
  state: AgentState;
  aiModels: AnalysisResult["aiModels"];
  looped: boolean;
}

export async function agentAnalyze(listing: JobPosting): Promise<AgentResult> {
  const state: AgentState = { listing };
  const aiModels: AnalysisResult["aiModels"] = {
    chatgpt: { scored: false },
    claude: { scored: false },
    perplexity: { scored: false },
  };
  let looped = false;

  // Step 1: Gather company context via Perplexity web search
  if (listing.company) {
    try {
      state.companyContext = await verifyWithPerplexity(listing);
      aiModels.perplexity = {
        scored: true,
        verification: {
          companyExists: state.companyContext.companyExists,
          companyVerified: state.companyContext.companyVerified,
          companySummary: state.companyContext.companySummary,
          industryMatch: state.companyContext.industryMatch,
          webPresenceScore: state.companyContext.webPresenceScore,
          sources: state.companyContext.sources,
        },
      };
    } catch (err) {
      console.error("[Agent] Perplexity step 1 failed:", err);
    }
  }

  // Step 2: Deep language analysis with company context
  try {
    state.analysis = await analyzeLanguageWithClaude(listing, state.companyContext);
    aiModels.claude = {
      scored: true,
      languageAnalysis: {
        manipulativeLanguage: state.analysis.manipulativeLanguage,
        vaguenessScore: state.analysis.vaguenesScore,
        professionalismScore: state.analysis.professionalismScore,
        writingQualityNotes: state.analysis.writingQualityNotes,
        overallAssessment: state.analysis.overallAssessment,
      },
    };
  } catch (err) {
    console.error("[Agent] Claude step 2 failed:", err);
  }

  // Step 3: If Claude needs more info, do a targeted follow-up search then re-analyze
  if (state.analysis?.needsMoreInfo && state.analysis.followUpQuery) {
    looped = true;
    console.log(`[Agent] Claude requested follow-up: "${state.analysis.followUpQuery}"`);

    try {
      state.extraContext = await followUpWithPerplexity(state.analysis.followUpQuery);

      // Update Perplexity panel with merged sources from both searches
      if (aiModels.perplexity?.scored && aiModels.perplexity.verification) {
        const merged = mergeVerifications(state.companyContext, state.extraContext);
        aiModels.perplexity.verification = {
          companyExists: merged.companyExists,
          companyVerified: merged.companyVerified,
          companySummary: merged.companySummary,
          industryMatch: merged.industryMatch,
          webPresenceScore: merged.webPresenceScore,
          sources: merged.sources,
        };
      } else if (state.extraContext) {
        aiModels.perplexity = {
          scored: true,
          verification: {
            companyExists: state.extraContext.companyExists,
            companyVerified: state.extraContext.companyVerified,
            companySummary: state.extraContext.companySummary,
            industryMatch: state.extraContext.industryMatch,
            webPresenceScore: state.extraContext.webPresenceScore,
            sources: state.extraContext.sources,
          },
        };
      }
    } catch (err) {
      console.error("[Agent] Perplexity follow-up failed:", err);
    }

    // Re-run Claude with the extra context
    try {
      state.analysis = await analyzeLanguageWithClaude(
        listing,
        state.companyContext,
        state.extraContext
      );
      aiModels.claude = {
        scored: true,
        languageAnalysis: {
          manipulativeLanguage: state.analysis.manipulativeLanguage,
          vaguenessScore: state.analysis.vaguenesScore,
          professionalismScore: state.analysis.professionalismScore,
          writingQualityNotes: state.analysis.writingQualityNotes,
          overallAssessment: state.analysis.overallAssessment,
        },
      };
    } catch (err) {
      console.error("[Agent] Claude re-analysis failed:", err);
    }
  }

  // Step 4: Final scoring by ChatGPT with all accumulated context
  try {
    state.verdict = await analyzeJobWithAI(
      listing,
      state.companyContext,
      state.extraContext,
      state.analysis ?? undefined
    );
    aiModels.chatgpt.scored = true;
  } catch (err) {
    console.error("[Agent] ChatGPT final scoring failed:", err);
    throw err;
  }

  // Merge all red flags from Claude and Perplexity into the final verdict
  if (state.analysis) {
    state.verdict.redFlags.push(...state.analysis.toneFlags);
  }
  if (state.companyContext) {
    state.verdict.redFlags.push(...state.companyContext.verificationFlags);
    if (!state.companyContext.companyExists) {
      state.verdict.ghostScore = Math.min(100, state.verdict.ghostScore + 15);
      state.verdict.redFlags.push({
        severity: "critical",
        message: "[Verified] Company could not be found in web searches — may not exist",
        category: "company",
      });
    } else if (!state.companyContext.companyVerified) {
      state.verdict.ghostScore = Math.min(100, state.verdict.ghostScore + 8);
    }
    if (!state.companyContext.industryMatch && state.companyContext.companyExists) {
      state.verdict.ghostScore = Math.min(100, state.verdict.ghostScore + 5);
      state.verdict.redFlags.push({
        severity: "medium",
        message: "[Verified] Job title does not match the company's known industry or business",
        category: "company",
      });
    }
    if (state.companyContext.webPresenceScore < 20 && state.companyContext.companyExists) {
      state.verdict.ghostScore = Math.min(100, state.verdict.ghostScore + 5);
    }
    if (state.companyContext.companyVerified && state.companyContext.webPresenceScore > 70) {
      state.verdict.confidence = Math.min(100, state.verdict.confidence + 10);
    }
  }
  if (state.extraContext) {
    state.verdict.redFlags.push(...state.extraContext.verificationFlags);
  }

  // Deduplicate red flags
  state.verdict.redFlags = dedupeFlags(state.verdict.redFlags);
  state.verdict.riskLevel = getRiskLevel(state.verdict.ghostScore);
  state.verdict.aiModels = aiModels;

  return { verdict: state.verdict, state, aiModels, looped };
}

function mergeVerifications(
  primary?: PerplexityVerification,
  extra?: PerplexityVerification
): PerplexityVerification {
  if (!primary && !extra) throw new Error("No verification to merge");
  if (!primary) return extra!;
  if (!extra) return primary;

  const mergedSources = [...primary.sources];
  for (const s of extra.sources) {
    if (!mergedSources.includes(s)) mergedSources.push(s);
  }

  return {
    companyExists: primary.companyExists || extra.companyExists,
    companyVerified: primary.companyVerified || extra.companyVerified,
    verificationFlags: [...primary.verificationFlags, ...extra.verificationFlags],
    companySummary: primary.companySummary
      ? `${primary.companySummary} ${extra.companySummary}`.trim()
      : extra.companySummary,
    industryMatch: primary.industryMatch && extra.industryMatch,
    webPresenceScore: Math.max(primary.webPresenceScore, extra.webPresenceScore),
    sources: mergedSources.slice(0, 8),
  };
}

function dedupeFlags(flags: AnalysisResult["redFlags"]) {
  const seen = new Set<string>();
  return flags.filter((f) => {
    const key = `${f.severity}:${f.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRiskLevel(score: number): AnalysisResult["riskLevel"] {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low-medium";
  return "low";
}
