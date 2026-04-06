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
    const { slug } = await req.json();

    if (!slug || typeof slug !== 'string' || slug.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, greeting_message')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ contexts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get AI context (only category and title for suggested questions, not full content)
    const { data: contexts, error: contextError } = await supabase
      .from('ai_context')
      .select('category, title, content')
      .eq('user_id', profile.user_id)
      .order('category', { ascending: true });

    if (contextError) {
      console.error('Error fetching context:', contextError);
      return new Response(
        JSON.stringify({ contexts: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ contexts: contexts || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-profile-context:', error);
    return new Response(
      JSON.stringify({ contexts: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
