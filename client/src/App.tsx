import { Switch, Route } from "wouter";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Downloads from "@/pages/Downloads";
import Login from "@/pages/Login";
import MusicPlayerPage from "@/pages/MusicPlayerPage";
import Notes from "@/pages/Notes";
import CopyAnywhere from "@/pages/CopyAnywhere";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/login" component={Login} />
          <Route path="/music" component={MusicPlayerPage} />
          <Route path="/notes" component={Notes} />
          <Route path="/copy" component={CopyAnywhere} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;