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
