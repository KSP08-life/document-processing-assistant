import { useState } from "react";
import { runOCR } from "./utils/ocr";
import { classifyDocument } from "./utils/classifier";
import { extractMetadata } from "./utils/extractors";
import { extractImagesFromPDF } from "./utils/pdf";

function App() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");

  const [docType, setDocType] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractedText("");
    setDocType("");
    setConfidence(0);
    setMetadata({});
    setProgress(0);
    setLoading(true);

    try {
      let fullText = "";

      // ✅ PDF support
      if (file.type === "application/pdf") {
        const images = await extractImagesFromPDF(file);

        for (let i = 0; i < images.length; i++) {
          const pageText = await runOCR(images[i], (p) =>
            setProgress(
              Math.round(((i + p / 100) / images.length) * 100)
            )
          );
          fullText += "\n" + pageText;
        }
      } else {
        fullText = await runOCR(file, setProgress);
      }

      setExtractedText(fullText);

      const result = classifyDocument(fullText);
      setDocType(result.type);
      setConfidence(result.confidence);
      setMetadata(extractMetadata(result.type, fullText));
    } catch (err) {
      console.error(err);
      alert("Image/PDF processing failed");
    } finally {
      setLoading(false);
    }
  }

  /* ===== DOWNLOAD HELPERS ===== */

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, "metadata.json");
  }

  function downloadCSV() {
    const rows = Object.entries(metadata).map(
      ([key, value]) => `"${key}","${String(value).replace(/"/g, '""')}"`
    );
    const csv = ["Field,Value", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    triggerDownload(blob, "metadata.csv");
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-sky-500/40">
              DP
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">
                Document Processing Assistant
              </h1>
              <p className="text-[11px] md:text-xs text-slate-300/80">
                Intelligent document classification & metadata extraction with OCR
              </p>
            </div>
          </div>

          {docType && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-slate-300/80">Last detected:</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="capitalize font-medium">{docType}</span>
                <span className="text-[10px] text-emerald-200/80">
                  {confidence}% confidence
                </span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
          {/* Features section */}
          <section className="grid gap-4 md:grid-cols-3">
            <Feature
              title="OCR Processing"
              desc="Extract text from images and PDFs using fast, on-device OCR."
              accent="from-sky-500/80 to-cyan-300/80"
            />
            <Feature
              title="Smart Classification"
              desc="Automatically identify invoices, ID cards, certificates and forms."
              accent="from-indigo-500/80 to-violet-300/80"
            />
            <Feature
              title="Metadata Extraction"
              desc="Pull out structured fields tailored to each document type."
              accent="from-emerald-500/80 to-teal-300/80"
            />
          </section>

          {/* Upload area */}
          <section className="relative rounded-3xl border border-dashed border-slate-500/60 bg-slate-900/60 px-6 py-10 md:py-14 text-center shadow-xl shadow-sky-900/40 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-10 -top-24 h-40 bg-gradient-to-r from-sky-500/10 via-transparent to-indigo-500/10 blur-3xl" />
            <label className="relative cursor-pointer block">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-md shadow-sky-500/40">
                  <span className="text-3xl animate-bounce">⬆️</span>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">
                    Upload Document
                  </h2>
                  <p className="text-sm text-slate-300/90 mt-1">
                    Drag & drop or click to browse files
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports images (PNG, JPG) and PDF files. Max size depends on browser.
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700/80 px-3 py-1 text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Client-side OCR & classification – no file leaves your browser.
                </div>
              </div>
            </label>
          </section>

          {/* Progress */}
          {loading && (
            <section className="space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="font-medium tracking-wide">
                  Processing document…
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-[width] duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>
          )}

          {/* Results */}
          {extractedText && (
            <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Extracted text */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-lg shadow-slate-900/80">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      Extracted Text
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Raw OCR output from the uploaded document
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] text-slate-300 border border-slate-700/70">
                    {Math.max(extractedText.length, 1)} chars
                  </span>
                </div>
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-3 max-h-72 overflow-auto text-xs text-slate-200/90 font-mono whitespace-pre-wrap">
                  {extractedText}
                </div>
              </div>

              {/* Metadata & classification */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 md:p-6 shadow-lg shadow-slate-900/80 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-tight">
                    Document Insights
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Classification and extracted metadata fields
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 border border-slate-700/80 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Type:{" "}
                    <span className="capitalize font-medium text-sky-200">
                      {docType || "Unknown"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 border border-slate-700/80 px-2.5 py-1">
                    Confidence:
                    <span className="font-semibold text-emerald-300">
                      {confidence}%
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-200">
                    Extracted Metadata
                  </h3>
                  <div className="rounded-2xl bg-slate-950/70 border border-slate-800/90 p-3 text-[11px] font-mono text-slate-100/90 whitespace-pre-wrap max-h-52 overflow-auto">
                    {Object.keys(metadata).length === 0 ? (
                      <span className="text-slate-500">
                        No metadata detected. Try a clearer document or a different type.
                      </span>
                    ) : (
                      <pre>{JSON.stringify(metadata, null, 2)}</pre>
                    )}
                  </div>
                </div>

                {Object.keys(metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={downloadJSON}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-md shadow-sky-500/40 hover:brightness-110 active:scale-95 transition"
                    >
                      Download JSON
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-50 border border-slate-600 hover:bg-slate-700 active:scale-95 transition"
                    >
                      Download CSV
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Supported document types */}
          <section className="space-y-4 pt-4">
            <h2 className="text-sm md:text-base font-semibold tracking-tight">
              Supported Document Types
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <DocCard
                title="Invoices"
                subtitle="Finance & billing"
                desc="Vendor details, totals, dates, tax, and line items."
              />
              <DocCard
                title="ID Cards"
                subtitle="Identity documents"
                desc="Names, ID numbers, DOB, and address information."
              />
              <DocCard
                title="Certificates"
                subtitle="Academic & training"
                desc="Recipient, organization, course/program, and date."
              />
              <DocCard
                title="Forms"
                subtitle="Applications & KYC"
                desc="Applicant info and key form fields."
              />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 text-[11px] text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2">
          <span>© 2025 Document Processing Assistant</span>
          <span className="flex items-center gap-1">
            Built with React, TypeScript, Tailwind CSS & Tesseract.js
          </span>
        </div>
      </footer>
    </div>
  );
}

/* === Helper components === */

function Feature({
  title,
  desc,
  accent,
}: {
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/70 overflow-hidden group">
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent} blur-3xl`}
      />
      <div className="relative space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-slate-300/90">{desc}</p>
      </div>
    </div>
  );
}

function DocCard({
  title,
  subtitle,
  desc,
}: {
  title: string;
  subtitle: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-md shadow-slate-900/70 hover:border-sky-400/70 hover:shadow-sky-500/40 transition-all">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-[11px] text-sky-300 mt-0.5">{subtitle}</p>
      <p className="text-xs text-slate-300 mt-2">{desc}</p>
    </div>
  );
}

export default App;
