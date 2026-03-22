import * as XLSX from "xlsx";

type ParsedBook = {
  title: string;
  author: string;
  total_copies: number;
};

type ParseResult = {
  books: ParsedBook[];
  errors: string[];
};

export function parseBooksCsv(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const books: ParsedBook[] = [];
  const errors: string[] = [];

  if (lines.length === 0) return { books, errors: ["CSV file is empty"] };

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const titleIdx = header.indexOf("title");
  const authorIdx = header.indexOf("author");
  const copiesIdx = header.indexOf("copies");

  if (titleIdx === -1 || authorIdx === -1) {
    return { books, errors: ["CSV must have 'title' and 'author' columns"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const title = values[titleIdx] || "";
    const author = values[authorIdx] || "";
    const copies = copiesIdx !== -1 ? parseInt(values[copiesIdx], 10) : 1;

    if (!title) {
      errors.push(`Row ${i + 1}: missing title`);
      continue;
    }
    if (!author) {
      errors.push(`Row ${i + 1}: missing author`);
      continue;
    }

    books.push({
      title,
      author,
      total_copies: isNaN(copies) || copies < 1 ? 1 : copies,
    });
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

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
    if (rows.length === 0) return { books, errors: ["Excel sheet is empty"] };

    // Find column names (case-insensitive)
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    const titleKey = keys.find((k) => k.toLowerCase() === "title");
    const authorKey = keys.find((k) => k.toLowerCase() === "author");
    const copiesKey = keys.find((k) => k.toLowerCase() === "copies");

    if (!titleKey || !authorKey) {
      return { books, errors: ["Excel sheet must have 'title' and 'author' columns"] };
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = String(row[titleKey] ?? "").trim();
      const author = String(row[authorKey] ?? "").trim();
      const copies = copiesKey ? parseInt(String(row[copiesKey]), 10) : 1;

      if (!title) {
        errors.push(`Row ${i + 2}: missing title`);
        continue;
      }
      if (!author) {
        errors.push(`Row ${i + 2}: missing author`);
        continue;
      }

      books.push({
        title,
        author,
        total_copies: isNaN(copies) || copies < 1 ? 1 : copies,
      });
    }
  } catch {
    errors.push("Failed to read Excel file. Make sure it's a valid .xlsx file.");
  }

  return { books, errors };
}
