import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";

export default function Chat() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/messages'],
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/chat/send', { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMutation.mutate(input);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="heading-chat">AI Health Assistant</h1>
        <p className="text-muted-foreground">Ask health questions, get personalized insights</p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>Powered by AI analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea 
            ref={scrollRef}
            className="flex-1 pr-4 border rounded-md p-4 bg-muted/50"
            data-testid="scroll-chat-messages"
          >
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Start a conversation about your health concerns</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.role}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {sendMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-4 py-2 rounded-lg flex gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Ask about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMutation.isPending}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
