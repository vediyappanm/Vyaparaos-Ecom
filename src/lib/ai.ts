// NVIDIA AI Integration for Bazaar-Mitr

interface NVIDIAMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NVIDIAResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class NVIDIAAIService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_NVIDIA_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1';
    
    if (!this.apiKey) {
      console.warn('NVIDIA API key not found. AI features will be disabled.');
    }
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  private async makeRequest(messages: NVIDIAMessage[]): Promise<NVIDIAResponse> {
    if (!this.apiKey) {
      return {
        choices: [{ message: { content: "AI is not configured yet. Add VITE_NVIDIA_API_KEY to enable AI features." } }],
      };
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama3-70b-instruct',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generate product recommendations based on sales data
  async generateProductRecommendations(salesData: any[], products: any[]): Promise<string> {
    const messages: NVIDIAMessage[] = [
      {
        role: 'system',
        content: 'You are a business intelligence assistant for an e-commerce platform. Analyze sales data and provide actionable product recommendations.'
      },
      {
        role: 'user',
        content: `Based on the following sales data and product catalog, provide 3-5 specific recommendations to increase sales:

Sales Data:
${JSON.stringify(salesData.slice(0, 10), null, 2)}

Products:
${JSON.stringify(products.slice(0, 10), null, 2)}

Focus on:
1. Cross-selling opportunities
2. Pricing optimization
3. Inventory recommendations
4. Marketing strategies
5. Customer insights

Provide specific, actionable advice.`
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0]?.message?.content || 'Unable to generate recommendations.';
    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return 'AI recommendations temporarily unavailable.';
    }
  }

  // Generate business insights
  async generateBusinessInsights(metrics: {
    totalSales: number;
    totalOrders: number;
    topProducts: any[];
    customerData: any[];
  }): Promise<string> {
    const messages: NVIDIAMessage[] = [
      {
        role: 'system',
        content: 'You are a business analyst providing insights for a retail business.'
      },
      {
        role: 'user',
        content: `Analyze these business metrics and provide strategic insights:

Total Sales: ₹${metrics.totalSales}
Total Orders: ${metrics.totalOrders}
Top Products: ${JSON.stringify(metrics.topProducts, null, 2)}
Customer Data: ${JSON.stringify(metrics.customerData.slice(0, 5), null, 2)}

Provide insights on:
1. Sales trends and patterns
2. Customer behavior analysis
3. Product performance
4. Growth opportunities
5. Operational improvements`
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0]?.message?.content || 'Unable to generate insights.';
    } catch (error) {
      console.error('Error generating business insights:', error);
      return 'AI insights temporarily unavailable.';
    }
  }

  // Generate marketing content
  async generateMarketingContent(product: any, targetAudience: string): Promise<string> {
    const messages: NVIDIAMessage[] = [
      {
        role: 'system',
        content: 'You are a marketing copywriter creating compelling product descriptions.'
      },
      {
        role: 'user',
        content: `Create marketing content for this product targeting ${targetAudience}:

Product: ${JSON.stringify(product, null, 2)}

Generate:
1. Catchy headline
2. Engaging product description
3. Key selling points
4. Call to action
5. Social media post

Keep it concise and persuasive.`
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0]?.message?.content || 'Unable to generate marketing content.';
    } catch (error) {
      console.error('Error generating marketing content:', error);
      return 'AI content generation temporarily unavailable.';
    }
  }

  // Analyze customer sentiment
  async analyzeCustomerFeedback(feedback: string[]): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    insights: string;
    recommendations: string;
  }> {
    const messages: NVIDIAMessage[] = [
      {
        role: 'system',
        content: 'You are a customer sentiment analyzer. Provide structured analysis of customer feedback.'
      },
      {
        role: 'user',
        content: `Analyze this customer feedback and provide structured insights:

Feedback:
${feedback.join('\n\n')}

Return a JSON response with:
{
  "sentiment": "positive|neutral|negative",
  "insights": "Key themes and patterns",
  "recommendations": "Actionable improvements"
}`
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          sentiment: 'neutral',
          insights: content,
          recommendations: 'Review feedback manually'
        };
      }
    } catch (error) {
      console.error('Error analyzing customer feedback:', error);
      return {
        sentiment: 'neutral',
        insights: 'Analysis unavailable',
        recommendations: 'Manual review required'
      };
    }
  }

  // Generate inventory forecasts
  async generateInventoryForecast(salesHistory: any[], currentInventory: any[]): Promise<{
    recommendations: string[];
    restockSuggestions: Array<{
      productId: string;
      productName: string;
      suggestedQuantity: number;
      urgency: 'high' | 'medium' | 'low';
    }>;
  }> {
    const messages: NVIDIAMessage[] = [
      {
        role: 'system',
        content: 'You are an inventory management expert providing restocking recommendations.'
      },
      {
        role: 'user',
        content: `Analyze sales history and current inventory to provide restocking recommendations:

Sales History (last 30 days):
${JSON.stringify(salesHistory.slice(0, 20), null, 2)}

Current Inventory:
${JSON.stringify(currentInventory.slice(0, 20), null, 2)}

Return a JSON response with:
{
  "recommendations": ["General inventory advice"],
  "restockSuggestions": [
    {
      "productId": "product_id",
      "productName": "Product Name",
      "suggestedQuantity": 50,
      "urgency": "high|medium|low"
    }
  ]
}

Consider:
- Sales velocity
- Seasonal trends
- Stock levels
- Lead times`
      }
    ];

    try {
      const response = await this.makeRequest(messages);
      const content = response.choices[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          recommendations: [content],
          restockSuggestions: []
        };
      }
    } catch (error) {
      console.error('Error generating inventory forecast:', error);
      return {
        recommendations: ['Manual inventory review required'],
        restockSuggestions: []
      };
    }
  }
}

export const aiService = new NVIDIAAIService();
export default aiService;
