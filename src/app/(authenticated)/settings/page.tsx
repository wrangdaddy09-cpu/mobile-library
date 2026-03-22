"use client";

import { useState, useRef, useEffect } from "react";
import { useSchools } from "@/lib/hooks/use-schools";
import { useSettings } from "@/lib/hooks/use-settings";
import { useBooks } from "@/lib/hooks/use-books";
import { parseBooksCsv, parseBooksXlsx } from "@/lib/csv";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  requested_at: string;
}

export default function SettingsPage() {
  const { schools, addSchool, updateSchool, archiveSchool } = useSchools();
  const { settings, updateSettings } = useSettings();
  const { books, addBook, fetchBooks } = useBooks();
  const supabase = createClient();

  // Pending approvals
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  async function fetchPendingApprovals() {
    const { data } = await supabase
      .from("user_approvals")
      .select("id, user_id, email, requested_at")
      .eq("approved", false)
      .order("requested_at", { ascending: true });
    setPendingUsers((data as PendingUser[]) ?? []);
  }

  async function handleApprove(approvalId: string) {
    setApprovingId(approvalId);
    await supabase
      .from("user_approvals")
      .update({ approved: true, approved_at: new Date().toISOString() } as any)
      .eq("id", approvalId);
    await fetchPendingApprovals();
    setApprovingId(null);
  }

  async function handleReject(approvalId: string) {
    setApprovingId(approvalId);
    await supabase.from("user_approvals").delete().eq("id", approvalId);
    await fetchPendingApprovals();
    setApprovingId(null);
  }

  // Schools
  const [newSchool, setNewSchool] = useState("");
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [archiveId, setArchiveId] = useState<string | null>(null);

  // CSV import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  // Settings
  const [email, setEmail] = useState(settings?.reminder_email ?? "");
  const [loanDays, setLoanDays] = useState(String(settings?.loan_duration_days ?? 28));
  const [saving, setSaving] = useState(false);

  // AI Enrichment
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<{ done: number; total: number; errors: number; firstError?: string } | null>(null);

  // Staff invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState("");

  async function handleAddSchool(e: React.FormEvent) {
    e.preventDefault();
    if (!newSchool.trim()) return;
    await addSchool(newSchool.trim());
    setNewSchool("");
  }

  async function handleSaveSchoolEdit() {
    if (editingSchoolId && editSchoolName.trim()) {
      await updateSchool(editingSchoolId, editSchoolName.trim());
      setEditingSchoolId(null);
    }
  }

  async function handleArchiveSchool() {
    if (archiveId) {
      await archiveSchool(archiveId);
      setArchiveId(null);
    }
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    let parsedBooks;
    let errors: string[];

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const result = parseBooksXlsx(buffer);
      parsedBooks = result.books;
      errors = result.errors;
    } else {
      const text = await file.text();
      const result = parseBooksCsv(text);
      parsedBooks = result.books;
      errors = result.errors;
    }

    let added = 0;
    let skipped = 0;

    for (const pb of parsedBooks) {
      const exists = books.some(
        (b) => b.title.toLowerCase() === pb.title.toLowerCase() && b.author.toLowerCase() === pb.author.toLowerCase()
      );
      if (exists) {
        skipped++;
        continue;
      }
      const { error } = await addBook(pb);
      if (!error) added++;
      else errors.push(`Failed to add "${pb.title}": ${error.message}`);
    }

    setImportResult({ added, skipped, errors });
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleEnrichAll() {
    const unenriched = books.filter((b) => !b.ai_enriched);
    if (unenriched.length === 0) {
      setEnrichProgress({ done: 0, total: 0, errors: 0 });
      return;
    }
    setEnriching(true);
    setEnrichProgress({ done: 0, total: unenriched.length, errors: 0 });

    let done = 0;
    let errors = 0;

    let firstError: string | undefined;

    for (const book of unenriched) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enrich-book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ book_id: book.id }),
        });
        if (!res.ok) {
          errors++;
          if (!firstError) {
            const body = await res.text();
            firstError = `${res.status}: ${body}`;
          }
        }
      } catch (err) {
        errors++;
        if (!firstError) firstError = String(err);
      }
      done++;
      setEnrichProgress({ done, total: unenriched.length, errors, firstError });
    }

    setEnriching(false);
    // Refresh books to pick up enriched data
    fetchBooks();
  }

  async function handleSaveSettings() {
    setSaving(true);
    await updateSettings({
      reminder_email: email.trim(),
      loan_duration_days: parseInt(loanDays) || 28,
    });
    setSaving(false);
  }

  async function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteResult("");
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim());
      if (error) {
        setInviteResult(`Error: ${error.message}`);
      } else {
        setInviteResult(`Invitation sent to ${inviteEmail.trim()}`);
        setInviteEmail("");
      }
    } catch {
      setInviteResult("Error: Admin API not available. Invite users from the Supabase Dashboard.");
    }
    setInviting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium">{u.email}</p>
                  <p className="text-xs text-slate-500">
                    Requested{" "}
                    {new Date(u.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={approvingId === u.id}
                    className="text-xs bg-emerald-600 text-white rounded px-2 py-1 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(u.id)}
                    disabled={approvingId === u.id}
                    className="text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schools */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Schools</h2>
        <form onSubmit={handleAddSchool} className="flex gap-2">
          <input
            value={newSchool}
            onChange={(e) => setNewSchool(e.target.value)}
            placeholder="Add school name"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700">Add</button>
        </form>
        <div className="space-y-1">
          {schools.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2">
              {editingSchoolId === s.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    value={editSchoolName}
                    onChange={(e) => setEditSchoolName(e.target.value)}
                    className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                  <button onClick={handleSaveSchoolEdit} className="text-xs text-blue-400">Save</button>
                  <button onClick={() => setEditingSchoolId(null)} className="text-xs text-slate-500">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="text-sm">{s.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingSchoolId(s.id); setEditSchoolName(s.name); }} className="text-xs text-slate-400 hover:text-slate-200">Edit</button>
                    <button onClick={() => setArchiveId(s.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {schools.length === 0 && <p className="text-slate-500 text-sm">No schools added yet.</p>}
        </div>
      </section>

      {/* CSV Import */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import Books</h2>
        <p className="text-slate-500 text-sm">Upload a CSV or Excel (.xlsx) file with columns: title, author, copies (copies is optional, defaults to 1)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleCsvImport}
          disabled={importing}
          className="text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:cursor-pointer hover:file:bg-blue-700"
        />
        {importing && <p className="text-slate-400 text-sm">Importing...</p>}
        {importResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm space-y-1">
            <p className="text-emerald-400">{importResult.added} books added</p>
            {importResult.skipped > 0 && <p className="text-amber-400">{importResult.skipped} duplicates skipped</p>}
            {importResult.errors.map((err, i) => <p key={i} className="text-red-400">{err}</p>)}
          </div>
        )}
      </section>

      {/* AI Enrichment */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AI Book Enrichment</h2>
        <p className="text-slate-500 text-sm">
          Use AI to add genres, themes, descriptions, and publisher info to books that haven&apos;t been enriched yet.
          ({books.filter((b) => !b.ai_enriched).length} of {books.length} books need enrichment)
        </p>
        <button
          onClick={handleEnrichAll}
          disabled={enriching || books.filter((b) => !b.ai_enriched).length === 0}
          className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 disabled:opacity-50"
        >
          {enriching ? "Enriching..." : "Enrich All Books"}
        </button>
        {enrichProgress && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm space-y-2">
            {enrichProgress.total === 0 ? (
              <p className="text-emerald-400">All books are already enriched!</p>
            ) : (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>Progress: {enrichProgress.done} / {enrichProgress.total}</span>
                  {enrichProgress.errors > 0 && <span className="text-red-400">{enrichProgress.errors} errors</span>}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${(enrichProgress.done / enrichProgress.total) * 100}%` }}
                  />
                </div>
                {enrichProgress.firstError && (
                  <p className="text-red-400 break-all">Error: {enrichProgress.firstError}</p>
                )}
                {enrichProgress.done === enrichProgress.total && (
                  <p className="text-emerald-400">
                    Done! {enrichProgress.done - enrichProgress.errors} books enriched successfully.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Reminder & Loan Settings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notifications & Loan</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Reminder email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Loan duration (days)</label>
          <input
            value={loanDays}
            onChange={(e) => setLoanDays(e.target.value)}
            type="number"
            min="1"
            className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </section>

      {/* Staff Management */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Staff</h2>
        <form onSubmit={handleInviteStaff} className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            type="email"
            placeholder="Invite staff by email"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" disabled={inviting} className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50">
            {inviting ? "..." : "Invite"}
          </button>
        </form>
        {inviteResult && <p className={`text-sm ${inviteResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>{inviteResult}</p>}
      </section>

      {/* Sign Out */}
      <section>
        <button onClick={handleSignOut} className="text-red-400 text-sm hover:text-red-300">
          Sign Out
        </button>
      </section>

      <ConfirmDialog
        open={!!archiveId}
        title="Remove School"
        message="This school will be archived. Existing checkout records will be preserved."
        confirmLabel="Remove"
        onConfirm={handleArchiveSchool}
        onCancel={() => setArchiveId(null)}
      />
    </div>
  );
}
