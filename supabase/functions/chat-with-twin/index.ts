import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function validateSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 50 && /^[a-z0-9-]+$/.test(slug);
}
function validateMessage(message: unknown): message is string {
  return typeof message === 'string' && message.length > 0 && message.length <= 2000;
}
function validateConversationHistory(history: unknown): history is Array<{role: string; content: string}> {
  if (!history) return true;
  if (!Array.isArray(history)) return false;
  if (history.length > 20) return false;
  return history.every(item =>
    typeof item === 'object' && item !== null &&
    typeof item.role === 'string' && typeof item.content === 'string' &&
    item.content.length <= 2000
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { slug, message, conversationHistory, stream: wantStream } = body;

    if (!validateSlug(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid profile identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!validateMessage(message)) {
      return new Response(JSON.stringify({ error: 'Message is required and must be under 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!validateConversationHistory(conversationHistory)) {
      return new Response(JSON.stringify({ error: 'Invalid conversation history' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, bio, avatar_url, user_id, greeting_message, tone, response_length')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Track conversation
    let activeConversationId = body.conversationId;
    if (activeConversationId) {
      await supabase.from('conversations').update({
        messages_count: (conversationHistory?.length || 0) + 2,
        last_message_at: new Date().toISOString()
      }).eq('id', activeConversationId);
    } else {
      const visitorId = clientIP.replace(/\./g, '-');
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({ profile_id: profile.id, visitor_id: visitorId, messages_count: 1 })
        .select('id').single();
      if (newConversation) {
        activeConversationId = newConversation.id;
        console.log('New conversation created:', newConversation.id);
      }
    }

    // Save user message
    if (activeConversationId) {
      await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
      });
    }

    const { data: contexts, error: contextError } = await supabase
      .from('ai_context')
      .select('category, title, content')
      .eq('user_id', profile.user_id)
      .order('category', { ascending: true });

    if (contextError) console.error('Error fetching context:', contextError);

    const expertiseAreas = contexts?.filter(c => c.category === 'expertise_areas') || [];
    const expertiseBoundaries = contexts?.filter(c => c.category === 'expertise_boundaries') || [];
    const otherContexts = contexts?.filter(c =>
      c.category !== 'expertise_areas' && c.category !== 'expertise_boundaries'
    ) || [];

    let expertiseSection = '';
    if (expertiseAreas.length > 0) {
      expertiseSection = `\n=== YOUR AREAS OF EXPERTISE ===\nThese are topics where you should respond CONFIDENTLY and IN-DEPTH:\n${expertiseAreas.map(e => `• ${e.title}: ${e.content}`).join('\n')}\n\nWhen asked about these topics, provide detailed, knowledgeable responses with examples and insights.\n`;
    }

    let boundariesSection = '';
    if (expertiseBoundaries.length > 0) {
      const expertiseList = expertiseAreas.map(e => e.title).join(', ') || 'my specialized areas';
      boundariesSection = `\n=== KNOWLEDGE BOUNDARIES ===\nFor these topics, you should POLITELY DEFER:\n${expertiseBoundaries.map(b => `• ${b.title}: ${b.content}`).join('\n')}\n\nWhen asked about boundary topics, respond like:\n"That's outside my area of expertise. I specialize in ${expertiseList}."\n\nIMPORTANT: Do NOT try to give advice on boundary topics.\n`;
    }

    const contextParts: string[] = [];
    if (profile.display_name) contextParts.push(`Name: ${profile.display_name}`);
    if (profile.bio) contextParts.push(`Bio: ${profile.bio}`);
    if (otherContexts.length > 0) {
      const groupedContext: Record<string, string[]> = {};
      otherContexts.forEach(ctx => {
        if (!groupedContext[ctx.category]) groupedContext[ctx.category] = [];
        groupedContext[ctx.category].push(`${ctx.title}: ${ctx.content}`);
      });
      Object.entries(groupedContext).forEach(([category, items]) => {
        contextParts.push(`\n${category.toUpperCase()}:\n${items.join('\n')}`);
      });
    }

    // Tone and length instructions
    const toneMap: Record<string, string> = {
      professional: 'Use a professional, polished tone. Be articulate and structured.',
      friendly: 'Use a warm, friendly tone. Be approachable and conversational.',
      casual: 'Use a relaxed, casual tone. Keep it chill and natural, like texting a friend.',
      witty: 'Use a witty, playful tone. Add humor and clever observations where appropriate.',
      academic: 'Use an academic, thoughtful tone. Be precise and reference concepts clearly.',
    };
    const lengthMap: Record<string, string> = {
      concise: 'Keep responses very brief — 1-2 sentences max. Be direct and punchy.',
      balanced: 'Keep responses a short paragraph. Give enough detail without being verbose.',
      detailed: 'Give thorough, detailed responses with examples and depth.',
    };

    const toneInstruction = toneMap[profile.tone || 'friendly'] || toneMap.friendly;
    const lengthInstruction = lengthMap[profile.response_length || 'balanced'] || lengthMap.balanced;

    const systemPrompt = `You are an AI twin of ${profile.display_name || 'a person'}. You represent them in conversations, answering questions as they would, using their knowledge, personality, and communication style.
${expertiseSection}${boundariesSection}
=== PERSONAL CONTEXT ===
${contextParts.join('\n')}

=== COMMUNICATION STYLE ===
${toneInstruction}
${lengthInstruction}

=== RESPONSE GUIDELINES ===
1. FOR EXPERTISE TOPICS: Answer confidently with depth, examples, and insights.
2. FOR BOUNDARY TOPICS: Politely acknowledge this is outside your specialty. Redirect to your expertise areas.
3. FOR GENERAL TOPICS: Provide helpful general information while noting it's not your specialty.
4. ALWAYS respond as if you ARE this person, using first person ("I", "my", "me")
5. Match the communication style described above consistently
6. Be engaging while staying true to their character
7. If asked about something not in your context, politely say you're not sure
8. Keep responses conversational and natural
9. Don't mention that you're an AI unless directly asked`;

    const sanitizedHistory = (conversationHistory || []).map((h: {role: string; content: string}) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content.substring(0, 2000)
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedHistory,
      { role: 'user', content: message }
    ];

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    console.log('Calling Lovable AI Gateway for profile:', profile.display_name);
    console.log('Expertise areas:', expertiseAreas.length, 'Boundaries:', expertiseBoundaries.length);

    // Streaming mode
    if (wantStream) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway stream error:', response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      // Pipe the SSE stream through to the client
      const reader = response.body!.getReader();
      const encoder = new TextEncoder();

      let fullStreamedContent = '';
      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                // Save assistant response after stream completes
                if (activeConversationId && fullStreamedContent) {
                  supabase.from('messages').insert({
                    conversation_id: activeConversationId,
                    role: 'assistant',
                    content: fullStreamedContent,
                  }).then(() => console.log('Streamed response saved'));
                }
                break;
              }
              // Collect content for saving
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) fullStreamedContent += delta;
                  } catch {}
                }
              }
              controller.enqueue(value);
            }
          } catch (e) {
            console.error('Stream error:', e);
            controller.close();
          }
        }
      });

      console.log('AI streaming response started');

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
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

    // Save assistant response
    if (activeConversationId) {
      await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: aiResponse,
      });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        conversationId: activeConversationId,
        profile: { display_name: profile.display_name, bio: profile.bio, avatar_url: profile.avatar_url }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-twin function:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
