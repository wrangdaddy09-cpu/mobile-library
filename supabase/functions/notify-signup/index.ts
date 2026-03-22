import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin email from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("reminder_email")
      .single();

    if (!settings?.reminder_email || settings.reminder_email === "changeme@example.com") {
      return new Response(JSON.stringify({ message: "No admin email configured" }), { status: 200 });
    }

    // Send notification email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mobile Library <noreply@resend.dev>",
        to: settings.reminder_email,
        subject: `New signup request: ${email}`,
        html: `<p>A new user (<strong>${email}</strong>) has signed up for the Mobile Library app and is waiting for your approval.</p><p>Open the app and go to <strong>Settings</strong> to approve or reject them.</p>`,
      }),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
