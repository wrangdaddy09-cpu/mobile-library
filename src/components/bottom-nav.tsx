"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/catalogue", label: "Catalogue", icon: "book" },
  { href: "/checkouts", label: "Checkouts", icon: "clipboard" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

const icons: Record<string, (active: boolean) => React.ReactNode> = {
  home: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
  ),
  book: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  clipboard: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  settings: (active) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${active ? "text-blue-400" : "text-slate-500"}`}>
      <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 safe-area-bottom z-50">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              {icons[tab.icon](active)}
              <span className={`text-xs ${active ? "text-blue-400 font-medium" : "text-slate-500"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
