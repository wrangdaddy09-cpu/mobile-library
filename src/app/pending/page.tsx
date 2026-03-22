"use client";

import { createClient } from "@/lib/supabase/client";

export default function PendingApprovalPage() {
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">&#8987;</div>
        <h1 className="text-xl font-bold">Pending Approval</h1>
        <p className="text-slate-400">
          Your account has been created. The library administrator has been
          notified and will approve your access shortly.
        </p>
        <p className="text-slate-500 text-sm">Please check back later.</p>
        <button
          onClick={handleSignOut}
          className="text-red-400 text-sm hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
