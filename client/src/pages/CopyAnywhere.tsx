import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  text: string;
  timestamp: string;
}

export default function CopyAnywhere() {
  const [sessionName, setSessionName] = useState("");
  const [newText, setNewText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (sessionName) {
      const ws = new WebSocket(`ws://${window.location.host}/api/ws/${sessionName}`);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to WebSocket");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("Disconnected from WebSocket");
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [sessionName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newText.trim()) return;

    const message = {
      text: newText.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify(message));
    setNewText("");
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>CopyAnywhere</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="mb-2"
            />
            {isConnected && (
              <p className="text-sm text-green-600">Connected to session: {sessionName}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Enter text to share"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              disabled={!isConnected}
            />
            <Button type="submit" disabled={!isConnected}>
              Send
            </Button>
          </form>

          <Card>
            <CardHeader>
              <CardTitle>Shared Texts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {messages.map((msg, i) => (
                    <div key={i} className="p-2 bg-muted rounded-lg">
                      <p>{msg.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
