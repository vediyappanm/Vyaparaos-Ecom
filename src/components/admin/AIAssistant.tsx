import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Send, Sparkles, TrendingUp, Package, Users, BarChart3 } from "lucide-react";
import { useAIChat } from "@/hooks/useAI";
import { useBusinessInsights } from "@/hooks/useAI";
import { useProductRecommendations } from "@/hooks/useAI";
import { toast } from "sonner";

interface AIAssistantProps {
  businessMetrics?: {
    totalSales: number;
    totalOrders: number;
    topProducts: any[];
    customerData: any[];
  };
  salesData?: any[];
  products?: any[];
}

export const AIAssistant = ({ businessMetrics, salesData, products }: AIAssistantProps) => {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "insights" | "recommendations">("chat");
  
  const aiChat = useAIChat();
  const businessInsights = useBusinessInsights(businessMetrics || {
    totalSales: 0,
    totalOrders: 0,
    topProducts: [],
    customerData: []
  });
  const productRecommendations = useProductRecommendations(salesData || [], products || []);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    aiChat.mutate({
      message: message.trim(),
      context: businessMetrics
    }, {
      onSuccess: () => {
        setMessage("");
      },
      onError: (error: any) => {
        toast.error("Failed to get AI response");
        console.error("AI Chat Error:", error);
      }
    });
  };

  const tabs = [
    { id: "chat", label: "Chat", icon: Bot },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "recommendations", label: "Recommendations", icon: TrendingUp }
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border border-border rounded-lg p-1 bg-muted/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI Business Assistant</h3>
              <Badge variant="outline" className="text-xs">Powered by NVIDIA</Badge>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
              {aiChat.data && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 mt-1 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">AI Assistant</p>
                      <div className="bg-card rounded-lg p-3 text-sm">
                        {aiChat.data}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!aiChat.data && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ask me anything about your business!</p>
                  <p className="text-xs mt-1">I can help with sales strategies, product recommendations, and business insights.</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your business..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || aiChat.isPending}
                size="icon"
              >
                {aiChat.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Business Insights</h3>
              <Badge variant="outline" className="text-xs">AI Analysis</Badge>
            </div>
            
            {businessInsights.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Analyzing your business data...</p>
              </div>
            )}
            
            {businessInsights.data && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{businessInsights.data}</pre>
                </div>
              </div>
            )}
            
            {businessInsights.error && (
              <div className="text-center py-8 text-destructive">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Unable to generate insights</p>
                <p className="text-xs mt-1">Please check your business data and try again.</p>
              </div>
            )}
            
            {!businessMetrics?.totalSales && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No business data available</p>
                <p className="text-xs mt-1">Start making sales to get AI-powered insights.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Product Recommendations</h3>
              <Badge variant="outline" className="text-xs">AI Powered</Badge>
            </div>
            
            {productRecommendations.isPending && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Analyzing sales patterns...</p>
              </div>
            )}
            
            {productRecommendations.data && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{productRecommendations.data}</pre>
                </div>
              </div>
            )}
            
            {productRecommendations.error && (
              <div className="text-center py-8 text-destructive">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Unable to generate recommendations</p>
                <p className="text-xs mt-1">Please check your sales data and try again.</p>
              </div>
            )}
            
            {(!salesData?.length || !products?.length) && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data available</p>
                <p className="text-xs mt-1">Add products and make sales to get AI recommendations.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
