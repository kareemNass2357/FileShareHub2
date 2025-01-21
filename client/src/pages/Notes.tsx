import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

export default function Notes() {
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for authentication status
  const { data: authStatus } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/auth-status"],
  });

  // Query for notes
  const { data: notes } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    enabled: authStatus?.isAuthenticated ?? false,
  });

  const { mutate: saveNote, isPending } = useMutation({
    mutationFn: async (noteText: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: noteText }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note saved successfully!",
      });
      setNote(""); // Clear the input after successful save
      // Invalidate the notes query to refetch the list
      if (authStatus?.isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      saveNote(note);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Write your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[200px]"
            />
            <Button type="submit" disabled={isPending || !note.trim()}>
              {isPending ? "Saving..." : "Save Note"}
            </Button>
          </form>

          {authStatus?.isAuthenticated && notes && notes.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold">Previous Notes</h2>
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="pt-4">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}