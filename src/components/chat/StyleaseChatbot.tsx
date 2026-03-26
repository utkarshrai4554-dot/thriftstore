import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  products?: Product[];
  timestamp: Date;
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
}

interface ChatPreferences {
  favoriteStyles: string[];
  priceRange: { min: number; max: number };
  favoriteColors: string[];
  recentlyViewed: string[];
}

const StyleaseChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [preferences, setPreferences] = useState<ChatPreferences>({
    favoriteStyles: [],
    priceRange: { min: 0, max: 5000 },
    favoriteColors: [],
    recentlyViewed: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history and preferences from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('stylease-chat-history');
    const savedPreferences = localStorage.getItem('stylease-chat-preferences');
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
    
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('stylease-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('stylease-chat-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual AI service)
      const botResponse = await processUserMessage(inputValue.trim(), preferences, updatedMessages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse.content,
        products: botResponse.products,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Update preferences if needed
      if (botResponse.updatedPreferences) {
        setPreferences(prev => ({ ...prev, ...botResponse.updatedPreferences }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "Sorry, I'm having trouble understanding. Could you try rephrasing that?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <Card className="w-48 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
          <img 
            src={product.imageURL} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/api/placeholder/200/200';
            }}
          />
        </div>
        <h4 className="font-medium text-sm truncate">{product.name}</h4>
        <p className="text-lg font-bold text-primary">₹{product.price}</p>
        <div className="flex gap-1 mt-1">
          {product.color && (
            <Badge variant="secondary" className="text-xs">{product.color}</Badge>
          )}
          {product.style && (
            <Badge variant="outline" className="text-xs">{product.style}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg transition-all duration-300 bg-gray-800 hover:bg-gray-700 text-white",
          isOpen && "scale-0"
        )}
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300",
        !isOpen && "scale-0 opacity-0 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white text-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Stylease AI</h3>
              <p className="text-xs text-gray-500">Your fashion assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
                <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Welcome to Stylease AI! 👋</h4>
                <p className="text-sm text-gray-600 mb-4">
                  I'm here to help you find the perfect thrift items. Try asking:
                </p>
                <div className="space-y-2 text-left">
                  <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-700">
                    "Show me black hoodies under 800"
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-700">
                    "What goes well with baggy jeans?"
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-700">
                    "Suggest vintage outfits"
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[80%]",
                  message.type === 'user' && "text-right"
                )}>
                  <div className={cn(
                    "rounded-2xl px-4 py-2 inline-block",
                    message.type === 'user' 
                      ? "bg-gray-800 text-white rounded-br-sm" 
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}>
                    <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
                  </div>
                  
                  {/* Product Cards */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Found items:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {message.products.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about fashion, products, or styles..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              size="icon" 
              disabled={!inputValue.trim() || isTyping}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setInputValue("Show me trending items")}
              disabled={isTyping}
            >
              <ShoppingBag className="w-3 h-3 mr-1" />
              Trending
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setInputValue("Complete my outfit")}
              disabled={isTyping}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Complete Look
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setInputValue("Show me cheaper options")}
              disabled={isTyping}
            >
              💰 Budget Friendly
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Mock AI processing function (will be replaced with actual AI service)
async function processUserMessage(message: string, preferences: ChatPreferences, chatHistory: Message[]) {
  try {
    // Import the AI service dynamically to avoid circular dependencies
    const { aiChatService } = await import('@/services/aiChatService');
    
    // Convert chat history to the format expected by AI service
    const conversationHistory = chatHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    return await aiChatService.processMessage(message, preferences, conversationHistory);
  } catch (error) {
    console.error('Error in AI service:', error);
    // Fallback response
    return {
      content: `I understand you're looking for "${message}". Let me help you find the perfect items!`,
      products: [],
      updatedPreferences: null
    };
  }
}

export default StyleaseChatbot;
