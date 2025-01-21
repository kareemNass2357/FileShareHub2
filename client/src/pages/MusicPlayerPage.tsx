import { useState } from "react";
import { useLocation } from "wouter";
import MusicPlayer from "@/components/MusicPlayer";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

export default function MusicPlayerPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check authentication status
  const { data: authStatus, isLoading } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/music/auth-status"],
  });

  // Redirect to login if not authenticated
  if (!isLoading && !authStatus?.isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an audio file",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          setProgress(percentage);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          toast({
            title: "Success",
            description: "File uploaded successfully",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/music"] });
        } else {
          throw new Error("Upload failed");
        }
        setUploading(false);
        setProgress(0);
      };

      xhr.onerror = () => {
        throw new Error("Upload failed");
      };

      xhr.open("POST", "/api/music/upload");
      xhr.send(formData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload file",
      });
      setUploading(false);
      setProgress(0);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="music-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Audio files only</p>
          </div>
          <input
            id="music-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      <MusicPlayer />
    </div>
  );
}