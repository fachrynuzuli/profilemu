import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, User, Bot } from "lucide-react";

const demoMessages = [
  { role: "visitor", content: "Hi! I'm interested in hiring you for a project. What's your experience with React?" },
  { role: "ai", content: "Great question! I've been working with React for over 5 years, building everything from small components to large-scale enterprise applications. I particularly enjoy working with React Query for data fetching and Framer Motion for animations. What kind of project do you have in mind?" },
  { role: "visitor", content: "We need someone to build a dashboard. Are you available?" },
  { role: "ai", content: "Dashboard development is one of my specialties! I've built analytics dashboards, admin panels, and real-time monitoring systems. I typically use Recharts or D3 for data visualization. As for availability — I'd recommend booking a call to discuss the timeline and scope. Would you like me to share my calendar?" },
];

export function DemoSection() {
  const [messages, setMessages] = useState(demoMessages);
  const [inputValue, setInputValue] = useState("");

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            See Your <span className="text-gradient">AI Twin</span> In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This is how visitors experience your Profile.Mu — a natural conversation that sounds just like you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card variant="glass" className="overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-medium">Alex's AI Twin</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Always online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 h-[400px] overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 ${message.role === 'visitor' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'visitor' 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'gradient-hero text-primary-foreground'
                  }`}>
                    {message.role === 'visitor' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'visitor'
                      ? 'bg-secondary text-secondary-foreground rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything about Alex..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <Button variant="hero" size="icon" className="w-12 h-12 rounded-xl">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-4">
            This is a demo. Create your own AI twin to enable real conversations.
          </p>
        </div>
      </div>
    </section>
  );
}
