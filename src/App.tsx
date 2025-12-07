import { useState } from "react";
import { runOCR } from "./utils/ocr";
import { classifyDocument } from "./utils/classifier";
import { extractMetadata } from "./utils/extractors";

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
      const text = await runOCR(file, setProgress);
      setExtractedText(text);

      const result = classifyDocument(text);
      setDocType(result.type);
      setConfidence(result.confidence);

      const data = extractMetadata(result.type, text);
      setMetadata(data);
    } catch (err) {
      console.error(err);
      alert("OCR or classification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
            DP
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold">
              Document Processing Assistant
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Intelligent document classification and metadata extraction with OCR
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

          {/* Features */}
          <section className="grid gap-4 md:grid-cols-3">
            <Feature
              title="OCR Processing"
              desc="Extract text from images using advanced OCR technology."
            />
            <Feature
              title="Smart Classification"
              desc="Automatically identify invoices, IDs, certificates and forms."
            />
            <Feature
              title="Metadata Extraction"
              desc="Extract structured data specific to each document type."
            />
          </section>

          {/* Upload */}
          <section className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="text-4xl mb-2">⬆️</div>
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <p className="text-sm text-slate-600 mt-1">
                Click to upload an image (PNG, JPG, JPEG)
              </p>
            </label>
          </section>

          {/* OCR Progress */}
          {loading && (
            <section className="space-y-2">
              <p className="text-sm font-medium">
                Processing OCR… {progress}%
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>
          )}

          {/* Results */}
          {extractedText && (
            <section className="rounded-2xl border bg-white p-5 space-y-4">
              <h2 className="font-semibold">Extracted Text</h2>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-auto">
                {extractedText}
              </pre>

              <div className="pt-2 border-t space-y-2">
                <p className="text-sm">
                  <strong>Detected Type:</strong>{" "}
                  <span className="font-semibold">{docType}</span>{" "}
                  ({confidence}% confidence)
                </p>

                <div>
                  <h3 className="font-semibold text-sm mb-1">
                    Extracted Metadata
                  </h3>
                  <pre className="text-xs bg-slate-50 p-3 rounded whitespace-pre-wrap">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </section>
          )}

          {/* Supported Docs */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Supported Document Types</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <DocCard title="Invoices" desc="Vendor info, totals, dates, line items" />
              <DocCard title="ID Cards" desc="Names, DOB, ID numbers, address" />
              <DocCard title="Certificates" desc="Recipient, organization, course" />
              <DocCard title="Forms" desc="Applicant data and form fields" />
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-500 flex justify-between">
          <span>© 2025 Document Processing Assistant</span>
          <span>Built with React, TypeScript & Tesseract.js</span>
        </div>
      </footer>
    </div>
  );
}

/* Helper components */

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function DocCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-slate-600">{desc}</p>
    </div>
  );
}

export default App;
