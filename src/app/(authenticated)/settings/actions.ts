"use server";

export async function enrichOneBook(bookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()}/functions/v1/enrich-book`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()}`,
      },
      body: JSON.stringify({ book_id: bookId }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || "Unknown error" };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function enrichAllBooks(): Promise<{
  enriched: number;
  errors: number;
  total: number;
  errorMsg?: string;
}> {
  try {
    const url = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()}/functions/v1/enrich-all`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { enriched: 0, errors: 0, total: 0, errorMsg: data.error || "Unknown error" };
    }
    return data;
  } catch (err) {
    return { enriched: 0, errors: 0, total: 0, errorMsg: String(err) };
  }
}
