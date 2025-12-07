import Tesseract from "tesseract.js";

export async function runOCR(file: File, onProgress?: (p: number) => void) {
  const result = await Tesseract.recognize(file, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text" && onProgress) {
        onProgress(Math.round(info.progress * 100));
      }
    },
  });

  return result.data.text;
}
