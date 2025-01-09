import { Router, Route, Link } from "react-router-dom";
import Home from "@/app/page";
import FileUpload from "@/components/FileUpload";
import MusicPlayerPage from "@/components/MusicPlayerPage";

export default function RootLayout() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <Link href="/">Home</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/music-player">Music Player</Link>
        </header>
        <main className="app-main">
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/music-player" element={<MusicPlayerPage />} />
        </main>
      </div>
    </Router>
  );
}