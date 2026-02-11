import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Heart, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type MoodType = "excellent" | "good" | "neutral" | "sad" | "terrible";

const moods: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: "excellent", emoji: "😄", label: "Excellent", color: "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900" },
  { type: "good", emoji: "🙂", label: "Good", color: "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900" },
  { type: "neutral", emoji: "😐", label: "Neutral", color: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800" },
  { type: "sad", emoji: "😔", label: "Sad", color: "bg-purple-100 hover:bg-purple-200 dark:bg-purple-900" },
  { type: "terrible", emoji: "😢", label: "Terrible", color: "bg-red-100 hover:bg-red-200 dark:bg-red-900" },
];

export default function MoodPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get today's mood
  const moodQuery = trpc.mood.getByDate.useQuery({ date: new Date() });

  // Record mood mutation
  const recordMoodMutation = trpc.mood.record.useMutation({
    onSuccess: () => {
      toast.success("Mood recorded successfully!");
      moodQuery.refetch();
      setSelectedMood(null);
      setIntensity(5);
      setNotes("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record mood");
    },
  });

  // Load existing mood if available
  useEffect(() => {
    if (moodQuery.data) {
      setSelectedMood(moodQuery.data.mood as MoodType);
      setIntensity(moodQuery.data.moodIntensity || 5);
      setNotes(moodQuery.data.notes || "");
    }
  }, [moodQuery.data]);

  const handleRecordMood = async () => {
    if (!selectedMood) {
      toast.error("Please select a mood");
      return;
    }

    setIsLoading(true);
    try {
      await recordMoodMutation.mutateAsync({
        date: new Date(),
        mood: selectedMood,
        moodIntensity: intensity,
        notes: notes || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">How are you feeling?</h1>
            <p className="text-muted-foreground">Track your mood for today</p>
          </div>
        </div>

        {/* Mood Selection */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Select Your Mood
            </CardTitle>
            <CardDescription>Choose how you're feeling right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.type}
                  onClick={() => setSelectedMood(mood.type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all ${
                    selectedMood === mood.type
                      ? `${mood.color} ring-2 ring-accent scale-105`
                      : `${mood.color}`
                  }`}
                >
                  <span className="text-4xl mb-2">{mood.emoji}</span>
                  <span className="text-xs font-medium text-center">{mood.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intensity Slider */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle>Intensity Level</CardTitle>
            <CardDescription>How strong is this feeling?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Slider
                value={[intensity]}
                onValueChange={(value) => setIntensity(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mild (1)</span>
                <span className="font-semibold text-foreground">{intensity}/10</span>
                <span>Intense (10)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle>Notes (Optional)</CardTitle>
            <CardDescription>What triggered this mood? What's on your mind?</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write what's on your mind..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-32"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-accent/90 text-white"
            onClick={handleRecordMood}
            disabled={isLoading || !selectedMood}
          >
            {isLoading ? "Saving..." : "Save Mood"}
          </Button>
        </div>
      </div>
    </div>
  );
}
