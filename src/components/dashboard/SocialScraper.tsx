import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeUpload } from "./ResumeUpload";
import { 
  Loader2, 
  Globe, 
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardPaste
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
  
  // Paste text state
  const [pasteText, setPasteText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResults, setParseResults] = useState<Array<{ title: string; category: string }> | null>(null);

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
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
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

  const handleParseText = async () => {
    if (!pasteText.trim() || pasteText.trim().length < 10) {
      toast({ variant: "destructive", title: "Too short", description: "Please paste at least 10 characters of text." });
      return;
    }

    setIsParsing(true);
    setParseResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('parse-text', {
        body: { text: pasteText.trim() },
      });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to process text." });
        return;
      }

      if (data?.success && data.count > 0) {
        setParseResults(data.entries.map((e: any) => ({ title: e.title, category: e.category })));
        toast({
          title: "Text imported!",
          description: `AI extracted ${data.count} knowledge ${data.count === 1 ? 'entry' : 'entries'} from your text.`,
        });
        setPasteText("");
        setTimeout(() => onComplete(), 1500);
      } else {
        toast({ variant: "destructive", title: "No content found", description: data?.error || "Could not extract information from the text." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card variant="elevated" className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Auto-Import Knowledge
        </CardTitle>
        <CardDescription>
          Import your professional info from websites or documents to train your AI twin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste" className="gap-2">
              <ClipboardPaste className="w-4 h-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="resume" className="gap-2">
              <FileText className="w-4 h-4" />
              Resume/PDF
            </TabsTrigger>
            <TabsTrigger value="website" className="gap-2">
              <Globe className="w-4 h-4" />
              Website
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste your bio, LinkedIn summary, resume text, or any professional description. AI will automatically categorize it.
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Paste your bio, LinkedIn About section, resume summary, or any text that describes you professionally...\n\nExample:\nI'm a product designer with 8 years of experience in fintech and SaaS. I specialize in design systems, user research, and prototyping..."}
              rows={6}
              disabled={isParsing}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pasteText.length.toLocaleString()} / 20,000 characters
              </span>
              <Button
                onClick={handleParseText}
                disabled={isParsing || pasteText.trim().length < 10}
                className="gap-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is categorizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Import with AI
                  </>
                )}
              </Button>
            </div>

            {parseResults && parseResults.length > 0 && (
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Imported {parseResults.length} entries</span>
                </div>
                {parseResults.map((item, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    ✓ {item.title} <span className="text-xs opacity-60">({item.category})</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="resume" className="mt-4">
            <ResumeUpload onComplete={onComplete} />
          </TabsContent>
          
          <TabsContent value="website" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your personal website or portfolio URL. Note: LinkedIn and Instagram require direct scraping access.
            </p>
            
            <div className="space-y-3">
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://your-website.com"
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
                  Analyzing website...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Import from Website
                </>
              )}
            </Button>

            {/* Results display */}
            {results && results.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-medium">Import Results</p>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
