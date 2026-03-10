import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSEO } from "@/hooks/use-seo";
import {
  Ghost,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  FileText,
  Building2,
  Clock,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogIn,
  LogOut,
  History,
  ScanLine,
  ArrowRight,
  Smartphone,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Globe,
  Calendar,
  Repeat2,
  Chrome,
  Brain,
  Eye,
  Sparkles,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { usePageTracker } from "@/hooks/use-page-tracker";
import { apiRequest } from "@/lib/queryClient";
import {
  jobPostingSchema,
  type JobPosting,
  type AnalysisResult,
  type RedFlag,
  type RedFlagSeverity,
  type RepostDetection,
} from "@shared/schema";

const severityConfig: Record<
  RedFlagSeverity,
  { color: string; bgColor: string; dotColor: string; icon: typeof AlertTriangle; label: string }
> = {
  critical: {
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-500/5 dark:bg-red-500/10 border-red-500/15 dark:border-red-500/20",
    dotColor: "bg-red-500",
    icon: AlertTriangle,
    label: "Critical",
  },
  high: {
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/15 dark:border-orange-500/20",
    dotColor: "bg-orange-500",
    icon: AlertCircle,
    label: "High",
  },
  medium: {
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/15 dark:border-amber-500/20",
    dotColor: "bg-amber-500",
    icon: Info,
    label: "Medium",
  },
  low: {
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/20",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
    label: "Low",
  },
};

const riskLevelConfig: Record<
  string,
  { color: string; strokeColor: string; textColor: string; icon: typeof Ghost }
> = {
  high: {
    color: "from-red-500 to-red-600",
    strokeColor: "stroke-red-500",
    textColor: "text-red-500 dark:text-red-400",
    icon: Ghost,
  },
  medium: {
    color: "from-amber-500 to-amber-600",
    strokeColor: "stroke-amber-500",
    textColor: "text-amber-500 dark:text-amber-400",
    icon: Ghost,
  },
  "low-medium": {
    color: "from-orange-500 to-orange-600",
    strokeColor: "stroke-orange-500",
    textColor: "text-orange-500 dark:text-orange-400",
    icon: Ghost,
  },
  low: {
    color: "from-emerald-500 to-emerald-600",
    strokeColor: "stroke-emerald-500",
    textColor: "text-emerald-500 dark:text-emerald-400",
    icon: Ghost,
  },
};

function RiskScoreCircle({ score, riskLevel }: { score: number; riskLevel: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const config = riskLevelConfig[riskLevel] || riskLevelConfig.low;

  return (
    <div className="relative w-36 h-36 mx-auto" data-testid="risk-score-circle">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/40"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={config.strokeColor}
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-4xl font-semibold tracking-tight ${config.textColor}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          data-testid="text-risk-score"
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Ghost Score</span>
      </div>
    </div>
  );
}

function RecommendationPanel({
  recommendation,
  riskLevel,
  confidence,
}: {
  recommendation: string;
  riskLevel: string;
  confidence: number;
}) {
  const config = riskLevelConfig[riskLevel] || riskLevelConfig.low;
  const Icon = config.icon;

  const riskLabels: Record<string, string> = {
    high: "High Risk Detected",
    medium: "Proceed with Caution",
    "low-medium": "Some Concerns Noted",
    low: "Appears Legitimate",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Icon className={`w-5 h-5 ${config.textColor}`} />
              <h3 className={`text-base font-semibold ${config.textColor}`}>
                {riskLabels[riskLevel] || "Analysis Complete"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1.5">Confidence</div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-foreground/30"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                />
              </div>
            </div>
            <span className="text-sm font-medium tabular-nums" data-testid="text-confidence">{confidence}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RedFlagsSection({ flags = [] }: { flags?: RedFlag[] }) {
  const [openSections, setOpenSections] = useState<Set<RedFlagSeverity>>(
    new Set<RedFlagSeverity>(["critical", "high"])
  );

  const groupedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.severity]) acc[flag.severity] = [];
    acc[flag.severity].push(flag);
    return acc;
  }, {} as Record<RedFlagSeverity, RedFlag[]>);

  const severityOrder: RedFlagSeverity[] = ["critical", "high", "medium", "low"];

  const toggleSection = (severity: RedFlagSeverity) => {
    const newSections = new Set(openSections);
    if (newSections.has(severity)) {
      newSections.delete(severity);
    } else {
      newSections.add(severity);
    }
    setOpenSections(newSections);
  };

  if (flags.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Ghost className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No red flags detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {severityOrder.map((severity) => {
        const severityFlags = groupedFlags[severity];
        if (!severityFlags || severityFlags.length === 0) return null;

        const config = severityConfig[severity];
        const isOpen = openSections.has(severity);

        return (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: severityOrder.indexOf(severity) * 0.1 }}
          >
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(severity)}>
              <Card className={`border ${config.bgColor}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                        <CardTitle className="text-sm font-medium tracking-tight">
                          {config.label}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {severityFlags.length}
                        </Badge>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    <ul className="space-y-2.5">
                      {severityFlags.map((flag, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm text-foreground/75"
                          data-testid={`flag-${severity}-${idx}`}
                        >
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
                          <span className="leading-relaxed">{flag.message}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        );
      })}
    </div>
  );
}

function AnalysisCategoryCard({
  title,
  icon: Icon,
  score,
  flags,
  delay,
}: {
  title: string;
  icon: typeof FileText;
  score: number;
  flags: string[];
  delay: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 50) return "text-red-500 dark:text-red-400";
    if (score >= 30) return "text-amber-500 dark:text-amber-400";
    if (score >= 15) return "text-orange-500 dark:text-orange-400";
    return "text-emerald-500 dark:text-emerald-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
            </div>
            <span className={`text-lg font-semibold tabular-nums ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {flags.length > 0 ? (
            <ul className="space-y-1.5">
              {flags.slice(0, 3).map((flag, idx) => (
                <li
                  key={idx}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                  <span className="line-clamp-2 leading-relaxed">{flag}</span>
                </li>
              ))}
              {flags.length > 3 && (
                <li className="text-xs text-muted-foreground/50">
                  +{flags.length - 3} more
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" />
              No issues
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RepostDetectionSection({ data }: { data: RepostDetection }) {
  if (!data.isRepost) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium" data-testid="text-repost-status">First time we've seen this listing</p>
                <p className="text-xs text-muted-foreground">No duplicate or reposted versions detected in our database.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
    >
      <Card className="border-amber-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Repeat2 className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-medium" data-testid="text-repost-alert">Repost Detected</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs" data-testid="badge-repost-count">
              Seen {data.repostCount} time{data.repostCount !== 1 ? "s" : ""} before
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold tabular-nums" data-testid="text-repost-total">{data.repostCount}</div>
              <div className="text-xs text-muted-foreground">Previous Posts</div>
            </div>
            {data.firstSeen && (
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs font-medium" data-testid="text-first-seen">
                  {new Date(data.firstSeen).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">First Seen</div>
              </div>
            )}
            {data.sites.length > 0 && (
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <div className="text-xs font-medium" data-testid="text-repost-sites">{data.sites.join(", ")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Sources</div>
              </div>
            )}
          </div>

          {data.similarListings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Similar Listings</p>
              {data.similarListings.slice(0, 3).map((listing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 text-xs p-2 rounded bg-muted/30"
                  data-testid={`similar-listing-${idx}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{listing.title || "Untitled"}</span>
                    <span className="text-muted-foreground flex-shrink-0">{listing.source}</span>
                  </div>
                  {listing.ghostScore !== null && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Score: {listing.ghostScore}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}


function ResultsDisplay({ result }: { result: AnalysisResult }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <RiskScoreCircle score={result.ghostScore} riskLevel={result.riskLevel} />
              <Badge
                variant="secondary"
                className="mt-4"
                data-testid="badge-risk-level"
              >
                {(result?.riskLevel || "unknown")
                  .replace("-", " ")
                  .toUpperCase()}{" "}
                RISK
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <div className="lg:col-span-2">
          <RecommendationPanel
            recommendation={result.recommendation}
            riskLevel={result.riskLevel}
            confidence={result.confidence}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AnalysisCategoryCard
          title="Content"
          icon={FileText}
          score={result.detailedAnalysis?.contentAnalysis?.score ?? 0}
          flags={result.detailedAnalysis?.contentAnalysis?.flags ?? []}
          delay={0.4}
        />
        <AnalysisCategoryCard
          title="Company"
          icon={Building2}
          score={result.detailedAnalysis?.companyVerification?.score ?? 0}
          flags={result.detailedAnalysis?.companyVerification?.flags ?? []}
          delay={0.5}
        />
        <AnalysisCategoryCard
          title="Patterns"
          icon={Clock}
          score={result.detailedAnalysis?.postingPatterns?.score ?? 0}
          flags={result.detailedAnalysis?.postingPatterns?.flags ?? []}
          delay={0.6}
        />
        <AnalysisCategoryCard
          title="Communication"
          icon={MessageSquare}
          score={result.detailedAnalysis?.communication?.score ?? 0}
          flags={result.detailedAnalysis?.communication?.flags ?? []}
          delay={0.7}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Detected Issues</h3>
        <RedFlagsSection flags={result.redFlags} />
      </motion.div>

      {result.repostDetection && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Repost Detection</h3>
          <RepostDetectionSection data={result.repostDetection} />
        </div>
      )}

      {result.aiModels && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">AI Analysis Layer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className={result.aiModels.chatgpt.scored ? "border-green-500/30" : "border-muted"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold" data-testid="text-model-chatgpt">ChatGPT</span>
                  {result.aiModels.chatgpt.scored ? (
                    <Badge variant="secondary" className="ml-auto text-xs bg-green-500/10 text-green-600 dark:text-green-400">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto text-xs">Fallback</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Risk scoring and red flag detection</p>
              </CardContent>
            </Card>

            <Card className={result.aiModels.claude.scored ? "border-violet-500/30" : "border-muted"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold" data-testid="text-model-claude">Claude</span>
                  {result.aiModels.claude.scored ? (
                    <Badge variant="secondary" className="ml-auto text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto text-xs">Unavailable</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Language and tone analysis</p>
              </CardContent>
            </Card>

            <Card className={result.aiModels.perplexity.scored ? "border-blue-500/30" : "border-muted"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold" data-testid="text-model-perplexity">Perplexity</span>
                  {result.aiModels.perplexity.scored ? (
                    <Badge variant="secondary" className="ml-auto text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-auto text-xs">Unavailable</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Company verification via web search</p>
              </CardContent>
            </Card>
          </div>

          {result.aiModels.claude.scored && result.aiModels.claude.languageAnalysis && (
            <Card className="mt-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold">Language Analysis</span>
                  <span className="text-xs text-muted-foreground">by Claude</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-vagueness-score" style={{ color: result.aiModels.claude.languageAnalysis.vaguenessScore > 60 ? '#F59E0B' : '#10B981' }}>
                      {result.aiModels.claude.languageAnalysis.vaguenessScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Vagueness</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-professionalism-score" style={{ color: result.aiModels.claude.languageAnalysis.professionalismScore > 60 ? '#10B981' : '#F59E0B' }}>
                      {result.aiModels.claude.languageAnalysis.professionalismScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Professionalism</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center col-span-2 sm:col-span-1">
                    <div className="text-lg font-bold" data-testid="text-manipulative" style={{ color: result.aiModels.claude.languageAnalysis.manipulativeLanguage ? '#EF4444' : '#10B981' }}>
                      {result.aiModels.claude.languageAnalysis.manipulativeLanguage ? "Yes" : "No"}
                    </div>
                    <div className="text-xs text-muted-foreground">Manipulative</div>
                  </div>
                </div>
                {result.aiModels.claude.languageAnalysis.overallAssessment && (
                  <p className="text-sm text-muted-foreground" data-testid="text-language-assessment">
                    {result.aiModels.claude.languageAnalysis.overallAssessment}
                  </p>
                )}
                {result.aiModels.claude.languageAnalysis.writingQualityNotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.aiModels.claude.languageAnalysis.writingQualityNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-violet-500 mt-0.5">-</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.aiModels.perplexity.scored && result.aiModels.perplexity.verification && (
            <Card className="mt-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">Company Verification</span>
                  <span className="text-xs text-muted-foreground">by Perplexity</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-company-exists" style={{ color: result.aiModels.perplexity.verification.companyExists ? '#10B981' : '#EF4444' }}>
                      {result.aiModels.perplexity.verification.companyExists ? "Yes" : "No"}
                    </div>
                    <div className="text-xs text-muted-foreground">Exists</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-company-verified" style={{ color: result.aiModels.perplexity.verification.companyVerified ? '#10B981' : '#F59E0B' }}>
                      {result.aiModels.perplexity.verification.companyVerified ? "Yes" : "No"}
                    </div>
                    <div className="text-xs text-muted-foreground">Verified</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-industry-match" style={{ color: result.aiModels.perplexity.verification.industryMatch ? '#10B981' : '#F59E0B' }}>
                      {result.aiModels.perplexity.verification.industryMatch ? "Yes" : "No"}
                    </div>
                    <div className="text-xs text-muted-foreground">Industry Match</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="text-lg font-bold" data-testid="text-web-presence" style={{ color: result.aiModels.perplexity.verification.webPresenceScore > 50 ? '#10B981' : '#F59E0B' }}>
                      {result.aiModels.perplexity.verification.webPresenceScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Web Presence</div>
                  </div>
                </div>
                {result.aiModels.perplexity.verification.companySummary && (
                  <p className="text-sm text-muted-foreground mb-2" data-testid="text-company-summary">
                    {result.aiModels.perplexity.verification.companySummary}
                  </p>
                )}
                {result.aiModels.perplexity.verification.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.aiModels.perplexity.verification.sources
                      .filter((source) => {
                        try { const u = new URL(source); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
                      })
                      .map((source, i) => (
                      <a
                        key={i}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 bg-blue-500/10 rounded px-2 py-0.5"
                        data-testid={`link-source-${i}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {(() => {
                          try { return new URL(source).hostname.replace('www.', ''); } catch { return 'source'; }
                        })()}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

    </motion.div>
  );
}

function JobInputForm({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (data: JobPosting) => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");

  const form = useForm<JobPosting>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      salary: undefined,
      requirements: "",
      contactEmail: "",
    },
  });

  const onSubmit = (data: JobPosting) => {
    onAnalyze(data);
  };

  const loadExample = () => {
    form.setValue("title", "Marketing Manager - Work From Home!");
    form.setValue("company", "Success Unlimited LLC");
    form.setValue(
      "description",
      "Make $150,000+ working just 10 hours per week! No experience needed - we train everyone. This is a ground-floor opportunity to join our revolutionary team. Send $50 for training materials to get started immediately. Unlimited income potential! Get rich quick with our proven system. Must be 18+ to apply."
    );
    form.setValue("salary", 150000);
    form.setValue("requirements", "Must be 18+ and have internet access. Anyone can apply!");
    form.setValue("contactEmail", "opportunities123@gmail.com");
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg font-semibold tracking-tight">Analyze Job Posting</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadExample}
            type="button"
            data-testid="button-load-example"
          >
            Load Example
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" data-testid="tab-manual-entry">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="url" data-testid="tab-url-entry">
              From Job Site
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 dark:bg-muted/20 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center mt-0.5">
                    <Chrome className="w-4.5 h-4.5 text-teal-500 dark:text-teal-400" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Scan directly from job sites</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Install our Chrome extension to scan job listings right from LinkedIn, Indeed, Glassdoor, and ZipRecruiter. The extension reads the page you're already viewing. No data is fetched from company servers.
                    </p>
                    <Link href="/extension">
                      <Button variant="outline" size="sm" className="mt-2" data-testid="button-get-extension-cta">
                        <Chrome className="w-3.5 h-3.5 mr-1.5" />
                        Get the Extension
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 dark:bg-muted/20 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center mt-0.5">
                    <FileText className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Or paste the job details manually</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Copy the job title, company, and description from the listing and paste them into the form. We'll analyze the content without ever contacting the job site.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setActiveTab("manual")} data-testid="button-switch-manual">
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                      Go to Manual Entry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Software Engineer"
                            {...field}
                            data-testid="input-job-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Company *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Acme Corp"
                            {...field}
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full job description here..."
                          className="min-h-32 resize-y"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Salary (Annual USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 80000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            data-testid="input-salary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="e.g., hr@company.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Requirements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List job requirements and qualifications..."
                          className="min-h-20 resize-y"
                          {...field}
                          data-testid="textarea-requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-analyze"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4 mr-2" />
                      Analyze Posting
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  usePageTracker();
  useSEO({
    title: "Ghost Job Detector | Spot Fake Job Listings Before You Apply",
    description: "Free AI-powered tool to detect ghost jobs, scam indicators, and red flags in job postings. Scan listings from LinkedIn, Indeed, Glassdoor, and ZipRecruiter instantly.",
    path: "/",
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: JobPosting) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return (await response.json()) as AnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleNewAnalysis = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
                <img src="/ghost-logo.png" alt="Ghost Job Detector" className="w-9 h-9 rounded" />
                <span className="text-sm font-semibold tracking-tight text-teal-600 dark:text-teal-400">Ghost Job Detector</span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/about">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-about"
                >
                  About
                </Button>
              </Link>
              <Link href="/extension">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-get-extension"
                >
                  <Chrome className="w-4 h-4 mr-1.5" />
                  Extension
                </Button>
              </Link>
              {result && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewAnalysis}
                  data-testid="button-new-analysis"
                >
                  New Analysis
                </Button>
              )}
              {isAuthenticated && (
                <Link href="/history">
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <ThemeToggle />
              {authLoading ? (
                <Button variant="ghost" size="icon" disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground hidden sm:block mr-1">
                    {user.firstName || user.email?.split("@")[0]}
                  </span>
                  <a href="/api/logout">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              ) : (
                <a href="/api/login">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto pt-8 pb-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-4xl font-bold tracking-tight sm:text-5xl" data-testid="text-hero-title">
                    The Original{" "}
                    <span className="text-teal-600 dark:text-teal-400">Ghost Job Hunter</span>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
                    Scan job postings and uncover ghost listings, hiring red flags, and scams before you apply.
                  </p>
                  <p className="mt-3 text-sm text-teal-600 dark:text-teal-400 italic leading-relaxed" data-testid="text-hero-brand">
                    The job market shouldn't feel like chasing ghosts. GhostJobDetector helps you see which opportunities are real.
                  </p>
                </motion.div>
              </div>

              <div className="max-w-3xl mx-auto">
                <JobInputForm
                  onAnalyze={analyzeMutation.mutate}
                  isLoading={analyzeMutation.isPending}
                />
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: FileText, label: "Content Analysis", desc: "Suspicious keywords" },
                    { icon: Building2, label: "Company Checks", desc: "Domain verification" },
                    { icon: Clock, label: "Pattern Detection", desc: "Posting anomalies" },
                    { icon: MessageSquare, label: "Communication", desc: "Response signals" },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      <Card className="text-center">
                        <CardContent className="p-4">
                          <item.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-xs font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsDisplay result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex items-center justify-center gap-2" data-testid="link-mobile-app">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Mobile App:{" "}
              <span className="font-medium text-foreground">Coming Soon</span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/privacy">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-privacy-footer">
                Privacy & Data Practices
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">·</span>
            <Link href="/about">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="link-about-footer">
                About
              </span>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground text-center" data-testid="text-footer-disclaimer">
            We never contact job sites directly. All content is provided by users via the Chrome extension or manual entry.
          </p>
          <p className="text-xs text-muted-foreground text-center" data-testid="text-patent-pending">
            Patent Pending
          </p>
          <p className="text-xs text-muted-foreground text-center" data-testid="text-footer-name">
            GhostJobDetector 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
