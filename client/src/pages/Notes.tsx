import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type Note = {
  id: number;
  content: string;
  createdAt: string;
};

export default function Notes() {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: noteContent }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      return response.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      addNoteMutation.mutate(content);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          className="min-h-[200px]"
        />
        <Button 
          type="submit" 
          disabled={addNoteMutation.isPending || !content.trim()}
        >
          {addNoteMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Note'
          )}
        </Button>
      </form>

      <div className="space-y-4">
        {notes?.map((note) => (
          <div 
            key={note.id} 
            className="p-4 rounded-lg border bg-card"
          >
            <p className="whitespace-pre-wrap mb-2">{note.content}</p>
            <time className="text-sm text-muted-foreground">
              {format(new Date(note.createdAt), 'PPpp')}
            </time>
          </div>
        ))}
        {notes?.length === 0 && (
          <p className="text-center text-muted-foreground">No notes yet. Create your first note above!</p>
        )}
      </div>
    </div>
  );
}