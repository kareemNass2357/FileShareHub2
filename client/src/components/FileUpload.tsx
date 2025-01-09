import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedFile(null);
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
          const response = JSON.parse(xhr.responseText);
          setUploadedFile({ filename: response.filename });
          toast({
            title: "Success",
            description: "File uploaded successfully",
          });
        } else {
          throw new Error("Upload failed");
        }
        setUploading(false);
        setProgress(0);
      };

      xhr.onerror = () => {
        throw new Error("Upload failed");
      };

      xhr.open("POST", "/api/upload");
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

  const handleCopyLink = async () => {
    if (!uploadedFile) return;

    const downloadUrl = `${window.location.origin}/api/download/${uploadedFile.filename}`;
    await navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Link copied!",
      description: "Download link has been copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Any file type allowed</p>
          </div>
          <input
            id="file-upload"
            type="file"
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

      {uploadedFile && (
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-medium mb-2">File uploaded successfully!</h3>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground flex-1 truncate">
              {`${window.location.origin}/api/download/${uploadedFile.filename}`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="min-w-[100px]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}