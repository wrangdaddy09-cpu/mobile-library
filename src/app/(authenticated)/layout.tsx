import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

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

  return (
    <div className="pb-16">
      <main className="max-w-lg mx-auto px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
