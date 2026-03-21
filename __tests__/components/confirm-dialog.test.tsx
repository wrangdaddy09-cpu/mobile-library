import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title and message when open", () => {
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.getByRole("heading", { name: "Confirm" })).toBeDefined();
    expect(screen.getByText("Are you sure?")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog open={false} title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={() => {}} />
    );
    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={onConfirm} onCancel={() => {}} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="Confirm" message="Are you sure?" onConfirm={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
