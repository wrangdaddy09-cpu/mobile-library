"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { School } from "@/lib/supabase/types";

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("archived", false)
      .order("name");
    if (!error && data) setSchools(data as School[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  async function addSchool(name: string) {
    const { data, error } = await supabase
      .from("schools")
      .insert({ name } as any)
      .select()
      .single();
    if (!error && data) {
      const newSchool = data as School;
      setSchools((prev) => [...prev, newSchool].sort((a, b) => a.name.localeCompare(b.name)));
    }
    return { data, error };
  }

  async function updateSchool(id: string, name: string) {
    const { data, error } = await supabase
      .from("schools")
      .update({ name } as any)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setSchools((prev) => prev.map((s) => (s.id === id ? (data as School) : s)));
    }
    return { data, error };
  }

  async function archiveSchool(id: string) {
    const { error } = await supabase
      .from("schools")
      .update({ archived: true } as any)
      .eq("id", id);
    if (!error) {
      setSchools((prev) => prev.filter((s) => s.id !== id));
    }
    return { error };
  }

  return { schools, loading, fetchSchools, addSchool, updateSchool, archiveSchool };
}
