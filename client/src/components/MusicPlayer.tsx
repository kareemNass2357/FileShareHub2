import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface CachedFile {
  file: Blob;
  data: string;
}

interface CachedFiles {
  [key: string]: CachedFile;
}

export default function MusicPlayer() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  const { isPlaying, togglePlay } = usePlayer(audioRef);
  const [cachedFiles, setCachedFiles] = useLocalStorage<CachedFiles>("cachedFiles", {});

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "audio/mpeg") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an MP3 file.",
      });
      return;
    }

    setAudioFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileURL = e.target?.result as string;
      if (audioRef.current) {
        audioRef.current.src = fileURL;
        audioRef.current.onloadedmetadata = () => {
          setDuration(audioRef.current?.duration || 0);
        };
      }
      cacheFile(file, fileURL);
    };

    reader.readAsDataURL(file);
  };

  const handleFastForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  const handleFastBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePlaybackSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (searchQuery === "") {
      setSearchResults([]);
      return;
    }

    const results = Object.keys(cachedFiles).filter((filename) =>
      filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setShowSearch(true);
  };

  const handlePlaySearchFile = (filename: string) => {
    const fileData = cachedFiles[filename];
    if (fileData && audioRef.current) {
      audioRef.current.src = fileData.data;
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      audioRef.current.play();
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const cacheFile = (file: File, dataUrl: string) => {
    setCachedFiles((prevFiles) => ({
      ...prevFiles,
      [file.name]: { file: file, data: dataUrl },
    }));
  };

  useEffect(() => {
    const fileFromUrl = new URLSearchParams(location).get("file");
    if (fileFromUrl) {
      const fileData = cachedFiles[fileFromUrl];
      if (fileData && audioRef.current) {
        audioRef.current.src = fileData.data;
        audioRef.current.onloadedmetadata = () => {
          setDuration(audioRef.current?.duration || 0);
        };
        audioRef.current.play();
      }
    }
  }, [location, cachedFiles]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center w-full max-w-xl bg-card rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4">Music Player</h2>
        <input
          type="file"
          accept="audio/mpeg"
          onChange={handleUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent/50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Play className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">MP3 files only</p>
          </div>
        </label>

        {audioFile && (
          <div className="flex flex-col items-center justify-center w-full mt-4">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate}>
              <source src={URL.createObjectURL(audioFile)} type="audio/mpeg" />
            </audio>
            <div className="flex items-center justify-between w-full mt-4">
              <Button
                variant="outline"
                onClick={handleFastBackward}
                className="mr-2"
              >
                <SkipBack className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                onClick={togglePlay}
                className="mr-2"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleFastForward}
                className="ml-2"
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex items-center">
                <span className="text-sm mr-2">
                  {Math.floor(currentTime / 60)}:
                  {Math.floor(currentTime % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm ml-2">
                  {Math.floor(duration / 60)}:
                  {Math.floor(duration % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center">
                <Button variant="outline" onClick={handleMute} className="mr-2">
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 ml-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex items-center">
                <span className="text-sm mr-2">Speed:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={handlePlaybackSpeedChange}
                  className="w-24 ml-2"
                />
              </div>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  onClick={() => setShowSearch(!showSearch)}
                  className="mr-2"
                >
                  Search
                </Button>
                {showSearch && (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search by filename"
                      className="border border-input rounded-md px-2 py-1 mr-2"
                    />
                    <Button variant="outline" onClick={handleSearch}>
                      Search
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {showSearch && searchResults.length > 0 && (
              <div className="mt-4 w-full">
                <ul className="space-y-2">
                  {searchResults.map((filename) => (
                    <li
                      key={filename}
                      className="cursor-pointer hover:bg-accent/50 p-2 rounded-md"
                      onClick={() => handlePlaySearchFile(filename)}
                    >
                      {filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}