/** Parse a single CSV line respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if (char === "\n" && !inQuotes) {
      if (current.trim()) rows.push(parseCsvLine(current));
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) rows.push(parseCsvLine(current));
  return rows;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvField(cell ?? "")).join(",")),
  ];
  return lines.join("\r\n");
}

const HEADER_ALIASES: Record<string, keyof import("@/lib/validations/data-entry").DataEntryInput> = {
  name: "name",
  "business name": "businessName",
  business: "businessName",
  company: "businessName",
  "company name": "businessName",
  location: "location",
  city: "location",
  instagram: "instagram",
  ig: "instagram",
  website: "website",
  web: "website",
  url: "website",
  remark: "remark",
  remarks: "remark",
  notes: "remark",
};

export function mapCsvRowToDataEntry(
  headers: string[],
  values: string[]
): Partial<import("@/lib/validations/data-entry").DataEntryInput> {
  const entry: Partial<import("@/lib/validations/data-entry").DataEntryInput> = {};

  headers.forEach((header, index) => {
    const key = HEADER_ALIASES[header.trim().toLowerCase()];
    const value = values[index]?.trim();
    if (key && value) {
      entry[key] = value;
    }
  });

  return entry;
}
