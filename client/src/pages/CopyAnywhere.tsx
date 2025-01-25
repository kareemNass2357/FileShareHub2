import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  text: string;
  timestamp: string;
  isNew?: boolean;
}

export default function CopyAnywhere() {
  const [sessionNameInput, setSessionNameInput] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [newText, setNewText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionName) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/api/ws/${sessionName}`,
      );

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Connected to WebSocket");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages((prev) => [
          ...prev,
          { ...message, isNew: true }, // Mark new messages
        ]);

        // Remove the isNew flag after animation
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, isNew: false } : msg
            )
          );
        }, 500);
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

  const handleSaveSession = () => {
    if (sessionNameInput.trim()) {
      setSessionName(sessionNameInput.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newText.trim()) return;

    const message = {
      text: newText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, { ...message, isNew: true }]);

    // Remove the isNew flag after animation
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, isNew: false } : msg
        )
      );
    }, 500);

    socket.send(JSON.stringify(message));
    setNewText("");
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(index);
      toast({
        description: "Text copied to clipboard!",
        duration: 2000,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy text.",
        duration: 2000,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>CopyAnywhere</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter session name"
              value={sessionNameInput}
              onChange={(e) => setSessionNameInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSaveSession}
              disabled={!sessionNameInput.trim() || isConnected}
            >
              Save Session
            </Button>
          </div>
          {isConnected && (
            <p className="text-sm text-green-600">
              Connected to session: {sessionName}
            </p>
          )}

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
                    <div
                      key={i}
                      className={`p-2 bg-muted rounded-lg flex justify-between items-start transition-colors duration-300 ${
                        msg.isNew ? "bg-primary/10" : ""
                      }`}
                    >
                      <div>
                        <p>{msg.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(msg.text, i)}
                        className="h-8 w-8"
                      >
                        {copiedId === i ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
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