"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppSettings } from "@/lib/supabase/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .single();
    if (!error && data) setSettings(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function updateSettings(updates: Partial<AppSettings>) {
    if (!settings) return { error: new Error("No settings loaded") };
    const { data, error } = await supabase
      .from("app_settings")
      .update(updates)
      .eq("id", settings.id)
      .select()
      .single();
    if (!error && data) setSettings(data);
    return { data, error };
  }

  return { settings, loading, fetchSettings, updateSettings };
}
