import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsCard from "@/components/dashboard/AnalyticsCard";
import { 
  MessageCircle, 
  LogOut, 
  Plus, 
  Trash2, 
  Save, 
  Globe, 
  User,
  Briefcase,
  Brain,
  PenTool,
  Sparkles,
  FolderOpen,
  Eye,
  ExternalLink,
  Target,
  ShieldAlert,
  Settings,
  BarChart3
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  is_published: boolean;
  slug: string | null;
}

interface AIContext {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  bio: <User className="w-4 h-4" />,
  career: <Briefcase className="w-4 h-4" />,
  skills: <Brain className="w-4 h-4" />,
  writing_style: <PenTool className="w-4 h-4" />,
  personality: <Sparkles className="w-4 h-4" />,
  projects: <FolderOpen className="w-4 h-4" />,
  expertise_areas: <Target className="w-4 h-4" />,
  expertise_boundaries: <ShieldAlert className="w-4 h-4" />,
  custom: <Plus className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  bio: "Biography",
  career: "Career & Experience",
  skills: "Skills & Expertise",
  writing_style: "Writing Style",
  personality: "Personality",
  projects: "Projects",
  expertise_areas: "Areas of Expertise",
  expertise_boundaries: "Knowledge Boundaries",
  custom: "Custom",
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contexts, setContexts] = useState<AIContext[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newContext, setNewContext] = useState({ category: "bio", title: "", content: "" });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoadingData(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch AI contexts
      const { data: contextData } = await supabase
        .from("ai_context")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (contextData) {
        setContexts(contextData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          slug: profile.slug,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!profile || !user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_published: !profile.is_published })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({ ...profile, is_published: !profile.is_published });
      toast({
        title: profile.is_published ? "Profile unpublished" : "Profile published!",
        description: profile.is_published 
          ? "Your AI twin is now private." 
          : "Your AI twin is now live and accessible!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleAddContext = async () => {
    if (!user || !newContext.title || !newContext.content) return;
    
    try {
      const { data, error } = await supabase
        .from("ai_context")
        .insert({
          user_id: user.id,
          category: newContext.category,
          title: newContext.title,
          content: newContext.content,
        })
        .select()
        .single();

      if (error) throw error;

      setContexts([...contexts, data]);
      setNewContext({ category: "bio", title: "", content: "" });
      setShowNewForm(false);
      
      toast({
        title: "Context added",
        description: "Your AI twin now knows more about you!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteContext = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_context")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContexts(contexts.filter(c => c.id !== id));
      toast({
        title: "Context deleted",
        description: "The knowledge has been removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl">Profile.Mu</span>
          </div>

          <div className="flex items-center gap-3">
            {profile?.is_published && profile?.slug && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/p/${profile.slug}`, '_blank')}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View Profile</span>
              </Button>
            )}
            <Button
              variant={profile?.is_published ? "default" : "soft"}
              onClick={handleTogglePublish}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              {profile?.is_published ? "Published" : "Publish"}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl mb-2">
                Welcome, {profile?.display_name || "Creator"}
              </h1>
              <p className="text-muted-foreground">
                Manage your AI twin's knowledge and personality.
              </p>
            </div>
            {profile?.slug && profile?.is_published && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">profile.mu/{profile.slug}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${profile.slug}`)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="knowledge" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="knowledge" className="gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Knowledge</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Knowledge Tab */}
            <TabsContent value="knowledge" className="space-y-6">

              {/* AI Context */}
              <Card variant="elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        AI Knowledge Base
                      </CardTitle>
                      <CardDescription>
                        Add context and knowledge for your AI twin to learn from.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowNewForm(true)} variant="soft" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Knowledge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* New Context Form */}
                  {showNewForm && (
                    <Card variant="flat" className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <select
                            value={newContext.category}
                            onChange={(e) => setNewContext({...newContext, category: e.target.value})}
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground"
                          >
                            {Object.entries(categoryLabels).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={newContext.title}
                            onChange={(e) => setNewContext({...newContext, title: e.target.value})}
                            placeholder="e.g., My career journey"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea
                          value={newContext.content}
                          onChange={(e) => setNewContext({...newContext, content: e.target.value})}
                          placeholder="Share your knowledge, experiences, or personality traits..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddContext} className="gap-2">
                          <Save className="w-4 h-4" />
                          Save Knowledge
                        </Button>
                        <Button variant="ghost" onClick={() => setShowNewForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Existing Contexts */}
                  {contexts.length === 0 && !showNewForm ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No knowledge added yet.</p>
                      <p className="text-sm">Add context to train your AI twin.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contexts.map((context) => (
                        <Card key={context.id} variant="flat" className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                                  {categoryIcons[context.category] || categoryIcons.custom}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  {categoryLabels[context.category] || context.category}
                                </span>
                              </div>
                              <h4 className="font-medium mb-1">{context.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {context.content}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContext(context.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Settings Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Your Profile
                  </CardTitle>
                  <CardDescription>
                    Basic information that represents your AI twin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profile?.display_name || ""}
                        onChange={(e) => setProfile(profile ? {...profile, display_name: e.target.value} : null)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Profile URL</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">profile.mu/</span>
                        <Input
                          id="slug"
                          value={profile?.slug || ""}
                          onChange={(e) => setProfile(profile ? {...profile, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')} : null)}
                          placeholder="your-name"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Short Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile?.bio || ""}
                      onChange={(e) => setProfile(profile ? {...profile, bio: e.target.value} : null)}
                      placeholder="A brief description of who you are..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleUpdateProfile} disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsCard profileId={profile?.id} />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
