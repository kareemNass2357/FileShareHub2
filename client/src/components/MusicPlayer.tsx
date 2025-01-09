import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Pause } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MusicFile {
  name: string;
  size: number;
  uploadDate: string;
}

export default function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const { data: musicFiles = [] } = useQuery<MusicFile[]>({
    queryKey: ["/api/music"],
  });

  const handlePlay = (filename: string) => {
    if (currentTrack === filename) {
      if (audioRef.current?.paused) {
        audioRef.current.play();
      } else {
        audioRef.current?.pause();
      }
    } else {
      setCurrentTrack(filename);
      if (audioRef.current) {
        audioRef.current.src = `/api/music/${filename}`;
        audioRef.current.play();
      }
    }
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Music Player</h1>
        <p className="text-muted-foreground">
          Listen to your uploaded music files
        </p>
      </div>

      <audio
        ref={audioRef}
        onError={() => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to play the audio file",
          });
        }}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {musicFiles.map((file) => (
            <TableRow key={file.name}>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>{formatSize(file.size)}</TableCell>
              <TableCell>
                {new Date(file.uploadDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePlay(file.name)}
                >
                  {currentTrack === file.name && !audioRef.current?.paused ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {musicFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No music files uploaded yet
        </div>
      )}
    </div>
  );
}