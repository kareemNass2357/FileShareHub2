import { Route, Link } from "wouter";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import MusicPlayerPage from "@/pages/MusicPlayerPage";
import About from "@/pages/About";
import Downloads from "@/pages/Downloads";
import Login from "@/pages/Login";
import CopyAnywhere from "@/pages/CopyAnywhere";

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/login" component={Login} />
        <Route path="/music" component={MusicPlayerPage} />
        <Route path="/copy" component={CopyAnywhere} />
      </main>
    </div>
  );
}