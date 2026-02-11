import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Heart, BookOpen, TrendingUp, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [todayMood, setTodayMood] = useState<string | null>(null);

  // Get today's mood
  const moodQuery = trpc.mood.getByDate.useQuery(
    { date: new Date() },
    { enabled: isAuthenticated }
  );

  // Get habits list
  const habitsQuery = trpc.habits.list.useQuery(undefined, { enabled: isAuthenticated });

  // Get today's habit completions
  const completionsQuery = trpc.habitCompletions.getByDate.useQuery(
    { date: new Date() },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (moodQuery.data) {
      setTodayMood(moodQuery.data.mood || null);
    }
  }, [moodQuery.data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#351e28'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p style={{color: '#fed1bd'}}>Loading your diary...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{backgroundColor: '#351e28'}}>
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4" style={{color: '#fed1bd'}}>Personal Digital Diary</h1>
          <p className="text-lg mb-8" style={{color: '#fed1bd'}}>
            Track your mood, habits, and memories in one elegant place.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            Sign In to Begin
          </Button>
        </div>
      </div>
    );
  }

  const completionCount = completionsQuery.data?.filter(c => c.completed === 1).length || 0;
  const totalHabits = habitsQuery.data?.length || 0;

  const moodEmoji: Record<string, string> = {
    excellent: "😄",
    good: "🙂",
    neutral: "😐",
    sad: "😔",
    terrible: "😢",
  };

  return (
    <div className="min-h-screen py-8" style={{backgroundColor: '#351e28'}}>
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: '#fed1bd'}}>Welcome back, {user?.name || "Friend"}</h1>
          <p style={{color: '#fed1bd'}}>Today is {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Today's Mood Card */}
          <Card className="card-elevated" style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#fed1bd'}}>
                <Heart className="w-4 h-4" />
                Today's Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayMood ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{moodEmoji[todayMood] || "😐"}</span>
                  <div>
                    <p className="text-2xl font-bold capitalize" style={{color: '#fed1bd'}}>{todayMood}</p>
                    <p style={{color: '#fed1bd'}}>Recorded today</p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/mood")}
                  style={{color: '#fed1bd', borderColor: '#fed1bd'}}
                >
                  Log Mood
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Habits Today */}
          <Card className="card-elevated" style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#fed1bd'}}>
                <Calendar className="w-4 h-4" />
                Habits Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-3xl font-bold" style={{color: '#fed1bd'}}>
                  {completionCount}/{totalHabits}
                </p>
                <p style={{color: '#fed1bd'}}>Completed</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Entries */}
          <Card className="card-elevated" style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#fed1bd'}}>
                <BookOpen className="w-4 h-4" />
                Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-3xl font-bold" style={{color: '#fed1bd'}}>—</p>
                <p style={{color: '#fed1bd'}}>This month</p>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="card-elevated" style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2" style={{color: '#fed1bd'}}>
                <TrendingUp className="w-4 h-4" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => navigate("/insights")}
                style={{color: '#fed1bd', borderColor: '#fed1bd'}}
              >
                View Analysis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/diary")} style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{color: '#fed1bd'}}>
                <BookOpen className="w-5 h-5" />
                Write Entry
              </CardTitle>
              <CardDescription style={{color: '#fed1bd'}}>Add a new diary entry with photos</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/habits")} style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{color: '#fed1bd'}}>
                <Calendar className="w-5 h-5" />
                Track Habits
              </CardTitle>
              <CardDescription style={{color: '#fed1bd'}}>Mark your daily habits complete</CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-elevated cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/calendar")} style={{backgroundColor: '#351e28', borderColor: '#fed1bd'}}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{color: '#fed1bd'}}>
                <Heart className="w-5 h-5" />
                View Calendar
              </CardTitle>
              <CardDescription style={{color: '#fed1bd'}}>See your mood and habit history</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
