import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import FileList from "@/components/FileList";

export default function Downloads() {
  const [, setLocation] = useLocation();

  // Check authentication status
  const { error } = useQuery({
    queryKey: ["/api/files"],
    retry: false,
  });

  useEffect(() => {
    if (error?.message?.includes("401")) {
      setLocation("/login");
    }
  }, [error, setLocation]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground">
          View and download your uploaded files
        </p>
      </div>
      <FileList />
    </div>
  );
}