import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">About FileShare</h1>
        <p className="text-muted-foreground">
          A simple and efficient file sharing platform
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Features</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Easy file uploads with drag and drop support</li>
              <li>Progress tracking for uploads</li>
              <li>Organized file listing</li>
              <li>Quick downloads</li>
              <li>Mobile-friendly interface</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">How to Use</h2>
            <p className="text-muted-foreground">
              Simply drag and drop your files onto the upload area or click to
              select files. Once uploaded, you can find all your files in the
              Downloads section. Click the download button next to any file to
              retrieve it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
