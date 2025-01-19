import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Music } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function YouTubeConverter() {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const convertMutation = useMutation({
    mutationFn: async (youtubeUrl: string) => {
      const response = await fetch("/api/youtube/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.blob();
    },
    onSuccess: (blob) => {
      // Create a download link for the MP3
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "youtube-audio.mp3";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success!",
        description: "Your MP3 file is ready to download.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a YouTube URL",
      });
      return;
    }
    convertMutation.mutate(url);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" />
            YouTube to MP3 Converter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter YouTube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={convertMutation.isPending}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {convertMutation.isPending ? "Converting..." : "Convert"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
