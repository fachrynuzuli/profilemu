import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Code2, Copy, Check, ExternalLink } from "lucide-react";

interface EmbedCodeCardProps {
  slug: string | null;
  isPublished: boolean;
}

export function EmbedCodeCard({ slug, isPublished }: EmbedCodeCardProps) {
  const { toast } = useToast();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!slug || !isPublished) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            Embed Widget
          </CardTitle>
          <CardDescription>
            Publish your profile first to get your embed code.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${slug}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  style="position:fixed;bottom:0;right:0;width:420px;height:600px;border:none;z-index:999999;"
  allow="clipboard-write"
></iframe>`;

  const scriptCode = `<script>
(function(){
  var d=document,f=d.createElement('iframe');
  f.src='${embedUrl}';
  f.style.cssText='position:fixed;bottom:0;right:0;width:420px;height:600px;border:none;z-index:999999;background:transparent;';
  f.allow='clipboard-write';
  d.body.appendChild(f);
})();
</script>`;

  const copyCode = (code: string, tab: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    toast({ title: "Copied!", description: "Embed code copied to clipboard." });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          Embed Widget
        </CardTitle>
        <CardDescription>
          Add your AI twin chat widget to any website. Paste the code before the closing &lt;/body&gt; tag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="script">Script Tag</TabsTrigger>
            <TabsTrigger value="iframe">Iframe</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-3 space-y-3">
            <div className="relative">
              <pre className="p-4 rounded-lg bg-muted/50 border border-border/50 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground/80">
                {scriptCode}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
                onClick={() => copyCode(scriptCode, "script")}
              >
                {copiedTab === "script" ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="iframe" className="mt-3 space-y-3">
            <div className="relative">
              <pre className="p-4 rounded-lg bg-muted/50 border border-border/50 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground/80">
                {iframeCode}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
                onClick={() => copyCode(iframeCode, "iframe")}
              >
                {copiedTab === "iframe" ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(embedUrl, "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview Widget
        </Button>
      </CardContent>
    </Card>
  );
}
