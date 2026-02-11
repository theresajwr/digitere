import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";

type DiaryEntry = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
};

export default function DiaryListPage() {
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all diary entries
  const fetchEntries = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("diaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load diary entries: " + error.message);
    } else {
      setEntries(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="container max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Diary Entries</h1>

          <Button
            className="bg-accent text-white"
            onClick={() => navigate("/diary")}
          >
            + New Entry
          </Button>
        </div>

        {/* Loading */}
        {loading && <p className="text-muted-foreground">Loading entries...</p>}

        {/* Empty State */}
        {!loading && entries.length === 0 && (
          <p className="text-muted-foreground">
            No diary entries yet. Write your first one ✨
          </p>
        )}

        {/* Entries List */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="card-elevated">
              <CardHeader>
                <CardTitle>
                  {entry.title || "Untitled Entry"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </CardHeader>

              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
