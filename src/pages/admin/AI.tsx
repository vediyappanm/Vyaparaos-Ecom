import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AIAssistant } from "@/components/admin/AIAssistant";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { useTenant } from "@/contexts/TenantContext";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "What was my best selling product this month?",
  "Show me pending dues",
  "List products below minimum stock",
  "What's my cash position?",
  "आज की कुल बिक्री बताओ",
];

export default function AI() {
  const { tenant } = useTenant();
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Namaste! 👋 I'm your Bazaar-Mitr AI Assistant. Ask me anything about your sales, stock, customers or finances — powered by NVIDIA AI." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    if (!import.meta.env.VITE_NVIDIA_API_KEY) {
      toast.error("AI is not configured. Add VITE_NVIDIA_API_KEY in .env");
      setMessages((m) => [...m, { role: "assistant", content: "AI is not configured yet. Please add VITE_NVIDIA_API_KEY in your environment." }]);
      return;
    }
    const newMsgs: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs); setInput(""); setThinking(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_NVIDIA_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta/llama3-70b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are a helpful business assistant for the Bazaar-Mitr e-commerce platform. You help users with:
- Business advice and strategies
- Product recommendations
- Sales and marketing tips
- Inventory management
- Customer service guidance
- General business queries

Current Business Context:
- Total Sales: ₹${orders.reduce((sum, order) => sum + (order.total || 0), 0)}
- Total Orders: ${orders.length}
- Products: ${products.length}
- Recent Orders: ${JSON.stringify(orders.slice(0, 3), null, 2)}

Be concise, helpful, and provide actionable advice.`
            },
            ...(newMsgs.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0))
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMessages(m => [...m, { role: "assistant", content: data.choices[0]?.message?.content || 'I apologize, but I cannot process your request at the moment.' }]);
    } catch (e: any) {
      toast.error(e.message ?? "AI failed");
      setMessages(m => [...m, { role: "assistant", content: `Sorry — ${e.message ?? "I couldn't reach the AI right now"}.` }]);
    } finally { setThinking(false); }
  };

  return (
    <div className="px-4 lg:px-6 py-5 animate-fade-in h-[calc(100vh-3.5rem)] flex flex-col">
      <PageHeader eyebrow="Powered by NVIDIA AI" title="AI Assistant" description="Ask anything about your business — grounded in your live data" />

      <div className="space-y-4">
        <AIAssistant
          businessMetrics={{
            totalSales: orders.reduce((sum, order) => sum + (order.total || 0), 0),
            totalOrders: orders.length,
            topProducts: products.slice(0, 5),
            customerData: orders.map(order => ({
              name: order.party_name,
              phone: order.party_phone,
              totalSpent: order.total
            })).slice(0, 10)
          }}
          salesData={orders}
          products={products}
        />
      </div>
    </div>
  );
}
