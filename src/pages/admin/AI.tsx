import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mic, Send, Volume2, Bot, User, Languages } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

const PROMPTS = [
  "What was my best selling product this week?",
  "Show me pending dues",
  "Who is my top customer this month?",
  "List products below minimum stock",
  "Draft a payment reminder for Kiran Patel",
  "आज की कुल बिक्री बताओ",
];

const MOCK_REPLIES: Record<string, string> = {
  best: "Your best seller this week is **Maggi Noodles 70g** with 248 units sold (₹3,224). It's followed by Amul Gold Milk 1L (192 units) and Tata Salt 1kg (167 units). Would you like me to draft a reorder for Maggi?",
  dues: "You have **₹18,450** outstanding across 3 customers:\n• Lakshmi Nair — ₹9,030 (Order SRM-1036)\n• Kiran Patel — ₹7,800 (Order SRM-1035, partial)\n• Rohit Mehra — ₹1,620 (Order SRM-1037)\n\nShall I send WhatsApp reminders to all three?",
  customer: "Your top customer this month is **Kiran Patel** — 4 orders totalling ₹14,200. He typically buys in bulk for his café. Consider offering him a 5% loyalty discount on his next order.",
  stock: "**3 products are below minimum stock:**\n• Lays Classic 52g — only 4 left (min 25)\n• Amul Butter 500g — 8 left (min 12)\n• Aashirvaad Atta 5kg — 38 left, near threshold\n\nReorder estimated total: ₹12,400.",
  reminder: "Here's a draft WhatsApp message for Kiran Patel:\n\n_\"Namaste Kiran ji 🙏, gentle reminder — invoice SRM-1035 of ₹7,800 is pending since 24 Apr. You can pay via UPI: rajeshsharma@okhdfcbank. Thank you for your business! — Sharma Royal Mart\"_\n\nSend it now?",
  hindi: "आज की कुल बिक्री **₹27,340** है जो 64 ऑर्डर्स से आई है। यह कल से 12.4% ज़्यादा है। सबसे ज़्यादा बिकने वाला प्रोडक्ट Maggi Noodles रहा।",
};

const pickReply = (q: string): string => {
  const l = q.toLowerCase();
  if (l.includes("best") || l.includes("selling") || l.includes("seller")) return MOCK_REPLIES.best;
  if (l.includes("due") || l.includes("pending") || l.includes("owe")) return MOCK_REPLIES.dues;
  if (l.includes("customer") || l.includes("top")) return MOCK_REPLIES.customer;
  if (l.includes("stock") || l.includes("low") || l.includes("minimum")) return MOCK_REPLIES.stock;
  if (l.includes("reminder") || l.includes("draft") || l.includes("kiran")) return MOCK_REPLIES.reminder;
  if (/[\u0900-\u097F]/.test(q)) return MOCK_REPLIES.hindi;
  return "I can answer questions about your sales, stock, customers, expenses and more. Try one of the suggested prompts to see what I can do!";
};

export default function AI() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Namaste Rajesh! 👋 I'm your VyaparOS AI Assistant. I can answer questions about your sales, inventory, customers and finances — in English, Hindi, Tamil, Telugu, Kannada or Marathi. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = pickReply(text);
      setMessages(m => [...m, { role: "assistant", text: reply }]);
      setThinking(false);
    }, 800 + Math.random() * 600);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text.replace(/[*_•]/g, ""));
    u.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    u.rate = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported in this browser"); return; }
    const recog = new SR();
    recog.lang = "en-IN";
    recog.continuous = false;
    recog.interimResults = false;
    setListening(true);
    recog.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput(t);
      setListening(false);
      setTimeout(() => send(t), 200);
    };
    recog.onerror = () => setListening(false);
    recog.onend = () => setListening(false);
    recog.start();
  };

  return (
    <div className="px-4 lg:px-6 py-5 animate-fade-in h-[calc(100vh-3.5rem)] flex flex-col">
      <PageHeader
        eyebrow="Powered by Lovable AI"
        title="AI Assistant"
        description="Ask anything about your business — in any Indian language"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Languages className="w-4 h-4" /> EN · हिं · த · తె
          </Button>
        }
      />

      <Card className="mt-4 flex-1 flex flex-col overflow-hidden royal-orb-bg">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 relative">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1",
                m.role === "user"
                  ? "gradient-royal text-white ring-accent/40"
                  : "gradient-accent text-accent-foreground ring-white/40 shadow-glow"
              )}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user"
                  ? "gradient-royal text-white rounded-tr-sm"
                  : "glass-strong rounded-tl-sm"
              )}>
                {m.text.split("**").map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="text-gold">{part}</strong> : <span key={j}>{part}</span>
                )}
                {m.role === "assistant" && (
                  <button
                    onClick={() => speak(m.text)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Volume2 className="w-3 h-3" /> Speak
                  </button>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shrink-0 shadow-glow">
                <Bot className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="glass-strong rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs px-3 py-1.5 rounded-full glass border-white/40 hover:bg-accent/10 hover:border-accent transition-all"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-accent" />
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/30 p-3 glass-strong">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={startListening}
              className={cn("h-11 w-11 shrink-0", listening && "bg-destructive text-destructive-foreground border-destructive animate-pulse")}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder={listening ? "Listening..." : "Ask in English, Hindi, Tamil... or tap mic"}
              className="h-11 bg-white/60 border-white/40"
            />
            <Button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="h-11 px-5 gradient-accent border-0 shadow-glow text-accent-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
