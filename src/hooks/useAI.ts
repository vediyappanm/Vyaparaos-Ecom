import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService } from '@/lib/ai';
const AI_ENABLED = aiService.isConfigured();

// AI-powered product recommendations
export const useProductRecommendations = (salesData: any[], products: any[]) => {
  return useQuery({
    queryKey: ['ai-recommendations', 'products'],
    queryFn: () => aiService.generateProductRecommendations(salesData, products),
    enabled: AI_ENABLED && salesData.length > 0 && products.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// AI-powered business insights
export const useBusinessInsights = (metrics: {
  totalSales: number;
  totalOrders: number;
  topProducts: any[];
  customerData: any[];
}) => {
  return useQuery({
    queryKey: ['ai-insights', 'business'],
    queryFn: () => aiService.generateBusinessInsights(metrics),
    enabled: AI_ENABLED && !!metrics.totalSales,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// AI-powered marketing content generation
export const useMarketingContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ product, targetAudience }: { product: any; targetAudience: string }) =>
      aiService.generateMarketingContent(product, targetAudience),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-marketing'] });
    },
  });
};

// AI-powered customer sentiment analysis
export const useCustomerSentiment = (feedback: string[]) => {
  return useQuery({
    queryKey: ['ai-sentiment'],
    queryFn: () => aiService.analyzeCustomerFeedback(feedback),
    enabled: AI_ENABLED && feedback.length > 0,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// AI-powered inventory forecasting
export const useInventoryForecast = (salesHistory: any[], currentInventory: any[]) => {
  return useQuery({
    queryKey: ['ai-inventory-forecast'],
    queryFn: () => aiService.generateInventoryForecast(salesHistory, currentInventory),
    enabled: AI_ENABLED && salesHistory.length > 0 && currentInventory.length > 0,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
  });
};

// AI-powered chat assistant for business queries
export const useAIChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: any }) => {
      if (!AI_ENABLED) {
        return 'AI is not configured yet. Add VITE_NVIDIA_API_KEY to enable assistant responses.';
      }
      // Build context-aware prompt
      let contextInfo = '';
      if (context) {
        contextInfo = `
Current Business Context:
- Total Sales: ₹${context.totalSales || 0}
- Total Orders: ${context.totalOrders || 0}
- Products: ${context.products?.length || 0}
- Recent Orders: ${JSON.stringify(context.recentOrders?.slice(0, 3) || [], null, 2)}
`;
      }

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

${contextInfo}

Be concise, helpful, and provide actionable advice.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I cannot process your request at the moment.';
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat'] });
    },
  });
};

// AI-powered product description optimization
export const useProductDescriptionOptimizer = () => {
  return useMutation({
    mutationFn: async ({ product, targetKeywords }: { product: any; targetKeywords?: string[] }) => {
      if (!AI_ENABLED) {
        return 'AI is not configured yet. Add VITE_NVIDIA_API_KEY to enable optimization.';
      }
      const keywords = targetKeywords?.join(', ') || '';
      
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
              content: 'You are an expert e-commerce copywriter. Optimize product descriptions for better SEO and conversions.'
            },
            {
              role: 'user',
              content: `Optimize this product description for better search rankings and conversions:

Product: ${product.name}
Current Description: ${product.description}
Price: ₹${product.price}
Category: ${product.category}
Target Keywords: ${keywords}

Provide:
1. SEO-optimized title
2. Enhanced description (150-200 words)
3. Key features bullet points
4. SEO meta description
5. Suggested tags

Make it compelling and conversion-focused.`
            }
          ],
          max_tokens: 800,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize description');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to optimize description.';
    },
  });
};
