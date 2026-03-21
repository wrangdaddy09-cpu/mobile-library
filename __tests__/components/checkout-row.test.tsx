import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutRow } from "@/components/checkout-row";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("CheckoutRow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-21"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows OVERDUE badge when past due date", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-03-19T00:00:00Z" returnedAt={null} />
    );
    expect(screen.getByText("OVERDUE")).toBeDefined();
  });

  it("shows DUE IN Xd badge when within 3 days", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-03-23T00:00:00Z" returnedAt={null} />
    );
    expect(screen.getByText("DUE IN 2d")).toBeDefined();
  });

  it("shows Returned when returned_at is set", () => {
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-04-01T00:00:00Z" returnedAt="2026-03-20T00:00:00Z" />
    );
    expect(screen.getByText("Returned")).toBeDefined();
  });

  it("shows Return button for active checkouts", () => {
    const onReturn = vi.fn();
    render(
      <CheckoutRow bookTitle="1984" borrowerName="Sarah" borrowerInitial="L"
        schoolName="Greenwood" dueAt="2026-04-18T00:00:00Z" returnedAt={null} onReturn={onReturn} />
    );
    expect(screen.getByText("Return")).toBeDefined();
  });
});
