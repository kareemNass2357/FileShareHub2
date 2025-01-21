import { useState, useEffect, RefObject } from "react";

interface PlayerState {
  currentTime: number;
  duration: number;
  volume: number;
}

export function usePlayer(audioRef: RefObject<HTMLAudioElement>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState<PlayerState>({
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      play();
    }
  };

  const setVolume = (value: number) => {
    if (audioRef.current) {
      const volume = Math.max(0, Math.min(1, value));
      audioRef.current.volume = volume;
      setState(prev => ({ ...prev, volume }));
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const onLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        volume: audio.volume,
      }));
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return {
    isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    play,
    pause,
    togglePlay,
    restart,
    seek,
    setVolume,
  };
}