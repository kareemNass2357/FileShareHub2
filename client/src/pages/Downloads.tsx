import FileList from "@/components/FileList";

export default function Downloads() {
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
