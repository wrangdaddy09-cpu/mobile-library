import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookCard } from "@/components/book-card";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("BookCard", () => {
  it("renders title and author", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={2} total={2} />);
    expect(screen.getByText("1984")).toBeDefined();
    expect(screen.getByText("George Orwell")).toBeDefined();
  });

  it("shows availability badge", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={1} total={2} />);
    expect(screen.getByText("1/2")).toBeDefined();
  });

  it("links to book detail page", () => {
    render(<BookCard id="abc-123" title="1984" author="George Orwell" available={2} total={2} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/catalogue/abc-123");
  });
});
