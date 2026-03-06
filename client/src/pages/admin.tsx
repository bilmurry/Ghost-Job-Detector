import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Users,
  BarChart3,
  Eye,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Clock,
  FileSearch,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AdminStats {
  users: { total: number };
  analyses: { total: number };
  pageViews: { today: number; week: number; total: number };
  recentUsers: Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    ghostScore: number;
    riskLevel: string;
    createdAt: string;
  }>;
  dailyViews: Array<{ date: string; views: number }>;
  topPaths: Array<{ path: string; views: number }>;
}

function riskColor(level: string) {
  switch (level.toLowerCase()) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "secondary";
  }
}

export default function Admin() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loader-admin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm" data-testid="card-admin-unauthorized">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-sm text-muted-foreground">You must be signed in to view this page.</p>
            <a href="/api/login">
              <Button data-testid="button-admin-login">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
            <Link href="/">
              <Button variant="outline" data-testid="button-admin-back">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-admin-home">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold" data-testid="text-admin-title">Admin Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-stat-users">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-users">{stats.users.total}</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-analyses">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Analyses</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-analyses">{stats.analyses.total}</p>
                </div>
                <FileSearch className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-views-today">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Views Today</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-views-today">{stats.pageViews.today}</p>
                </div>
                <Eye className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-views-total">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Views (7 days)</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-views-week">{stats.pageViews.week}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {stats.dailyViews.length > 0 && (
          <Card data-testid="card-chart-views">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Page Views (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-recent-users">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-user-${user.id}`}>
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName || "Unknown"} {user.lastName || ""}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-recent-analyses">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="w-5 h-5" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analyses yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-analysis-${analysis.id}`}>
                      <div>
                        <p className="text-sm font-medium">{analysis.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">{analysis.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{analysis.ghostScore}%</span>
                        <Badge variant={riskColor(analysis.riskLevel)} data-testid={`badge-risk-${analysis.id}`}>
                          {analysis.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {stats.topPaths.length > 0 && (
          <Card data-testid="card-top-paths">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Top Pages (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topPaths.map((item, i) => (
                  <div key={item.path} className="flex items-center justify-between py-1.5" data-testid={`row-path-${i}`}>
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">{item.path}</code>
                    <span className="text-sm text-muted-foreground">{item.views} views</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
