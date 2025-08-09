'use client'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, X, Send } from "lucide-react"

// Define the structure for a chat message
interface ChatMessage {
  sender: 'user' | 'bot' | 'error';
  text: string;
}

// The Chatbot component
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Hello! I'm here to help with registration, bike info, booking access codes, and reporting issues. How can I assist you today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // More robust session ID generator
  const [sessionId] = useState(`react-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const originalMessage = inputValue;
    const userMessage: ChatMessage = { sender: 'user', text: originalMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

<<<<<<< HEAD
    //API gateway url
    // const API_GATEWAY_URL = '';
    const API_GATEWAY_URL = "https://uxx768awoj.execute-api.us-east-1.amazonaws.com/dev/chat"
=======
    // 🚨 REPLACE THIS WITH YOUR ACTUAL API GATEWAY URL FROM: terraform output api_gateway_url
    const API_GATEWAY_URL = 'https://uxx768awoj.execute-api.us-east-1.amazonaws.com/dev/chat';
>>>>>>> 6854761 (Update: Integrated virtual assiatant with Bike managment module and Message passing module, chatbot now can acess booking information directly and pass down concerns)

    try {
      console.log('Sending request to:', API_GATEWAY_URL);
      console.log('Payload:', { message: originalMessage, sessionId });

      const response = await fetch(API_GATEWAY_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors', // Explicitly set CORS mode
        body: JSON.stringify({
          message: originalMessage,
          sessionId: sessionId
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      const botMessage: ChatMessage = { 
        sender: 'bot', 
        text: data.message || "Sorry, I didn't receive a proper response." 
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Chatbot API error:", error);
      
      let errorMessage = "Sorry, I'm having trouble connecting. Please try again later.";
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Connection failed. This might be a CORS issue or network problem. Check the console for details.";
        } else if (error.message.includes('404')) {
          errorMessage = "API endpoint not found. Please check the API Gateway URL.";
        } else if (error.message.includes('403')) {
          errorMessage = "Access forbidden. Please check API permissions.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error. Please check the Lambda function logs.";
        }
      }
      
      const errorMsg: ChatMessage = { 
        sender: 'error', 
        text: errorMessage 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick test function for debugging
  const sendTestMessage = (message: string) => {
    setInputValue(message);
    // Small delay to ensure state is updated
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div>
      {/* The floating chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50">
          <Card className="w-80 h-[500px] flex flex-col shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
              <CardTitle className="text-lg">DALScooter Assistant</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-3 py-2 max-w-xs ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.sender === 'error'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-muted'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                   <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground animate-pulse">
                     Thinking...
                   </div>
                 </div>
              )}
              
              {/* Debug/Test buttons - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="border-t pt-2 mt-4">
                  <div className="text-xs text-muted-foreground mb-2">Quick Tests:</div>
                  <div className="flex flex-wrap gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6 px-2"
                      onClick={() => sendTestMessage('help')}
                    >
                      Help
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6 px-2"
                      onClick={() => sendTestMessage('How do I register?')}
                    >
                      Register
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6 px-2"
                      onClick={() => sendTestMessage('What bikes are available?')}
                    >
                      Bikes
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6 px-2"
                      onClick={() => sendTestMessage('Get access code for BK123456')}
                    >
                      Test Booking
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="text-sm"
                />
                <Button 
                  type="submit" 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* The button to open the chat */}
      <Button
        className="fixed bottom-4 right-4 rounded-full h-16 w-16 shadow-lg z-40"
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
      >
        {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
      </Button>
    </div>
  );
}