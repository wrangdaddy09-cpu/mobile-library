import { describe, it, expect } from "vitest";
import { searchBooks } from "@/lib/search";
import type { Book } from "@/lib/supabase/types";

const mockBooks: Book[] = [
  {
    id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald",
    total_copies: 1, publisher: "Scribner", year_published: 1925,
    genres: ["Fiction", "Classic"], themes: ["American Dream", "Wealth"],
    description: "A story of decadence", ai_enriched: true,
    created_at: "", updated_at: "",
  },
  {
    id: "2", title: "1984", author: "George Orwell",
    total_copies: 2, publisher: "Secker & Warburg", year_published: 1949,
    genres: ["Dystopian", "Sci-Fi"], themes: ["Surveillance", "Freedom"],
    description: "A totalitarian future", ai_enriched: true,
    created_at: "", updated_at: "",
  },
];

describe("searchBooks", () => {
  it("returns all books for empty query", () => {
    expect(searchBooks(mockBooks, "")).toEqual(mockBooks);
  });

  it("matches by title", () => {
    const results = searchBooks(mockBooks, "gatsby");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("matches by author", () => {
    const results = searchBooks(mockBooks, "orwell");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("matches by genre", () => {
    const results = searchBooks(mockBooks, "sci-fi");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("matches by theme", () => {
    const results = searchBooks(mockBooks, "wealth");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("1");
  });

  it("is case-insensitive", () => {
    expect(searchBooks(mockBooks, "GATSBY")).toHaveLength(1);
  });
});
