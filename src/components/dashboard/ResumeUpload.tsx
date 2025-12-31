import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

interface ExtractedItem {
  category: string;
  title: string;
  content: string;
}

interface ResumeUploadProps {
  onComplete: () => void;
}

const categoryLabels: Record<string, string> = {
  bio: "Biography",
  career: "Career & Experience",
  skills: "Skills & Expertise",
  projects: "Projects",
  expertise_areas: "Areas of Expertise",
};

export function ResumeUpload({ onComplete }: ResumeUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtractedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
        });
        return;
      }
      setSelectedFile(file);
      setResults(null);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
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

      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call edge function with file
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      if (data.success && data.totalExtracted > 0) {
        setResults(data.extracted);
        toast({
          title: "Resume processed!",
          description: `Successfully extracted ${data.totalExtracted} knowledge ${data.totalExtracted === 1 ? 'entry' : 'entries'} from your resume.`,
        });
        
        // Refresh parent data
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError('Could not extract meaningful content from the document. Try a different file or add knowledge manually.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="flat" className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4 text-primary" />
          Upload Resume or LinkedIn PDF
        </CardTitle>
        <CardDescription className="text-sm">
          Upload your resume, CV, or LinkedIn PDF export to automatically populate your knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, or TXT (max 5MB)</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <FileText className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={isLoading}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {selectedFile && !results && (
          <Button
            onClick={handleUpload}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing document...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Extract Knowledge
              </>
            )}
          </Button>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results display */}
        {results && results.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Successfully extracted:
            </p>
            {results.map((item, index) => (
              <div 
                key={index} 
                className="p-2 rounded bg-primary/5 text-sm"
              >
                <span className="font-medium">{categoryLabels[item.category] || item.category}:</span>{' '}
                <span className="text-muted-foreground">{item.title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
