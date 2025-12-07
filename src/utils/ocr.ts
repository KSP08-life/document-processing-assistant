import Tesseract from "tesseract.js";

export async function runOCR(
  fileOrBlob: File | Blob,
  onProgress?: (p: number) => void
) {
  const result = await Tesseract.recognize(fileOrBlob, "eng", {
    logger: (info) => {
      if (
        info.status === "recognizing text" &&
        typeof onProgress === "function"
      ) {
        onProgress(Math.round(info.progress * 100));
      }
    },
  });

  // Safety: always return a string
  return result?.data?.text || "";
}
