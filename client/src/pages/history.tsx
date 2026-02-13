import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
  ArrowLeft,
  Trash2,
  Eye,
  Calendar,
  Building2,
  Briefcase,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import type { Analysis } from "@shared/models/auth";
import type { AnalysisResult, JobPosting } from "@shared/schema";

const riskLevelConfig: Record<string, { color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  high: {
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-500/10 dark:bg-red-500/15",
    icon: ShieldX,
  },
  medium: {
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
    icon: ShieldAlert,
  },
  "low-medium": {
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-500/10 dark:bg-orange-500/15",
    icon: ShieldAlert,
  },
  low: {
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
    icon: ShieldCheck,
  },
};

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnalysisCard({
  analysis,
  onView,
  onDelete,
}: {
  analysis: Analysis;
  onView: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
}) {
  const config = riskLevelConfig[analysis.riskLevel] || riskLevelConfig.low;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="hover-elevate">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-md ${config.bgColor} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate tracking-tight" data-testid={`text-job-title-${analysis.id}`}>
                  {analysis.jobTitle}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate" data-testid={`text-company-${analysis.id}`}>
                    {analysis.company}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className={`text-xs ${config.color}`}>
                    Score: {analysis.ghostScore}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {analysis.redFlagsCount} flags
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(analysis.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(analysis)}
                data-testid={`button-view-${analysis.id}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(analysis.id)}
                data-testid={`button-delete-${analysis.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnalysisDetailDialog({
  analysis,
  open,
  onClose,
}: {
  analysis: Analysis | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!analysis) return null;

  const result = analysis.analysisResult as AnalysisResult;
  const jobPosting = analysis.jobPosting as JobPosting;
  const config = riskLevelConfig[analysis.riskLevel] || riskLevelConfig.low;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-tight">
            <Icon className={`w-5 h-5 ${config.color}`} />
            {analysis.jobTitle}
          </DialogTitle>
          <DialogDescription>
            {analysis.company} - {formatDate(analysis.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-6 p-4 rounded-md bg-muted/50">
            <div className="text-center">
              <div className={`text-3xl font-semibold tabular-nums ${config.color}`}>
                {analysis.ghostScore}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Risk Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold tabular-nums text-muted-foreground">
                {analysis.confidence}%
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Confidence</div>
            </div>
            <div className="flex-1 text-right">
              <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {analysis.riskLevel.replace("-", " ").toUpperCase()} RISK
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recommendation</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.recommendation}</p>
          </div>

          {result.redFlags && result.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Red Flags ({result.redFlags.length})
              </h4>
              <ul className="space-y-1.5">
                {result.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                    <span className="leading-relaxed">{flag.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Job Details</h4>
            <div className="text-sm text-foreground/70 space-y-1">
              <p><span className="text-foreground/90 font-medium">Title:</span> {jobPosting.title}</p>
              <p><span className="text-foreground/90 font-medium">Company:</span> {jobPosting.company}</p>
              {jobPosting.salary && <p><span className="text-foreground/90 font-medium">Salary:</span> ${jobPosting.salary.toLocaleString()}</p>}
              {jobPosting.contactEmail && <p><span className="text-foreground/90 font-medium">Email:</span> {jobPosting.contactEmail}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-dialog">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5" />
            <div>
              <span className="text-sm font-semibold tracking-tight">Ghost Job Detector</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">{subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function History() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
    },
  });

  const handleView = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader subtitle="History" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-10 text-center">
              <LogIn className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold tracking-tight mb-1">Sign in to view history</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Your analysis history will be saved when you're signed in.
              </p>
              <a href="/api/login">
                <Button data-testid="button-login-history">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
              </a>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader subtitle="History" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Analysis History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.firstName ? `${user.firstName}'s` : "Your"} past job posting analyses
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16" data-testid="loading-analyses">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="space-y-2" data-testid="analyses-list">
            <AnimatePresence>
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-base font-medium mb-1">No analyses yet</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Your job posting analyses will appear here.
              </p>
              <Link href="/">
                <Button data-testid="button-start-analyzing">
                  Start Analyzing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      <AnalysisDetailDialog
        analysis={selectedAnalysis}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedAnalysis(null);
        }}
      />
    </div>
  );
}
