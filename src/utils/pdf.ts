import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// In some setups TS complains about this line; cast GlobalWorkerOptions to any
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractImagesFromPDF(file: File): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: Blob[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 👇 TypeScript fix: include `canvas` and cast to any to satisfy `RenderParameters`
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      canvas,
    } as any);

    await renderTask.promise;

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), "image/png")
    );

    images.push(blob);
  }

  return images;
}
