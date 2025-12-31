import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  platform: string;
  content: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  return 'website';
}

function formatUrl(url: string): string {
  let formatted = url.trim();
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `https://${formatted}`;
  }
  return formatted;
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log('Scraping URL with Firecrawl:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000, // Wait for dynamic content
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Firecrawl API error:', data);
    return { success: false, error: data.error || `Request failed with status ${response.status}` };
  }

  console.log('Scrape successful');
  return { success: true, data };
}

function extractRelevantContent(markdown: string, platform: string): { title: string; content: string; category: string }[] {
  const results: { title: string; content: string; category: string }[] = [];
  
  // Clean up the markdown
  let cleanContent = markdown
    .replace(/\[.*?\]\(.*?\)/g, match => match.replace(/\[|\]/g, '').split('(')[0]) // Extract link text
    .replace(/#{1,6}\s*/g, '') // Remove markdown headers
    .replace(/\*{1,2}|_{1,2}/g, '') // Remove bold/italic markers
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
    .trim();

  if (platform === 'linkedin') {
    // Extract bio/summary section
    const summaryMatch = cleanContent.match(/(?:About|Summary|Bio)[\s\S]*?(?=Experience|Education|Skills|$)/i);
    if (summaryMatch && summaryMatch[0].length > 50) {
      results.push({
        title: 'LinkedIn Profile Summary',
        content: summaryMatch[0].substring(0, 2000).trim(),
        category: 'bio'
      });
    }

    // Extract experience
    const experienceMatch = cleanContent.match(/Experience[\s\S]*?(?=Education|Skills|Certifications|$)/i);
    if (experienceMatch && experienceMatch[0].length > 50) {
      results.push({
        title: 'Professional Experience',
        content: experienceMatch[0].substring(0, 3000).trim(),
        category: 'career'
      });
    }

    // Extract skills
    const skillsMatch = cleanContent.match(/Skills[\s\S]*?(?=Certifications|Recommendations|$)/i);
    if (skillsMatch && skillsMatch[0].length > 30) {
      results.push({
        title: 'Skills & Endorsements',
        content: skillsMatch[0].substring(0, 1500).trim(),
        category: 'skills'
      });
    }

    // If no structured data found, save full profile
    if (results.length === 0 && cleanContent.length > 100) {
      results.push({
        title: 'LinkedIn Profile',
        content: cleanContent.substring(0, 3000),
        category: 'bio'
      });
    }
  } else if (platform === 'twitter') {
    // Twitter/X profile content
    const bioMatch = cleanContent.match(/(?:Bio|About|Description)[\s\S]{0,500}/i);
    if (bioMatch) {
      results.push({
        title: 'Twitter/X Bio',
        content: bioMatch[0].substring(0, 500).trim(),
        category: 'personality'
      });
    }

    // Extract recent tweets/posts for writing style
    const tweetsContent = cleanContent.substring(0, 2000);
    if (tweetsContent.length > 100) {
      results.push({
        title: 'Social Media Writing Style',
        content: `Based on their Twitter/X posts:\n${tweetsContent}`,
        category: 'writing_style'
      });
    }
  } else {
    // Personal website
    // Extract about section
    const aboutMatch = cleanContent.match(/(?:About|Bio|Who I am|My Story)[\s\S]*?(?=Projects|Work|Contact|Portfolio|$)/i);
    if (aboutMatch && aboutMatch[0].length > 50) {
      results.push({
        title: 'About (from personal website)',
        content: aboutMatch[0].substring(0, 2000).trim(),
        category: 'bio'
      });
    }

    // Extract projects/work
    const projectsMatch = cleanContent.match(/(?:Projects|Portfolio|Work|My Work)[\s\S]*?(?=Contact|About|Blog|$)/i);
    if (projectsMatch && projectsMatch[0].length > 50) {
      results.push({
        title: 'Projects & Portfolio',
        content: projectsMatch[0].substring(0, 2500).trim(),
        category: 'projects'
      });
    }

    // If no structured data, save a general summary
    if (results.length === 0 && cleanContent.length > 100) {
      results.push({
        title: 'Website Content',
        content: cleanContent.substring(0, 3000),
        category: 'bio'
      });
    }
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured. Please connect it in Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 5 URLs at a time
    const urlsToScrape = urls.slice(0, 5);
    const results: { url: string; platform: string; extracted: any[]; error?: string }[] = [];

    for (const url of urlsToScrape) {
      const formattedUrl = formatUrl(url);
      const platform = detectPlatform(formattedUrl);
      
      console.log(`Processing ${platform} URL: ${formattedUrl}`);

      const scrapeResult = await scrapeWithFirecrawl(formattedUrl, firecrawlApiKey);
      
      if (!scrapeResult.success) {
        results.push({
          url: formattedUrl,
          platform,
          extracted: [],
          error: scrapeResult.error
        });
        continue;
      }

      // Extract markdown content (handle nested data structure)
      const markdown = scrapeResult.data?.data?.markdown || scrapeResult.data?.markdown || '';
      
      if (!markdown) {
        results.push({
          url: formattedUrl,
          platform,
          extracted: [],
          error: 'No content could be extracted from this URL'
        });
        continue;
      }

      // Extract relevant sections
      const extracted = extractRelevantContent(markdown, platform);
      
      // Save each extracted piece to ai_context
      for (const item of extracted) {
        const { error: insertError } = await supabase
          .from('ai_context')
          .insert({
            user_id: user.id,
            category: item.category,
            title: item.title,
            content: item.content
          });

        if (insertError) {
          console.error('Error inserting context:', insertError);
        }
      }

      results.push({
        url: formattedUrl,
        platform,
        extracted
      });
    }

    const totalExtracted = results.reduce((sum, r) => sum + r.extracted.length, 0);
    console.log(`Scraping complete. Extracted ${totalExtracted} knowledge entries from ${results.length} URLs`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalExtracted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-social-profile function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred while scraping' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
