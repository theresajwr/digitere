import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

const COLORS = ["#10b981", "#3b82f6", "#6b7280", "#a855f7", "#ef4444"];

export default function InsightsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("week");

  // Calculate date range
  const today = new Date();
  let startDate: Date;
  let endDate = endOfDay(today);

  if (selectedPeriod === "week") {
    startDate = startOfDay(subDays(today, 7));
  } else if (selectedPeriod === "month") {
    startDate = startOfDay(subDays(today, 30));
  } else {
    startDate = startOfDay(subDays(today, 365));
  }

  // Get mood data
  const moodQuery = trpc.mood.getByRange.useQuery({
    startDate,
    endDate,
  });

  // Generate insights
  const generateInsightsMutation = trpc.insights.generateInsights.useMutation({
    onSuccess: () => {
      toast.success("Insights generated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate insights");
    },
  });

  const handleGenerateInsights = async () => {
    await generateInsightsMutation.mutateAsync({
      period: selectedPeriod,
      periodStart: startDate,
      periodEnd: endDate,
    });
  };

  // Calculate statistics
  const moods = moodQuery.data || [];
  const moodCounts: Record<string, number> = {
    excellent: 0,
    good: 0,
    neutral: 0,
    sad: 0,
    terrible: 0,
  };

  let totalIntensity = 0;
  moods.forEach((m) => {
    if (m.mood) {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    }
    totalIntensity += m.moodIntensity || 0;
  });

  const averageIntensity = moods.length > 0 ? (totalIntensity / moods.length).toFixed(1) : "0";
  const dominantMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral";

  // Prepare chart data
  const chartData = Object.entries(moodCounts).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count,
  }));

  // Daily trend data
  const dailyData: Record<string, number> = {};
  moods.forEach((m) => {
    const date = new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyData[date] = (dailyData[date] || 0) + (m.moodIntensity || 0);
  });

  const trendData = Object.entries(dailyData).map(([date, intensity]) => ({
    date,
    intensity: parseFloat((intensity / (moods.filter(m => new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) === date).length || 1)).toFixed(1)),
  }));

  const moodEmoji: Record<string, string> = {
    excellent: "😄",
    good: "🙂",
    neutral: "😐",
    sad: "😔",
    terrible: "😢",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mood Insights</h1>
              <p className="text-muted-foreground">Analyze your emotional patterns and trends</p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(["week", "month", "year"] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period)}
              className={selectedPeriod === period ? "bg-accent hover:bg-accent/90 text-white" : ""}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
          <Button
            className="ml-auto bg-accent hover:bg-accent/90 text-white"
            onClick={handleGenerateInsights}
            disabled={generateInsightsMutation.isPending || moods.length === 0}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Generate Insights
          </Button>
        </div>

        {moods.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">No mood data available for this period. Start tracking your mood to see insights!</p>
              <Button
                className="bg-accent hover:bg-accent/90 text-white"
                onClick={() => navigate("/mood")}
              >
                Log Your Mood
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="card-elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{moods.length}</p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{averageIntensity}/10</p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Dominant Mood</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{moodEmoji[dominantMood]}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">{dominantMood}</p>
                </CardContent>
              </Card>

              <Card className="card-elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Best Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">
                    {moodEmoji[Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral"]}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Mood Distribution Pie Chart */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>Breakdown of your moods this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Mood Trend Bar Chart */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Mood Trend</CardTitle>
                  <CardDescription>Average intensity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="intensity" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Mood Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(moodCounts).map(([mood, count]) => (
                    <div key={mood} className="text-center">
                      <p className="text-3xl mb-2">{moodEmoji[mood]}</p>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{mood}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {moods.length > 0 ? ((count / moods.length) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
