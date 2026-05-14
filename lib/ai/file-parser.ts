import Papa from "papaparse";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf", "text/csv", "image/jpeg", "image/png", "image/webp"];

export type ParsedFile = {
  name: string;
  type: string;
  text: string; // extracted text context for the AI prompt
};

export async function parseUploadedFile(file: File): Promise<ParsedFile | null> {
  if (!ALLOWED_TYPES.includes(file.type)) return null;
  if (file.size > MAX_BYTES) return null;

  if (file.type === "text/csv") {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    const rows = result.data.slice(0, 100); // limit rows
    const preview = rows
      .map((row) =>
        Object.entries(row)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", "),
      )
      .join("\n");
    return { name: file.name, type: "CSV", text: `CSV Dosyası (${file.name}):\n${preview}` };
  }

  if (file.type === "application/pdf") {
    try {
      // Dynamic import to avoid SSR issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import("pdf-parse") as any).default ?? (await import("pdf-parse"));
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buffer);
      const truncated = data.text.slice(0, 4000); // limit context size
      return {
        name: file.name,
        type: "PDF",
        text: `PDF Dosyası (${file.name}):\n${truncated}`,
      };
    } catch {
      return null;
    }
  }

  // Images — just note them, no OCR for now
  if (file.type.startsWith("image/")) {
    return {
      name: file.name,
      type: "Görsel",
      text: `Görsel dosya eklendi: ${file.name} (${(file.size / 1024).toFixed(0)} KB). Görsel içeriği metin olarak analiz edilemiyor.`,
    };
  }

  return null;
}

export function buildFileContext(files: ParsedFile[]): string {
  if (files.length === 0) return "";
  return (
    "\n\nEK DOSYALAR:\n" + files.map((f) => `[${f.type}] ${f.text}`).join("\n\n---\n\n")
  );
}
