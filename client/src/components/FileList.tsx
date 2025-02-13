import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, Share2 } from "lucide-react";
import FilePreview from "./FilePreview";
import { useToast } from "@/hooks/use-toast";

interface FileInfo {
  name: string;
  size: number;
  uploadDate: string;
  shareId?: string;
}

export default function FileList() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<FileInfo[]>({
    queryKey: ["/api/files"],
  });

  const shareMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/share/${filename}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create share link');
      return response.json();
    },
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/share/${data.shareId}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share link copied!",
        description: "The download link has been copied to your clipboard.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create share link",
      });
    },
  });

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

  const handleDownload = async (filename: string) => {
    window.location.href = `/api/download/${filename}`;
  };

  const handleShare = (filename: string) => {
    shareMutation.mutate(filename);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading files...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet
      </div>
    );
  }

  return (
    <>
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
          {files.map((file) => (
            <TableRow key={file.name}>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>{formatSize(file.size)}</TableCell>
              <TableCell>{new Date(file.uploadDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(file)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file.name)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(file.name)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FilePreview
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        file={selectedFile}
        onDownload={handleDownload}
      />
    </>
  );
}