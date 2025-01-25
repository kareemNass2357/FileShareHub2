import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Pencil, Trash, X, Check, FolderPlus, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Note = {
  id: number;
  content: string;
  createdAt: string;
  folderId: number | null;
  user: string;
};

type Folder = {
  id: number;
  name: string;
  createdAt: string;
};

export default function Notes() {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authStatus } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/music/auth-status"],
  });

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes", selectedFolder],
    queryFn: async () => {
      const url = selectedFolder 
        ? `/api/folders/${selectedFolder}/notes`
        : "/api/notes";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
  });

  const addFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      return response.json();
    },
    onSuccess: () => {
      setNewFolderName("");
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content: noteContent,
          folderId: selectedFolder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      return response.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedFolder] });
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

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedFolder] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note",
      });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async ({ id, content, folderId }: { id: number; content: string; folderId: number | null }) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, folderId }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update note");
      }

      return response.json();
    },
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes", selectedFolder] });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      addNoteMutation.mutate(content);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEdit = (id: number) => {
    if (editContent.trim()) {
      editNoteMutation.mutate({ id, content: editContent, folderId: selectedFolder });
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolderMutation.mutate(newFolderName);
    }
  };

  if (isLoading && authStatus?.isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
              />
              <Button 
                type="submit"
                disabled={addFolderMutation.isPending || !newFolderName.trim()}
              >
                {addFolderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Folder'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="space-y-2">
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedFolder(null)}
          >
            <Folder className="mr-2 h-4 w-4" />
            All Notes
          </Button>
          {folders?.map((folder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {folder.name}
            </Button>
          ))}
        </div>

        <div className="col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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

          {!authStatus?.isAuthenticated ? (
            <p className="text-center text-muted-foreground mt-4">
              Log in to view all notes and manage them.
            </p>
          ) : (
            <div className="space-y-4">
              {notes?.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 rounded-lg border bg-card"
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(note.id)}
                          disabled={editNoteMutation.isPending}
                        >
                          {editNoteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span className="ml-2">Save</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                          <span className="ml-2">Cancel</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap mb-2">{note.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="space-y-1">
                          <time className="text-sm text-muted-foreground block">
                            {format(new Date(note.createdAt), 'PPpp')}
                          </time>
                          <span className="text-sm text-muted-foreground">
                            By: {note.user}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(note)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            {deleteNoteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {notes?.length === 0 && (
                <p className="text-center text-muted-foreground">
                  No notes yet. Create your first note above!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}