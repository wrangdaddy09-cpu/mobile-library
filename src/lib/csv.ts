import * as XLSX from "xlsx";

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

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
    if (rows.length === 0) return { books, errors: ["Excel sheet is empty"] };

    // Map column names from the spreadsheet to our fields
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    const columnMap: Record<string, string> = {};
    keys.forEach((k) => {
      const field = matchColumn(k);
      if (field) columnMap[field] = k;
    });

    if (!columnMap.title || !columnMap.author) {
      return { books, errors: ["Excel sheet must have 'title' and 'author' columns"] };
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = String(row[columnMap.title] ?? "").trim();
      const author = String(row[columnMap.author] ?? "").trim();
      const copies = columnMap.copies ? parseInt(String(row[columnMap.copies]), 10) : 1;
      const publisher = columnMap.publisher ? String(row[columnMap.publisher] ?? "").trim() || undefined : undefined;

      if (!title) {
        errors.push(`Row ${i + 2}: missing title`);
        continue;
      }
      if (!author) {
        errors.push(`Row ${i + 2}: missing author`);
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
