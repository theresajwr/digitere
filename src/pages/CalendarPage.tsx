import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

const moodEmoji: Record<string, string> = {
  excellent: "😄",
  good: "🙂",
  neutral: "😐",
  sad: "😔",
  terrible: "😢",
};

const moodColors: Record<string, string> = {
  excellent: "bg-emerald-100 dark:bg-emerald-900",
  good: "bg-blue-100 dark:bg-blue-900",
  neutral: "bg-slate-100 dark:bg-slate-800",
  sad: "bg-purple-100 dark:bg-purple-900",
  terrible: "bg-red-100 dark:bg-red-900",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get mood history for the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const moodQuery = trpc.mood.getByRange.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getMoodForDay = (day: Date) => {
    return moodQuery.data?.find(m => isSameDay(new Date(m.date), day));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Get day of week headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mood Calendar</h1>
            <p className="text-muted-foreground">View your mood history and patterns</p>
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
                <CardDescription>Click on a day to see details</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayHeaders.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const mood = getMoodForDay(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    className={`aspect-square rounded-lg border-2 transition-all hover:shadow-md flex flex-col items-center justify-center p-1 ${
                      mood
                        ? `${moodColors[mood.mood || "neutral"]} border-accent`
                        : `border-border hover:border-accent`
                    } ${isToday ? "ring-2 ring-accent" : ""}`}
                  >
                    <span className="text-xs font-semibold">{format(day, "d")}</span>
                    {mood && (
                      <span className="text-lg">{moodEmoji[mood.mood || "neutral"]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="card-elevated mt-6">
          <CardHeader>
            <CardTitle className="text-base">Mood Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(moodEmoji).map(([mood, emoji]) => (
                <div key={mood} className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm capitalize">{mood}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="card-elevated mt-6">
          <CardHeader>
            <CardTitle>Monthly Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(moodEmoji).map(([mood, emoji]) => {
                const count = moodQuery.data?.filter(m => m.mood === mood).length || 0;
                return (
                  <div key={mood} className="text-center">
                    <p className="text-2xl mb-1">{emoji}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{mood}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
