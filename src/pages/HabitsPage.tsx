import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function HabitsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get habits
  const habitsQuery = trpc.habits.list.useQuery();

  // Get today's completions
  const completionsQuery = trpc.habitCompletions.getByDate.useQuery({ date: new Date() });

  // Create habit mutation
  const createHabitMutation = trpc.habits.create.useMutation({
    onSuccess: () => {
      toast.success("Habit created!");
      habitsQuery.refetch();
      setNewHabitName("");
      setNewHabitDescription("");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create habit");
    },
  });

  // Toggle completion mutation
  const toggleCompletionMutation = trpc.habitCompletions.toggle.useMutation({
    onSuccess: () => {
      completionsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update habit");
    },
  });

  // Archive habit mutation
  const archiveHabitMutation = trpc.habits.archive.useMutation({
    onSuccess: () => {
      toast.success("Habit archived");
      habitsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive habit");
    },
  });

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    await createHabitMutation.mutateAsync({
      name: newHabitName,
      description: newHabitDescription || undefined,
      color: "#8B5CF6",
      icon: "check",
    });
  };

  const handleToggleHabit = (habitId: number, currentCompleted: boolean) => {
    toggleCompletionMutation.mutate({
      habitId,
      date: new Date(),
      completed: !currentCompleted,
    });
  };

  const isHabitCompleted = (habitId: number) => {
    return completionsQuery.data?.some(c => c.habitId === habitId && c.completed === 1) || false;
  };

  const completedCount = completionsQuery.data?.filter(c => c.completed === 1).length || 0;
  const totalHabits = habitsQuery.data?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Daily Habits</h1>
              <p className="text-muted-foreground">Track your daily habits and build consistency</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
                <DialogDescription>Add a new habit to track daily</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Habit Name</label>
                  <Input
                    placeholder="e.g., Morning Exercise"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    placeholder="e.g., 30 minutes of exercise"
                    value={newHabitDescription}
                    onChange={(e) => setNewHabitDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-accent hover:bg-accent/90 text-white"
                    onClick={handleCreateHabit}
                    disabled={createHabitMutation.isPending}
                  >
                    Create Habit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Card */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{completedCount}/{totalHabits}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits List */}
        {habitsQuery.isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading habits...</p>
          </div>
        ) : habitsQuery.data && habitsQuery.data.length > 0 ? (
          <div className="space-y-3">
            {habitsQuery.data.map((habit) => {
              const isCompleted = isHabitCompleted(habit.id);
              return (
                <Card key={habit.id} className="card-elevated">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleHabit(habit.id, isCompleted)}
                        className="w-6 h-6"
                      />
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {habit.name}
                        </h3>
                        {habit.description && (
                          <p className="text-sm text-muted-foreground">{habit.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => archiveHabitMutation.mutate({ id: habit.id })}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">No habits yet. Create your first habit to get started!</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Habit
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
