import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.length < 10) {
      return new Response(JSON.stringify({ error: 'Please provide at least 10 characters of text.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 20000) {
      return new Response(JSON.stringify({ error: 'Text is too long. Please limit to 20,000 characters.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are a professional profile analyst. Given raw text (bio, LinkedIn summary, resume, portfolio description, etc.), extract and categorize the information into structured knowledge entries for an AI digital twin.

Return a JSON array of objects with these fields:
- "category": one of "bio", "career", "skills", "writing_style", "personality", "projects", "expertise_areas", "custom"
- "title": a short descriptive title (3-8 words)
- "content": the extracted information as a clear, first-person summary

Guidelines:
- Extract 3-8 meaningful entries from the text
- Use "bio" for personal background and identity
- Use "career" for work history, roles, companies
- Use "skills" for technical skills, tools, languages
- Use "expertise_areas" for deep domain expertise
- Use "projects" for notable projects or achievements
- Use "personality" for communication style, values, interests
- Write content in first person as if the person is describing themselves
- Be concise but capture the essence of each piece of information
- Do NOT fabricate information not present in the text`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'save_profile_entries',
            description: 'Save categorized profile knowledge entries',
            parameters: {
              type: 'object',
              properties: {
                entries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', enum: ['bio', 'career', 'skills', 'writing_style', 'personality', 'projects', 'expertise_areas', 'custom'] },
                      title: { type: 'string' },
                      content: { type: 'string' },
                    },
                    required: ['category', 'title', 'content'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['entries'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'save_profile_entries' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error('AI processing failed');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured output from AI');

    const parsed = JSON.parse(toolCall.function.arguments);
    const entries = parsed.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not extract meaningful information from the text.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to database
    const dbEntries = entries.map((e: any) => ({
      user_id: user.id,
      category: e.category,
      title: e.title,
      content: e.content,
    }));

    const { data: saved, error: dbError } = await supabase
      .from('ai_context')
      .insert(dbEntries)
      .select();

    if (dbError) {
      console.error('DB insert error:', dbError);
      throw new Error('Failed to save entries');
    }

    console.log(`Parsed ${entries.length} entries from text for user ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      entries: saved,
      count: saved?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('parse-text error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process text. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
