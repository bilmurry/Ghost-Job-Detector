import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
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
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowRight,
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
import { apiRequest } from "@/lib/queryClient";
import {
  jobPostingSchema,
  type JobPosting,
  type AnalysisResult,
  type RedFlag,
  type RedFlagSeverity,
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
  { color: string; strokeColor: string; textColor: string; icon: typeof ShieldCheck }
> = {
  high: {
    color: "from-red-500 to-red-600",
    strokeColor: "stroke-red-500",
    textColor: "text-red-500 dark:text-red-400",
    icon: ShieldX,
  },
  medium: {
    color: "from-amber-500 to-amber-600",
    strokeColor: "stroke-amber-500",
    textColor: "text-amber-500 dark:text-amber-400",
    icon: ShieldAlert,
  },
  "low-medium": {
    color: "from-orange-500 to-orange-600",
    strokeColor: "stroke-orange-500",
    textColor: "text-orange-500 dark:text-orange-400",
    icon: ShieldAlert,
  },
  low: {
    color: "from-emerald-500 to-emerald-600",
    strokeColor: "stroke-emerald-500",
    textColor: "text-emerald-500 dark:text-emerald-400",
    icon: ShieldCheck,
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
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Risk Score</span>
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
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
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
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" data-testid="tab-manual-entry">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="url" data-testid="tab-url-entry" disabled>
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <div className="text-center py-12 text-muted-foreground">
              <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">URL analysis coming soon</p>
              <p className="text-xs mt-1 text-muted-foreground/60">
                Use manual entry for now
              </p>
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
                <Shield className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-tight">Ghost Job Detector</span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
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
              <div className="text-center max-w-xl mx-auto pt-8 pb-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Is that job real?
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                    Detect red flags, scam indicators, and ghost jobs that companies
                    post with no intention of hiring.
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Ghost Job Detector</span>
            </div>
            <p>
              Guidance only. Always verify through official channels.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
