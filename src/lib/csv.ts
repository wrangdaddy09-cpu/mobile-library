import * as XLSX from "xlsx";
import type { Book } from "@/lib/supabase/types";
import type { CheckoutWithDetails } from "@/lib/hooks/use-checkouts";

type ParsedBook = {
  title: string;
  author: string;
  total_copies: number;
  publisher?: string;
};

type ParseResult = {
  books: ParsedBook[];
  errors: string[];
};

// Map common column name variations to our field names
function matchColumn(header: string): "title" | "author" | "copies" | "publisher" | null {
  const h = header.toLowerCase().trim();
  if (h === "title") return "title";
  if (h === "author") return "author";
  if (h === "copies" || h === "number books" || h === "number_books" || h === "num books" || h === "quantity" || h === "qty" || h === "total_copies") return "copies";
  if (h === "publisher") return "publisher";
  return null;
}

export function parseBooksCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const books: ParsedBook[] = [];
  const errors: string[] = [];

  if (lines.length === 0) return { books, errors: ["CSV file is empty"] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const columnMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const field = matchColumn(h);
    if (field) columnMap[field] = i;
  });

  if (columnMap.title === undefined || columnMap.author === undefined) {
    return { books, errors: ["CSV must have 'title' and 'author' columns"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const title = values[columnMap.title] || "";
    const author = values[columnMap.author] || "";
    const copies = columnMap.copies !== undefined ? parseInt(values[columnMap.copies], 10) : 1;
    const publisher = columnMap.publisher !== undefined ? values[columnMap.publisher] || undefined : undefined;

    if (!title) {
      errors.push(`Row ${i + 1}: missing title`);
      continue;
    }
    if (!author) {
      errors.push(`Row ${i + 1}: missing author`);
      continue;
    }

    const book: ParsedBook = {
      title,
      author,
      total_copies: isNaN(copies) || copies < 1 ? 1 : copies,
    };
    if (publisher) book.publisher = publisher;
    books.push(book);
  }

  return { books, errors };
}

export function parseBooksXlsx(buffer: ArrayBuffer): ParseResult {
  const books: ParsedBook[] = [];
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { books, errors: ["Excel file has no sheets"] };

    // Read as raw rows (array of arrays) so we can find the real header row
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1 });
    if (rawRows.length === 0) return { books, errors: ["Excel sheet is empty"] };

    // Find the header row — the first row where we can match both "title" and "author"
    let headerRowIdx = -1;
    let columnMap: Record<string, number> = {};

    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const row = rawRows[i] as unknown[];
      if (!row) continue;
      const tempMap: Record<string, number> = {};
      row.forEach((cell, colIdx) => {
        if (cell == null) return;
        const field = matchColumn(String(cell));
        if (field) tempMap[field] = colIdx;
      });
      if (tempMap.title !== undefined && tempMap.author !== undefined) {
        headerRowIdx = i;
        columnMap = tempMap;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return { books, errors: ["Could not find 'title' and 'author' columns in the first 10 rows"] };
    }

    // Process data rows after the header
    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i] as unknown[];
      if (!row) continue;

      const title = String(row[columnMap.title] ?? "").trim();
      const author = String(row[columnMap.author] ?? "").trim();
      const copies = columnMap.copies !== undefined ? parseInt(String(row[columnMap.copies] ?? ""), 10) : 1;
      const publisher = columnMap.publisher !== undefined ? String(row[columnMap.publisher] ?? "").trim() || undefined : undefined;

      if (!title && !author) continue; // skip fully empty rows
      if (!title) {
        errors.push(`Row ${i + 1}: missing title`);
        continue;
      }
      if (!author) {
        errors.push(`Row ${i + 1}: missing author`);
        continue;
      }

      const book: ParsedBook = {
        title,
        author,
        total_copies: isNaN(copies) || copies < 1 ? 1 : copies,
      };
      if (publisher) book.publisher = publisher;
      books.push(book);
    }
  } catch {
    errors.push("Failed to read Excel file. Make sure it's a valid .xlsx file.");
  }

  return { books, errors };
}

export function exportLibraryToExcel(books: Book[], checkouts: CheckoutWithDetails[]) {
  const bookRows = books.map((b) => ({
    Title: b.title,
    Author: b.author,
    Copies: b.total_copies,
    Publisher: b.publisher || "",
    "Year Published": b.year_published || "",
    Genres: (b.genres || []).join(", "),
    Themes: (b.themes || []).join(", "),
    Description: b.description || "",
  }));

  const checkoutRows = checkouts.map((c) => ({
    "Book Title": c.books?.title || "Unknown",
    "Book Author": c.books?.author || "Unknown",
    "Borrower First Name": c.borrower_first_name,
    "Borrower Initial": c.borrower_surname_initial,
    School: c.schools?.name || "Unknown",
    "Checked Out": c.checked_out_at ? new Date(c.checked_out_at).toLocaleDateString() : "",
    "Due Date": c.due_at ? new Date(c.due_at).toLocaleDateString() : "",
    "Returned": c.returned_at ? new Date(c.returned_at).toLocaleDateString() : "",
  }));

  const wb = XLSX.utils.book_new();
  const booksSheet = XLSX.utils.json_to_sheet(bookRows);
  const checkoutsSheet = XLSX.utils.json_to_sheet(checkoutRows);
  XLSX.utils.book_append_sheet(wb, booksSheet, "Books");
  XLSX.utils.book_append_sheet(wb, checkoutsSheet, "Checkouts");
  XLSX.writeFile(wb, `mobile-library-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
