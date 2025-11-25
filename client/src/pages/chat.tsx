import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ChatMessage } from "@shared/schema";

const suggestedQuestions = [
  "How can I manage my PCOS symptoms?",
  "What should I know about thyroid health?",
  "How does exercise help hormonal balance?",
  "What dietary changes help with hormonal health?",
  "How can I reduce stress and anxiety?",
  "What are signs of thyroid dysfunction?",
];

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

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      sendMutation.mutate(question);
    }, 100);
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1" data-testid="heading-chat">
          AI Health Assistant
        </h1>
        <p className="text-muted-foreground">
          Powered by Gemini AI • Personalized health guidance for women's wellness
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Health Chat</CardTitle>
              <CardDescription>Ask about PCOS, thyroid, hormones, nutrition & more</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea 
            ref={scrollRef}
            className="flex-1 border rounded-md p-4 bg-muted/30 space-y-4"
            data-testid="scroll-chat-messages"
          >
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-2">Start Your Health Conversation</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ask me anything about women's health, symptoms, nutrition, or wellness
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.role}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-foreground rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">You</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted text-foreground px-4 py-3 rounded-lg flex gap-2 rounded-bl-none">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length === 0 && !sendMutation.isPending && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs text-left justify-start h-auto py-2 px-3"
                  data-testid={`button-suggested-${idx}`}
                >
                  <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="line-clamp-2">{question}</span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Ask about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
              className="text-sm"
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
