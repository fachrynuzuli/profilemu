import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Linkedin, 
  Globe, 
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ScrapeResult {
  url: string;
  platform: string;
  extracted: Array<{ title: string; content: string; category: string }>;
  error?: string;
}

interface SocialScraperProps {
  onComplete: () => void;
}

export function SocialScraper({ onComplete }: SocialScraperProps) {
  const { toast } = useToast();
  const [urls, setUrls] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);

  const addUrl = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'twitter':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const handleScrape = async () => {
    const validUrls = urls.filter(url => url.trim().length > 0);
    
    if (validUrls.length === 0) {
      toast({
        variant: "destructive",
        title: "No URLs provided",
        description: "Please enter at least one URL to scrape.",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Not authenticated",
          description: "Please sign in to use this feature.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('scrape-social-profile', {
        body: { urls: validUrls },
      });

      if (error) {
        console.error('Scrape error:', error);
        toast({
          variant: "destructive",
          title: "Scraping failed",
          description: error.message || "Failed to scrape the provided URLs.",
        });
        return;
      }

      if (data.success) {
        setResults(data.results);
        
        const totalExtracted = data.totalExtracted || 0;
        
        if (totalExtracted > 0) {
          toast({
            title: "Scraping complete!",
            description: `Successfully extracted ${totalExtracted} knowledge ${totalExtracted === 1 ? 'entry' : 'entries'} from your profiles.`,
          });
          
          // Refresh the parent data after a short delay
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          toast({
            variant: "destructive",
            title: "No content extracted",
            description: "Could not extract meaningful content from the provided URLs. Try different URLs or add knowledge manually.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Scraping failed",
          description: data.error || "Failed to scrape the provided URLs.",
        });
      }
    } catch (error: any) {
      console.error('Scrape error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Import from Social Profiles
        </CardTitle>
        <CardDescription>
          Paste your LinkedIn, Twitter/X, or personal website URLs to automatically extract knowledge for your AI twin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile or your-website.com"
                  disabled={isLoading}
                />
              </div>
              {urls.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUrl(index)}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {urls.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addUrl}
              disabled={isLoading}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another URL
            </Button>
          )}
        </div>

        <Button
          onClick={handleScrape}
          disabled={isLoading || urls.every(u => !u.trim())}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing profiles...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Import Knowledge
            </>
          )}
        </Button>

        {/* Results display */}
        {results && results.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-medium">Import Results</Label>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  result.error 
                    ? 'border-destructive/30 bg-destructive/5' 
                    : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getPlatformIcon(result.platform)}
                  <span className="text-sm font-medium truncate flex-1">
                    {result.url}
                  </span>
                  {result.error ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                
                {result.error ? (
                  <p className="text-sm text-destructive">{result.error}</p>
                ) : (
                  <div className="space-y-1">
                    {result.extracted.map((item, i) => (
                      <div key={i} className="text-sm text-muted-foreground">
                        ✓ {item.title}
                      </div>
                    ))}
                    {result.extracted.length === 0 && (
                      <p className="text-sm text-muted-foreground">No content extracted</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Supports LinkedIn profiles, Twitter/X profiles, and personal websites. 
          Content is automatically categorized and added to your knowledge base.
        </p>
      </CardContent>
    </Card>
  );
}
