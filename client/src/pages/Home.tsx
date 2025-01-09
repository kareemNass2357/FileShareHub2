import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Upload Files</h1>
        <p className="text-muted-foreground">
          Share your files quickly and easily
        </p>
      </div>
      <FileUpload />
    </div>
  );
}
