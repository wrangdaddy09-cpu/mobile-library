"use server";

export async function enrichAllBooks(): Promise<{
  enriched: number;
  errors: number;
  total: number;
  errorMsg?: string;
}> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-all`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { enriched: 0, errors: 0, total: 0, errorMsg: data.error || "Unknown error" };
    }
    return data;
  } catch (err) {
    return { enriched: 0, errors: 0, total: 0, errorMsg: String(err) };
  }
}
