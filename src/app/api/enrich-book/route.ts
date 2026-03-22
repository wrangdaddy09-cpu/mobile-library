import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { book_id } = await req.json();
  if (!book_id) {
    return NextResponse.json({ error: "book_id required" }, { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-book`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ book_id }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
