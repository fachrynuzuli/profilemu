import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedContent {
  category: string;
  title: string;
  content: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    let textContent = '';
    let isPdf = false;

    console.log('Processing resume/document for user:', user.id);
    console.log('File type:', file.type, 'Size:', file.size);

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      textContent = new TextDecoder().decode(fileBuffer);
      console.log('TXT extracted, length:', textContent.length);
      
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
               || file.name.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        textContent = result.value;
        console.log('DOCX extracted, length:', textContent.length);
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to parse DOCX file. Please ensure it is a valid Word document.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
    } else if (file.type === 'application/pdf') {
      isPdf = true;
      console.log('PDF detected, will use AI vision for extraction');
      
    } else if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Old .doc format is not supported. Please save as .docx or PDF and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate extracted content (skip for PDF which uses AI directly)
    if (!isPdf && textContent.length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract text from this file. It may be scanned/image-based. Please try a text-based document.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const extractionInstruction = `Analyze this resume/profile content and extract professional information into structured categories.

Extract and return a JSON array with the following structure. Each item should have:
- category: one of "bio", "career", "skills", "projects", "expertise_areas"
- title: a descriptive title for this piece of knowledge
- content: the extracted content (detailed, comprehensive)

Categories to extract:
1. "bio" - Professional summary, about section, personal statement
2. "career" - Work experience, job history, roles held
3. "skills" - Technical skills, soft skills, tools, technologies
4. "projects" - Notable projects, achievements, portfolio items
5. "expertise_areas" - Areas of deep expertise, specializations

Return ONLY a valid JSON array. Example format:
[
  {"category": "bio", "title": "Professional Summary", "content": "..."},
  {"category": "career", "title": "Work Experience", "content": "..."},
  {"category": "skills", "title": "Technical Skills", "content": "..."}
]

Extract as much relevant information as possible. If a category has no relevant content, skip it.`;

    let messages: any[];

    if (isPdf) {
      // For PDFs, send as base64 to a vision-capable model
      const base64Data = arrayBufferToBase64(fileBuffer);
      messages = [
        { role: 'system', content: 'You are an expert at parsing resumes and extracting structured professional information. Always return valid JSON arrays only.' },
        { 
          role: 'user', 
          content: [
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64Data}`
              }
            },
            {
              type: 'text',
              text: extractionInstruction
            }
          ]
        }
      ];
    } else {
      messages = [
        { role: 'system', content: 'You are an expert at parsing resumes and extracting structured professional information. Always return valid JSON arrays only.' },
        { role: 'user', content: `${extractionInstruction}\n\nDOCUMENT CONTENT:\n${textContent.substring(0, 10000)}` }
      ];
    }

    console.log('Sending to AI for extraction, isPdf:', isPdf);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to process document with AI');
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content || '';

    console.log('AI extraction response received');

    let extractedItems: ExtractedContent[] = [];
    
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.log('AI content:', aiContent.substring(0, 500));
      
      if ((textContent || aiContent).length > 100) {
        extractedItems = [{
          category: 'bio',
          title: 'Resume Content',
          content: (textContent || aiContent).substring(0, 3000)
        }];
      }
    }

    const validCategories = ['bio', 'career', 'skills', 'projects', 'expertise_areas', 'writing_style', 'personality'];
    extractedItems = extractedItems.filter(item => 
      item.category && 
      item.title && 
      item.content && 
      validCategories.includes(item.category) &&
      item.content.length > 20
    );

    const savedItems: ExtractedContent[] = [];
    
    for (const item of extractedItems) {
      const { error: insertError } = await supabase
        .from('ai_context')
        .insert({
          user_id: user.id,
          category: item.category,
          title: item.title,
          content: item.content.substring(0, 5000)
        });

      if (insertError) {
        console.error('Error inserting context:', insertError);
      } else {
        savedItems.push(item);
      }
    }

    console.log(`Resume parsing complete. Extracted ${savedItems.length} knowledge entries`);

    return new Response(
      JSON.stringify({
        success: true,
        extracted: savedItems,
        totalExtracted: savedItems.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred while processing the document' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
