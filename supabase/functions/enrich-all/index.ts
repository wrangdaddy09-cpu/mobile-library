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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all unenriched books
    const { data: books, error: fetchError } = await supabase
      .from("books")
      .select("id, title, author")
      .eq("ai_enriched", false);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!books || books.length === 0) {
      return new Response(JSON.stringify({ enriched: 0, errors: 0, total: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let enriched = 0;
    let errors = 0;

    for (const book of books) {
      try {
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
          errors++;
          continue;
        }

        // Strip markdown code fences if present
        const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        const metadata = JSON.parse(cleaned);

        const cleanStr = (v: unknown) => {
          if (!v || typeof v !== "string") return null;
          const s = v.trim();
          if (!s || s.toLowerCase() === "unknown" || s.toLowerCase().includes("no information available") || s.toLowerCase().includes("no reliable information")) return null;
          return s;
        };

        await supabase
          .from("books")
          .update({
            publisher: cleanStr(metadata.publisher),
            year_published: metadata.year_published || null,
            genres: metadata.genres || [],
            themes: metadata.themes || [],
            description: cleanStr(metadata.description),
            ai_enriched: true,
          })
          .eq("id", book.id);

        enriched++;
      } catch {
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ enriched, errors, total: books.length }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
