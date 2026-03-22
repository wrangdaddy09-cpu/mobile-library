import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { AdminProvider } from "@/lib/admin-context";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if this user has an approval row
  const { data: approval } = await supabase
    .from("user_approvals")
    .select("approved")
    .eq("user_id", user.id)
    .single();

  // If an approval row exists and the user is not approved, redirect to pending
  if (approval && !approval.approved) {
    redirect("/pending");
  }

  // Admin = user with no approval row (original/pre-existing user)
  const isAdmin = !approval;

  return (
    <AdminProvider isAdmin={isAdmin}>
      <div className="pb-16">
        <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
        <BottomNav />
      </div>
    </AdminProvider>
  );
}
