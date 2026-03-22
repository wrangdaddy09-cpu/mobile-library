import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { book_id } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "book_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("title, author")
      .eq("id", book_id)
      .single();

    if (fetchError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `I need metadata for a book from an Australian school mobile library.

Title: "${book.title}"
Author: ${book.author} (note: author may be in "Surname, FirstName" format)

This is likely an Australian children's/young adult book. Many are from small Australian publishers like Fremantle Press, Allen & Unwin, Scholastic Australia, Penguin Australia, etc.

Provide the following as JSON. If you're not sure about a field, use null instead of "Unknown". For description, write a brief 1-2 sentence summary of what the book is about - if you don't know the specific book, write a plausible description based on the title and any context clues. Never say "no information available".

{
  "publisher": "publisher name or null",
  "year_published": 2020,
  "genres": ["genre1", "genre2"],
  "themes": ["theme1", "theme2"],
  "description": "A 1-2 sentence description"
}

Respond ONLY with valid JSON, no other text, no markdown.`,
          },
        ],
      }),
    });

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text;

    if (!content) {
      return new Response(JSON.stringify({ error: "No AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const metadata = JSON.parse(cleaned);

    const cleanStr = (v: unknown) => {
      if (!v || typeof v !== "string") return null;
      const s = v.trim();
      if (!s || s.toLowerCase() === "unknown" || s.toLowerCase().includes("no information available") || s.toLowerCase().includes("no reliable information")) return null;
      return s;
    };

    const { error: updateError } = await supabase
      .from("books")
      .update({
        publisher: cleanStr(metadata.publisher),
        year_published: metadata.year_published || null,
        genres: metadata.genres || [],
        themes: metadata.themes || [],
        description: cleanStr(metadata.description),
        ai_enriched: true,
      })
      .eq("id", book_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, metadata }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
