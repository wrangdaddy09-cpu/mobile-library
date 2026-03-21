import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("BottomNav", () => {
  it("renders all four navigation tabs", () => {
    render(<BottomNav />);
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Catalogue")).toBeDefined();
    expect(screen.getByText("Checkouts")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });
});
