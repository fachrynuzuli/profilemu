import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Input validation functions
function validateSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && 
         slug.length > 0 && 
         slug.length <= 50 && 
         /^[a-z0-9-]+$/.test(slug);
}

function validateMessage(message: unknown): message is string {
  return typeof message === 'string' && 
         message.length > 0 && 
         message.length <= 2000;
}

function validateConversationHistory(history: unknown): history is Array<{role: string; content: string}> {
  if (!history) return true; // Optional field
  if (!Array.isArray(history)) return false;
  if (history.length > 20) return false;
  
  return history.every(item => 
    typeof item === 'object' && 
    item !== null &&
    typeof item.role === 'string' && 
    typeof item.content === 'string' &&
    item.content.length <= 2000
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { slug, message, conversationHistory } = body;

    // Input validation
    if (!validateSlug(slug)) {
      console.warn(`Invalid slug received: ${typeof slug === 'string' ? slug.substring(0, 100) : 'non-string'}`);
      return new Response(
        JSON.stringify({ error: 'Invalid profile identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateMessage(message)) {
      console.warn(`Invalid message: length=${typeof message === 'string' ? message.length : 'non-string'}`);
      return new Response(
        JSON.stringify({ error: 'Message is required and must be under 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateConversationHistory(conversationHistory)) {
      console.warn('Invalid conversation history format or length');
      return new Response(
        JSON.stringify({ error: 'Invalid conversation history' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the profile by slug
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, bio, avatar_url, user_id')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all AI context for this user (user_id needed internally but not exposed)
    const { data: contexts, error: contextError } = await supabase
      .from('ai_context')
      .select('category, title, content')
      .eq('user_id', profile.user_id)
      .order('category', { ascending: true });

    if (contextError) {
      console.error('Error fetching context:', contextError);
    }

    // Build the AI context string
    const contextParts: string[] = [];
    
    if (profile.display_name) {
      contextParts.push(`Name: ${profile.display_name}`);
    }
    if (profile.bio) {
      contextParts.push(`Bio: ${profile.bio}`);
    }

    if (contexts && contexts.length > 0) {
      const groupedContext: Record<string, string[]> = {};
      contexts.forEach(ctx => {
        if (!groupedContext[ctx.category]) {
          groupedContext[ctx.category] = [];
        }
        groupedContext[ctx.category].push(`${ctx.title}: ${ctx.content}`);
      });

      Object.entries(groupedContext).forEach(([category, items]) => {
        contextParts.push(`\n${category.toUpperCase()}:\n${items.join('\n')}`);
      });
    }

    const personalContext = contextParts.join('\n');

    // Build system prompt
    const systemPrompt = `You are an AI twin of ${profile.display_name || 'a person'}. You represent them in conversations, answering questions as they would, using their knowledge, personality, and communication style.

Here is everything you know about the person you represent:
${personalContext}

Guidelines:
- Respond as if you ARE this person, using first person ("I", "my", "me")
- Match their personality and communication style based on the context provided
- Be friendly and engaging while staying true to their character
- If asked about something not in your context, politely say you're not sure or that aspect hasn't been shared with you yet
- Keep responses conversational and natural
- Don't mention that you're an AI unless directly asked`;

    // Build messages array with conversation history (sanitized)
    const sanitizedHistory = (conversationHistory || []).map((h: {role: string; content: string}) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content.substring(0, 2000)
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Calling Lovable AI Gateway for profile:', profile.display_name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble responding right now.";

    console.log('AI response generated successfully');

    // Return response WITHOUT user_id
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        profile: {
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-twin function:', error);
    // Generic error message to avoid leaking internal details
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
