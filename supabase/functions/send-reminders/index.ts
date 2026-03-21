import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get reminder email from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("reminder_email")
      .single();

    if (!settings?.reminder_email || settings.reminder_email === "changeme@example.com") {
      return new Response(JSON.stringify({ message: "No reminder email configured" }), { status: 200 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find due-soon checkouts (within 3 days, not yet reminded)
    const { data: dueSoon } = await supabase
      .from("checkouts")
      .select("id, due_at, borrower_first_name, borrower_surname_initial, books(title), schools(name)")
      .is("returned_at", null)
      .eq("reminder_sent", false)
      .lte("due_at", threeDaysFromNow.toISOString())
      .gt("due_at", now.toISOString());

    // Find overdue checkouts (not yet alerted)
    const { data: overdue } = await supabase
      .from("checkouts")
      .select("id, due_at, borrower_first_name, borrower_surname_initial, books(title), schools(name)")
      .is("returned_at", null)
      .eq("overdue_alert_sent", false)
      .lt("due_at", now.toISOString());

    const emailParts: string[] = [];

    if (overdue && overdue.length > 0) {
      emailParts.push("<h2>Overdue Books</h2><ul>");
      for (const c of overdue) {
        const bookTitle = (c as any).books?.title ?? "Unknown";
        const school = (c as any).schools?.name ?? "Unknown";
        const dueDate = new Date(c.due_at).toLocaleDateString();
        emailParts.push(
          `<li><strong>${bookTitle}</strong> — ${c.borrower_first_name} ${c.borrower_surname_initial}. (${school}) — was due ${dueDate}</li>`
        );
      }
      emailParts.push("</ul>");

      // Mark as alerted
      const ids = overdue.map((c) => c.id);
      await supabase.from("checkouts").update({ overdue_alert_sent: true }).in("id", ids);
    }

    if (dueSoon && dueSoon.length > 0) {
      emailParts.push("<h2>Due Soon</h2><ul>");
      for (const c of dueSoon) {
        const bookTitle = (c as any).books?.title ?? "Unknown";
        const school = (c as any).schools?.name ?? "Unknown";
        const dueDate = new Date(c.due_at).toLocaleDateString();
        emailParts.push(
          `<li><strong>${bookTitle}</strong> — ${c.borrower_first_name} ${c.borrower_surname_initial}. (${school}) — due ${dueDate}</li>`
        );
      }
      emailParts.push("</ul>");

      // Mark as reminded
      const ids = dueSoon.map((c) => c.id);
      await supabase.from("checkouts").update({ reminder_sent: true }).in("id", ids);
    }

    if (emailParts.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send" }), { status: 200 });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mobile Library <noreply@resend.dev>",
        to: settings.reminder_email,
        subject: `Library Reminder: ${(overdue?.length ?? 0)} overdue, ${(dueSoon?.length ?? 0)} due soon`,
        html: emailParts.join(""),
      }),
    });

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        message: "Reminders sent",
        overdue: overdue?.length ?? 0,
        dueSoon: dueSoon?.length ?? 0,
        emailResult,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
