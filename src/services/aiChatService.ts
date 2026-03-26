import OpenAI from 'openai';
import { getProductsByFilters, searchProducts } from './firebaseService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'dummy-key-for-testing',
  dangerouslyAllowBrowser: true // Note: In production, use backend API
});

interface ChatPreferences {
  favoriteStyles: string[];
  priceRange: { min: number; max: number };
  favoriteColors: string[];
  recentlyViewed: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageURL: string;
  category: string;
  description?: string;
  color?: string;
  style?: string;
  tags?: string[];
  gender?: string;
}

interface ParsedFilters {
  category?: string;
  color?: string;
  style?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  tags?: string[];
  searchQuery?: string;
}

interface ChatResponse {
  content: string;
  products?: Product[];
  updatedPreferences?: Partial<ChatPreferences>;
  suggestions?: string[];
}

export class AIChatService {
  private static instance: AIChatService;

  static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  async processMessage(
    message: string, 
    preferences: ChatPreferences,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<ChatResponse> {
    try {
      // Step 1: Parse user intent and extract filters
      const filters = await this.parseUserIntent(message, preferences);
      
      // Step 2: Search products based on filters
      let products: Product[] = [];
      if (Object.keys(filters).length > 0) {
        products = await this.searchProductsWithFilters(filters);
      }

      // Step 3: Generate AI response
      const response = await this.generateResponse(
        message, 
        filters, 
        products, 
        preferences,
        conversationHistory
      );

      // Step 4: Update preferences if needed
      const updatedPreferences = this.updatePreferences(message, filters, preferences);

      return {
        content: response.content,
        products: (response.products && response.products.length > 0) ? response.products : (products.length > 0 ? products.slice(0, 6) : []),
        updatedPreferences,
        suggestions: response.suggestions
      };

    } catch (error) {
      console.error('AI Chat Service Error:', error);
      return {
        content: "I'm having trouble processing your request right now. Could you try asking in a different way?",
        products: []
      };
    }
  }

  private async parseUserIntent(message: string, preferences: ChatPreferences): Promise<ParsedFilters> {
    // Simple rule-based parsing as fallback when OpenAI is not available
    const lowerMessage = message.toLowerCase();
    
    // Check for price indicators
    let maxPrice: number | undefined;
    let minPrice: number | undefined;
    
    const priceMatches = lowerMessage.match(/under\s+(\d+)|below\s+(\d+)|less than\s+(\d+)|max\s+(\d+)|₹(\d+)|rs?\s*(\d+)/i);
    if (priceMatches) {
      maxPrice = parseInt(priceMatches[1] || priceMatches[2] || priceMatches[3] || priceMatches[4] || priceMatches[5] || priceMatches[6]);
    }
    
    const minPriceMatches = lowerMessage.match(/above\s+(\d+)|over\s+(\d+)|more than\s+(\d+)|min\s+(\d+)/i);
    if (minPriceMatches) {
      minPrice = parseInt(minPriceMatches[1] || minPriceMatches[2] || minPriceMatches[3] || minPriceMatches[4]);
    }
    
    // Check for categories
    const categories = ['hoodie', 'jeans', 't-shirt', 'dress', 'shirt', 'jacket', 'pants', 'shorts', 'skirt', 'top', 'sweater'];
    const category = categories.find(cat => lowerMessage.includes(cat));
    
    // Check for colors
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey'];
    const color = colors.find(col => lowerMessage.includes(col));
    
    // Check for styles
    const styles = ['vintage', 'oversized', 'casual', 'formal', 'sporty', 'elegant', 'modern', 'classic'];
    const style = styles.find(sty => lowerMessage.includes(sty));
    
    // Check for gender
    let gender: string | undefined;
    if (lowerMessage.includes('men') || lowerMessage.includes('male')) gender = 'men';
    if (lowerMessage.includes('women') || lowerMessage.includes('female')) gender = 'women';
    if (lowerMessage.includes('unisex')) gender = 'unisex';
    
    const filters: ParsedFilters = {};
    if (category) filters.category = category;
    if (color) filters.color = color;
    if (style) filters.style = style;
    if (maxPrice) filters.maxPrice = maxPrice;
    if (minPrice) filters.minPrice = minPrice;
    if (gender) filters.gender = gender;
    
    // If no specific filters found, use as search query
    if (Object.keys(filters).length === 0) {
      filters.searchQuery = message;
    }
    
    // Try OpenAI if API key is available and valid
    if (import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here') {
      const prompt = `
You are a fashion AI assistant for a thrift store. Parse the user's message and extract structured filters.

User message: "${message}"
Current user preferences: ${JSON.stringify(preferences)}

Extract and return ONLY a JSON object with these possible fields:
- category: clothing category (hoodie, jeans, t-shirt, dress, etc.)
- color: color (black, white, blue, etc.)
- style: style (vintage, oversized, casual, formal, etc.)
- minPrice: minimum price number
- maxPrice: maximum price number
- gender: men, women, unisex
- tags: array of style tags
- searchQuery: general search term if no specific filters

Examples:
"I need a cheap black hoodie" -> {"category": "hoodie", "color": "black", "maxPrice": 1000}
"vintage outfits under 1500" -> {"style": "vintage", "maxPrice": 1500}
"what goes with baggy jeans" -> {"category": "jeans", "style": "baggy"}
"show me red dresses" -> {"category": "dress", "color": "red"}

Respond with valid JSON only:
`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 200
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (content) {
          const parsed = JSON.parse(content);
          return { ...filters, ...parsed }; // Merge rule-based and AI results
        }
      } catch (error) {
        console.log('OpenAI parsing failed, using rule-based fallback:', error);
      }
    }

    return filters;
  }

  private async searchProductsWithFilters(filters: ParsedFilters): Promise<Product[]> {
    try {
      // Build Firebase query based on filters
      const queryConstraints: any[] = [];

      if (filters.category) {
        queryConstraints.push({ field: 'category', operator: '==', value: filters.category });
      }
      
      if (filters.color) {
        queryConstraints.push({ field: 'color', operator: '==', value: filters.color });
      }
      
      if (filters.style) {
        queryConstraints.push({ field: 'style', operator: '==', value: filters.style });
      }
      
      if (filters.gender) {
        queryConstraints.push({ field: 'gender', operator: '==', value: filters.gender });
      }
      
      if (filters.maxPrice) {
        queryConstraints.push({ field: 'price', operator: '<=', value: filters.maxPrice });
      }
      
      if (filters.minPrice) {
        queryConstraints.push({ field: 'price', operator: '>=', value: filters.minPrice });
      }

      // If we have specific filters, use filtered query
      if (queryConstraints.length > 0) {
        return await getProductsByFilters(queryConstraints);
      }
      
      // If only search query, use text search
      if (filters.searchQuery) {
        return await searchProducts(filters.searchQuery);
      }

      return [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  private async generateResponse(
    userMessage: string,
    filters: ParsedFilters,
    products: Product[],
    preferences: ChatPreferences,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<ChatResponse> {
    // Rule-based response generation when OpenAI is not available
    const hasValidApiKey = import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY !== 'your_openai_api_key_here';
    
    if (!hasValidApiKey) {
      return this.generateRuleBasedResponse(userMessage, filters, products);
    }

    const prompt = `
You are Stylease AI, a friendly and knowledgeable fashion assistant for a thrift store. Your personality is:
- Friendly, enthusiastic, and fashion-forward
- Knowledgeable about sustainable fashion and thrifting
- Helpful and conversational
- Uses emojis appropriately to add personality

User message: "${userMessage}"
Extracted filters: ${JSON.stringify(filters)}
Products found: ${products.length} items
User preferences: ${JSON.stringify(preferences)}

Recent conversation:
${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Generate a natural, conversational response that:
1. Acknowledges what they're looking for
2. Presents the found products in an appealing way
3. Offers helpful suggestions or alternatives if few/no products found
4. Maintains a friendly, fashionable tone
5. Includes 2-3 follow-up suggestions as a JSON array at the end

Response format:
[Your conversational response here]

SUGGESTIONS: ["suggestion 1", "suggestion 2", "suggestion 3"]

Examples:
"Great choice! I found some amazing black hoodies under ₹800 that would perfect for your style! 🖤 These pieces are not only stylish but also sustainable choices. 

SUGGESTIONS: ["Show me oversized options", "What pairs well with hoodies?", "Find me accessories to match"]"

"Looking for vintage outfits under ₹1500? I've got you covered! ✨ Vintage pieces add so much character to your wardrobe. Here are some timeless finds...

SUGGESTIONS: ["Show me more vintage items", "Complete this outfit", "What's trending in vintage?"]"
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are Stylease AI, a fashion assistant for a thrift store." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        // Extract suggestions from the response
        const suggestionsMatch = content.match(/SUGGESTIONS:\s*\[([^\]]+)\]/);
        const suggestions = suggestionsMatch 
          ? suggestionsMatch[1].split(',').map(s => s.trim().replace(/"/g, ''))
          : [];

        // Clean the content by removing the suggestions part
        const cleanContent = content.replace(/SUGGESTIONS:\s*\[[^\]]+\]/, '').trim();

        return {
          content: cleanContent,
          suggestions
        };
      }
    } catch (error) {
      console.error('Error generating response:', error);
    }

    // Fallback to rule-based response
    return this.generateRuleBasedResponse(userMessage, filters, products);
  }

  private generateRuleBasedResponse(
    userMessage: string,
    filters: ParsedFilters,
    products: Product[]
  ): ChatResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return {
        content: "Hello! 👋 I'm here to help you find amazing thrift items. What are you looking for today?",
        products: [], // No products for greetings
        suggestions: ["Show me trending items", "Find hoodies", "Browse dresses"]
      };
    }

    // Help responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        content: "I can help you find perfect thrift items! Try asking me for:\n• Specific items like 'black hoodies under 800'\n• Style suggestions like 'what goes with jeans'\n• Trending items or outfit ideas\n• Products by color, style, or price range",
        products: [], // No products for help
        suggestions: ["Show me trending items", "Find black hoodies", "Complete my outfit"]
      };
    }

    // Trending requests
    if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
      return {
        content: "Let me show you what's trending right now! 🔥 These are the most popular items in our thrift store.",
        products: products.slice(0, 6), // Show trending products
        suggestions: ["Show me more vintage items", "Find budget-friendly options", "Complete the outfit"]
      };
    }

    // Outfit completion requests
    if (lowerMessage.includes('complete') || lowerMessage.includes('outfit')) {
      return {
        content: "I'd love to help you complete your outfit! ✨ Tell me what item you're starting with, and I'll suggest complementary pieces.",
        products: [], // No products until user specifies starting item
        suggestions: ["Starting with jeans", "Starting with a t-shirt", "Starting with a dress"]
      };
    }

    // Budget-friendly requests
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      return {
        content: "Great choice! Budget-friendly shopping is smart and sustainable. 💰 Let me find you some amazing deals under ₹500.",
        products: products.slice(0, 6), // Show budget products
        suggestions: ["Show items under 300", "Find hoodies under 500", "Browse budget dresses"]
      };
    }

    // Product-based responses
    if (products.length > 0) {
      const filterDescriptions = [];
      if (filters.category) filterDescriptions.push(filters.category);
      if (filters.color) filterDescriptions.push(filters.color);
      if (filters.style) filterDescriptions.push(filters.style);
      if (filters.maxPrice) filterDescriptions.push(`under ₹${filters.maxPrice}`);
      
      const description = filterDescriptions.length > 0 
        ? filterDescriptions.join(' ')
        : 'items';
      
      return {
        content: `Great! I found ${products.length} ${description} for you! 🛍️ Take a look at these options and let me know if you'd like more details.`,
        products: products.slice(0, 6), // Show found products
        suggestions: ["Show me more like this", "Find cheaper options", "Complete the outfit"]
      };
    }

    // No products found
    if (Object.keys(filters).length > 0) {
      return {
        content: "**AI is currently under maintenance** 🛠️\n\nI'm working on improving my search capabilities to better serve you. In the meantime, you can:\n\n• Browse our trending items\n• Explore different categories\n• Try more specific search terms\n\nI'll be back with enhanced features soon! ✨",
        products: [], // No products when nothing found
        suggestions: ["Show trending items", "Browse all categories", "Help me find alternatives"]
      };
    }

    // Default response
    return {
      content: "I'm here to help you find the perfect thrift items! 🛍️ Try asking for specific items, styles, or let me show you what's trending.",
      products: [], // No products for default response
      suggestions: ["Show trending items", "Find hoodies", "Browse dresses"]
    };
  }

  private updatePreferences(
    message: string, 
    filters: ParsedFilters, 
    currentPreferences: ChatPreferences
  ): Partial<ChatPreferences> | null {
    const updates: Partial<ChatPreferences> = {};

    // Update favorite styles
    if (filters.style && !currentPreferences.favoriteStyles.includes(filters.style)) {
      updates.favoriteStyles = [...currentPreferences.favoriteStyles, filters.style].slice(-5); // Keep last 5
    }

    // Update favorite colors
    if (filters.color && !currentPreferences.favoriteColors.includes(filters.color)) {
      updates.favoriteColors = [...currentPreferences.favoriteColors, filters.color].slice(-5); // Keep last 5
    }

    // Update price range based on searches
    if (filters.maxPrice) {
      const newMaxPrice = Math.min(currentPreferences.priceRange.max, filters.maxPrice + 500);
      if (newMaxPrice !== currentPreferences.priceRange.max) {
        updates.priceRange = { ...currentPreferences.priceRange, max: newMaxPrice };
      }
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  async generateOutfitSuggestions(baseProduct: Product): Promise<Product[]> {
    try {
      const prompt = `
Given this base product, suggest 3-4 complementary items to create a complete outfit:

Base product: ${JSON.stringify(baseProduct)}

Suggest items that would complement this piece in terms of:
- Color coordination
- Style compatibility  
- Occasion appropriateness
- Current fashion trends

Return only the categories of items to search for (e.g., ["jeans", "sneakers", "accessories"])
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 100
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const categories = JSON.parse(content);
        const allSuggestions: Product[] = [];

        for (const category of categories) {
          const items = await getProductsByFilters([
            { field: 'category', operator: '==', value: category }
          ]);
          allSuggestions.push(...items.slice(0, 2)); // Take 2 items per category
        }

        return allSuggestions.slice(0, 6); // Return max 6 items
      }
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
    }

    return [];
  }
}

export const aiChatService = AIChatService.getInstance();
