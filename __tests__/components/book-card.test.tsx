import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("does not render checkbox when selectMode is false", () => {
    render(<BookCard id="1" title="1984" author="George Orwell" available={2} total={2} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("renders checkbox when selectMode is true", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={false} onSelect={() => {}} />
    );
    expect(screen.getByRole("checkbox")).toBeDefined();
  });

  it("renders checked checkbox when selected", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={true} onSelect={() => {}} />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("calls onSelect when checkbox is clicked", () => {
    const onSelect = vi.fn();
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={2} total={2}
        selectMode selected={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("disables checkbox when selectDisabled is true", () => {
    render(
      <BookCard id="1" title="1984" author="George Orwell" available={0} total={2}
        selectMode selected={false} onSelect={() => {}} selectDisabled />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});
