/**
 * Dependency-free PDF writer.
 *
 * The Worker runtime cannot run headless browsers or native PDF toolchains, so
 * documents are assembled here as raw PDF syntax using the standard Type1 base
 * fonts (Helvetica). Only the primitives our documents need are supported:
 * text with wrapping, horizontal rules, filled rectangles and automatic page
 * breaks. Everything is pure so it runs identically in the browser and on the
 * server, and can be asserted in tests.
 */

/** Advance widths (per 1000 units) for Helvetica, ASCII 32-126. */
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

/** Advance widths (per 1000 units) for Helvetica-Bold, ASCII 32-126. */
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

export type PdfFont = "regular" | "bold";

export interface PdfTextOptions {
  font?: PdfFont;
  size?: number;
  /** Grey/colour as an RGB triple in the 0-1 range. */
  color?: [number, number, number];
  /** Extra leading between wrapped lines, added to the font size. */
  leading?: number;
  /** Space reserved after the block. */
  spaceAfter?: number;
  /** Left indent from the content margin. */
  indent?: number;
  /** Width available for wrapping; defaults to the remaining content width. */
  width?: number;
}

type Op = string;

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Escapes a string for a PDF literal and drops unsupported code points. */
function pdfString(value: string): string {
  let out = "";
  for (const char of value.normalize("NFKD")) {
    const code = char.codePointAt(0)!;
    if (code === 10 || code === 13) {
      out += " ";
    } else if (code >= 32 && code <= 126) {
      out += char === "(" || char === ")" || char === "\\" ? `\\${char}` : char;
    } else if (code === 0x2013 || code === 0x2014) {
      out += "-";
    } else if (code === 0x2018 || code === 0x2019) {
      out += "'";
    } else if (code === 0x201c || code === 0x201d) {
      out += '"';
    } else if (code === 0x20ac) {
      out += "EUR ";
    } else if (code === 0xa0 || code === 0x2009 || code === 0x202f) {
      out += " ";
    }
  }
  return out;
}

/** Width of a string in points for one of the base fonts. */
export function pdfTextWidth(text: string, size: number, font: PdfFont = "regular"): number {
  const table = font === "bold" ? HELVETICA_BOLD : HELVETICA;
  let total = 0;
  for (const char of pdfString(text).replace(/\\([()\\])/g, "$1")) {
    const index = char.charCodeAt(0) - 32;
    total += table[index] ?? 556;
  }
  return (total * size) / 1000;
}

/** Greedy word wrap using real Helvetica metrics. */
export function pdfWrap(text: string, width: number, size: number, font: PdfFont): string[] {
  const paragraphs = String(text ?? "").split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (pdfTextWidth(candidate, size, font) <= width || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * Sequential PDF page builder. Content is written top-down; the cursor tracks
 * the baseline position and new pages open automatically when space runs out.
 */
export class PdfDocument {
  private pages: Op[][] = [];
  private ops: Op[] = [];
  private cursor = MARGIN;
  private title: string;

  constructor(title = "Document") {
    this.title = title;
    this.pages.push(this.ops);
  }

  get contentWidth() {
    return CONTENT_WIDTH;
  }

  get y() {
    return this.cursor;
  }

  /** Starts a fresh page and resets the cursor to the top margin. */
  addPage() {
    this.ops = [];
    this.pages.push(this.ops);
    this.cursor = MARGIN;
  }

  /** Reserves vertical space, breaking to a new page when it does not fit. */
  private reserve(height: number) {
    if (this.cursor + height > PAGE_HEIGHT - MARGIN) this.addPage();
  }

  /** Moves the cursor down without drawing. */
  space(height: number) {
    this.cursor += height;
  }

  /** Draws a filled rectangle at an absolute position. */
  rect(x: number, y: number, width: number, height: number, color: [number, number, number]) {
    this.ops.push(
      `q ${color.map((c) => c.toFixed(3)).join(" ")} rg ${x.toFixed(2)} ${(
        PAGE_HEIGHT - y - height
      ).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`,
    );
  }

  /** Horizontal rule across the content width at the current cursor. */
  rule(color: [number, number, number] = [0.85, 0.85, 0.85], thickness = 0.7) {
    this.reserve(thickness + 2);
    this.rect(MARGIN, this.cursor, CONTENT_WIDTH, thickness, color);
    this.cursor += thickness + 2;
  }

  /** Writes a wrapped text block and advances the cursor. */
  text(value: string, options: PdfTextOptions = {}): void {
    const size = options.size ?? 10.5;
    const font = options.font ?? "regular";
    const color = options.color ?? [0.1, 0.1, 0.11];
    const leading = size + (options.leading ?? size * 0.45);
    const indent = options.indent ?? 0;
    const width = options.width ?? CONTENT_WIDTH - indent;
    const lines = pdfWrap(value, width, size, font);

    for (const line of lines) {
      this.reserve(leading);
      const baseline = PAGE_HEIGHT - (this.cursor + size);
      this.ops.push(
        `BT /${font === "bold" ? "F2" : "F1"} ${size} Tf ${color
          .map((c) => c.toFixed(3))
          .join(" ")} rg ${(MARGIN + indent).toFixed(2)} ${baseline.toFixed(2)} Td (${pdfString(
          line,
        )}) Tj ET`,
      );
      this.cursor += leading;
    }
    this.cursor += options.spaceAfter ?? 0;
  }

  /** Two-column label/value row with a hairline separator. */
  row(label: string, value: string, labelWidth = 150) {
    const size = 10.5;
    const valueLines = pdfWrap(value, CONTENT_WIDTH - labelWidth - 12, size, "regular");
    const height = Math.max(1, valueLines.length) * (size + 4) + 10;
    this.reserve(height);
    const top = this.cursor;

    const labelBaseline = PAGE_HEIGHT - (top + 9);
    this.ops.push(
      `BT /F1 8.5 Tf 0.42 0.42 0.45 rg ${MARGIN.toFixed(2)} ${labelBaseline.toFixed(
        2,
      )} Td (${pdfString(label.toUpperCase())}) Tj ET`,
    );

    let y = top;
    for (const line of valueLines) {
      const baseline = PAGE_HEIGHT - (y + size);
      this.ops.push(
        `BT /F1 ${size} Tf 0.1 0.1 0.11 rg ${(MARGIN + labelWidth).toFixed(2)} ${baseline.toFixed(
          2,
        )} Td (${pdfString(line)}) Tj ET`,
      );
      y += size + 4;
    }
    this.cursor = top + height;
    this.rect(MARGIN, this.cursor - 6, CONTENT_WIDTH, 0.5, [0.88, 0.88, 0.89]);
  }

  /** Serialises the document to PDF bytes. */
  toBytes(): Uint8Array {
    const pageContents = this.pages.map((ops) => ops.join("\n"));
    const objects: string[] = [];
    const pageCount = pageContents.length;
    // 1 catalog, 2 pages, 3 font F1, 4 font F2, then per page: page + content.
    const pageIds = pageContents.map((_, i) => 5 + i * 2);

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    pageContents.forEach((content, i) => {
      const pageId = pageIds[i]!;
      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
      objects[pageId + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    });

    const info = `<< /Title (${pdfString(this.title)}) /Producer (Gigafactory 3X) >>`;
    const infoId = 5 + pageCount * 2;
    objects[infoId] = info;

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (let id = 1; id <= infoId; id += 1) {
      const body = objects[id] ?? "<< >>";
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${body}\nendobj\n`;
    }
    const startxref = pdf.length;
    pdf += `xref\n0 ${infoId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= infoId; id += 1) {
      pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${infoId + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return bytes;
  }
}

export const PDF_LAYOUT = { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, CONTENT_WIDTH };
