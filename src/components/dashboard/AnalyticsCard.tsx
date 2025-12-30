import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MessageSquare, Users, TrendingUp, Calendar } from "lucide-react";

interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  todayConversations: number;
  weekConversations: number;
}

interface AnalyticsCardProps {
  profileId: string | undefined;
}

const AnalyticsCard = ({ profileId }: AnalyticsCardProps) => {
  const [stats, setStats] = useState<ConversationStats>({
    totalConversations: 0,
    totalMessages: 0,
    todayConversations: 0,
    weekConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profileId) {
      fetchStats();
    }
  }, [profileId]);

  const fetchStats = async () => {
    if (!profileId) return;
    
    try {
      // Get all conversations for this profile
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("profile_id", profileId);

      if (error) throw error;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalConversations = conversations?.length || 0;
      const totalMessages = conversations?.reduce((sum, c) => sum + (c.messages_count || 0), 0) || 0;
      const todayConversations = conversations?.filter(c => 
        new Date(c.started_at) >= todayStart
      ).length || 0;
      const weekConversations = conversations?.filter(c => 
        new Date(c.started_at) >= weekStart
      ).length || 0;

      setStats({
        totalConversations,
        totalMessages,
        todayConversations,
        weekConversations,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statItems = [
    {
      label: "Total Conversations",
      value: stats.totalConversations,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Messages",
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Today",
      value: stats.todayConversations,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      label: "This Week",
      value: stats.weekConversations,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Conversation Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Conversation Analytics
        </CardTitle>
        <CardDescription>
          Track how visitors are interacting with your AI twin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors"
            >
              <div className={`p-2 rounded-lg ${item.bgColor} w-fit mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {stats.totalConversations === 0 && (
          <div className="text-center py-8 text-muted-foreground mt-4 border-t border-border/50">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No conversations yet.</p>
            <p className="text-sm">Share your profile to start getting visitors!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
