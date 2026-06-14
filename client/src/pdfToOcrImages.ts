/** Max. Seiten pro OCR-Lauf (mittwald: 30; Playground konservativ wegen Request-Größe). */
export const OCR_MAX_PAGES = 10;

/** Zielauflösung für Rechnungs-OCR (~200 dpi bei A4). */
const PDF_RENDER_DPI = 200;
const PDF_BASE_DPI = 72;

export type OcrPageImage = {
  pageNumber: number;
  dataUrl: string;
};

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

async function encodeBitmapAsJpeg(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
): Promise<string> {
  const { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  bitmap.close();
  return dataUrl;
}

/** Bilddatei für OCR — höhere Auflösung als Standard-Vision (1024 px). */
export async function encodeImageFileForOcr(
  file: File,
  maxEdge = 1600,
  quality = 0.84,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  return encodeBitmapAsJpeg(bitmap, maxEdge, quality);
}

async function renderPdfPageToDataUrl(
  page: import("pdfjs-dist").PDFPageProxy,
  scale: number,
  maxEdge: number,
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  let dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  let attemptScale = scale;
  const maxDataUrlChars = 380_000;

  while (dataUrl.length > maxDataUrlChars && attemptScale > 0.8) {
    attemptScale *= 0.82;
    const vp = page.getViewport({ scale: attemptScale });
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  }

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("PDF-Seite konnte nicht kodiert werden."));
    img.src = dataUrl;
  });
  const bitmap = await createImageBitmap(img);
  return encodeBitmapAsJpeg(bitmap, maxEdge, 0.86);
}

export async function fileToOcrPageImages(file: File): Promise<OcrPageImage[]> {
  if (!isPdfFile(file)) {
    const dataUrl = await encodeImageFileForOcr(file);
    return [{ pageNumber: 1, dataUrl }];
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const pageCount = Math.min(doc.numPages, OCR_MAX_PAGES);
  const scale = PDF_RENDER_DPI / PDF_BASE_DPI;
  const pages: OcrPageImage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const dataUrl = await renderPdfPageToDataUrl(page, scale, 1600);
    pages.push({ pageNumber: i, dataUrl });
  }

  return pages;
}

export function ocrAttachmentLabel(file: File): string {
  return file.name || (isPdfFile(file) ? "Rechnung.pdf" : "Rechnung.jpg");
}
