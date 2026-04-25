import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "What was my best selling product this month?",
  "Show me pending dues",
  "List products below minimum stock",
  "What's my cash position?",
  "आज की कुल बिक्री बताओ",
];

export default function AI() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Namaste! 👋 I'm your VyaparOS AI Assistant. Ask me anything about your sales, stock, customers or finances — in any Indian language." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs); setInput(""); setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { messages: newMsgs.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "AI failed");
      setMessages(m => [...m, { role: "assistant", content: `Sorry — ${e.message ?? "I couldn't reach the AI right now"}.` }]);
    } finally { setThinking(false); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 animate-fade-in h-[calc(100vh-3.5rem)] flex flex-col">
      <PageHeader eyebrow="Powered by Lovable AI" title="AI Assistant" description="Ask anything about your business — grounded in your live data" />

      <Card className="mt-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                m.role === "user" ? "gradient-royal text-white" : "gradient-accent text-accent-foreground shadow-glow")}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user" ? "gradient-royal text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                {m.content.split("**").map((part, j) => j % 2 === 1 ? <strong key={j} className="text-primary">{part}</strong> : <span key={j}>{part}</span>)}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shrink-0 shadow-glow"><Bot className="w-4 h-4 text-accent-foreground" /></div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {PROMPTS.map(p => (
              <button key={p} onClick={() => send(p)}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent/10 hover:border-accent transition-all">
                <Sparkles className="w-3 h-3 inline mr-1 text-accent" />{p}
              </button>
            ))}
          </div>
        )}

        <div className="border-t p-3 bg-muted/30">
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask in English, Hindi, Tamil, Telugu..." className="h-11" disabled={thinking} />
            <Button onClick={() => send(input)} disabled={!input.trim() || thinking} className="h-11 px-5 gradient-accent border-0 shadow-glow text-accent-foreground">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
