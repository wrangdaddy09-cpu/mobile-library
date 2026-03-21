import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  try {
    const { book_id } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "book_id required" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: book, error: fetchError } = await supabase
      .from("books")
      .select("title, author")
      .eq("id", book_id)
      .single();

    if (fetchError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), { status: 404 });
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
            content: `For the book "${book.title}" by ${book.author}, provide the following information as JSON:
{
  "publisher": "original publisher name",
  "year_published": 1234,
  "genres": ["genre1", "genre2"],
  "themes": ["theme1", "theme2", "theme3"],
  "description": "A 1-2 sentence description of the book"
}

Respond ONLY with valid JSON, no other text.`,
          },
        ],
      }),
    });

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text;

    if (!content) {
      return new Response(JSON.stringify({ error: "No AI response" }), { status: 500 });
    }

    const metadata = JSON.parse(content);

    const { error: updateError } = await supabase
      .from("books")
      .update({
        publisher: metadata.publisher || null,
        year_published: metadata.year_published || null,
        genres: metadata.genres || [],
        themes: metadata.themes || [],
        description: metadata.description || null,
        ai_enriched: true,
      })
      .eq("id", book_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, metadata }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
