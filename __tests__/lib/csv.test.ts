import { describe, it, expect } from "vitest";
import { parseBooksCsv } from "@/lib/csv";

describe("parseBooksCsv", () => {
  it("parses valid CSV with all columns", () => {
    const csv = "title,author,copies\nThe Great Gatsby,F. Scott Fitzgerald,1\n1984,George Orwell,2";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(2);
    expect(result.books[0]).toEqual({ title: "The Great Gatsby", author: "F. Scott Fitzgerald", total_copies: 1 });
    expect(result.books[1]).toEqual({ title: "1984", author: "George Orwell", total_copies: 2 });
    expect(result.errors).toHaveLength(0);
  });

  it("defaults copies to 1 when missing", () => {
    const csv = "title,author\nThe Great Gatsby,F. Scott Fitzgerald";
    const result = parseBooksCsv(csv);
    expect(result.books[0].total_copies).toBe(1);
  });

  it("reports errors for rows missing title", () => {
    const csv = "title,author,copies\n,F. Scott Fitzgerald,1";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Row 2");
  });

  it("trims whitespace from values", () => {
    const csv = "title,author,copies\n  The Great Gatsby  , F. Scott Fitzgerald ,1";
    const result = parseBooksCsv(csv);
    expect(result.books[0].title).toBe("The Great Gatsby");
    expect(result.books[0].author).toBe("F. Scott Fitzgerald");
  });

  it("skips empty rows", () => {
    const csv = "title,author,copies\nThe Great Gatsby,F. Scott Fitzgerald,1\n\n1984,George Orwell,2";
    const result = parseBooksCsv(csv);
    expect(result.books).toHaveLength(2);
  });
});
