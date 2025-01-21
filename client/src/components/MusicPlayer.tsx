import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { usePlayer } from "@/hooks/use-player";

interface MusicFile {
  name: string;
  size: number;
  uploadDate: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    togglePlay,
    restart,
    seek,
    setVolume,
  } = usePlayer(audioRef);

  const { data: musicFiles = [] } = useQuery<MusicFile[]>({
    queryKey: ["/api/music"],
  });

  const handlePlay = (filename: string) => {
    if (currentTrack === filename) {
      togglePlay();
    } else {
      setCurrentTrack(filename);
      if (audioRef.current) {
        audioRef.current.src = `/api/music/${filename}`;
        play();
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

      {currentTrack && (
        <div className="bg-card rounded-lg p-4 space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">{currentTrack}</h2>
            <div className="text-sm text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="space-y-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([value]) => seek(value)}
              className="w-full"
            />

            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={restart}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2 ml-4">
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => setVolume(value / 100)}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {currentTrack === file.name && isPlaying ? (
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