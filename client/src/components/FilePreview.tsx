import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, File } from "lucide-react";

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    size: number;
    uploadDate: string;
  } | null;
  onDownload: (filename: string) => void;
}

export default function FilePreview({ isOpen, onClose, file, onDownload }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const isImage = file?.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isText = file?.name.match(/\.(txt|md|json|csv)$/i);
  const isPdf = file?.name.match(/\.pdf$/i);

  const loadPreview = async () => {
    if (!file) return;
    
    try {
      if (isImage || isPdf) {
        setPreviewUrl(`/api/preview/${file.name}`);
      } else if (isText) {
        const response = await fetch(`/api/preview/${file.name}`);
        const text = await response.text();
        setPreviewUrl(text);
      }
      setError("");
    } catch (err) {
      setError("Failed to load preview");
      setPreviewUrl("");
    }
  };

  // Load preview when dialog opens
  useState(() => {
    if (isOpen && file) {
      loadPreview();
    } else {
      setPreviewUrl("");
      setError("");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {file?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="min-h-[300px] max-h-[600px] overflow-auto p-4 bg-muted rounded-md">
          {error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {error}
            </div>
          ) : previewUrl ? (
            isImage ? (
              <img
                src={previewUrl}
                alt={file?.name}
                className="max-w-full h-auto mx-auto"
              />
            ) : isText ? (
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {previewUrl}
              </pre>
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                className="w-full h-[500px]"
                title={file?.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <File className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">No preview available</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            onClick={() => file && onDownload(file.name)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
