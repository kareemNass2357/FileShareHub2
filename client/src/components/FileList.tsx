import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  uploadDate: string;
}

export default function FileList() {
  const { data: files = [], isLoading } = useQuery<FileInfo[]>({
    queryKey: ["/api/files"],
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Upload Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.name}>
            <TableCell className="font-medium">{file.name}</TableCell>
            <TableCell>{formatSize(file.size)}</TableCell>
            <TableCell>{new Date(file.uploadDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(file.name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
