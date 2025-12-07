export type DocType =
  | "Invoice"
  | "ID Card"
  | "Certificate"
  | "Form"
  | "Unknown";

export function classifyDocument(text: string): {
  type: DocType;
  confidence: number;
} {
  const content = text.toLowerCase();

  let score = {
    invoice: 0,
    id: 0,
    certificate: 0,
    form: 0,
  };

  // Invoice indicators
  if (content.includes("invoice")) score.invoice += 2;
  if (content.includes("total")) score.invoice += 1;
  if (content.includes("amount")) score.invoice += 1;
  if (content.match(/₹|\$|total\s*[:\-]?\s*\d+/)) score.invoice += 2;

  // ID card indicators
  if (content.includes("date of birth")) score.id += 2;
  if (content.includes("id no") || content.includes("uid")) score.id += 2;
  if (content.includes("address")) score.id += 1;

  // Certificate indicators
  if (content.includes("certificate")) score.certificate += 3;
  if (content.includes("certify")) score.certificate += 2;
  if (content.includes("course") || content.includes("completion"))
    score.certificate += 1;

  // Form indicators
  if (content.includes("application")) score.form += 2;
  if (content.includes("form")) score.form += 2;
  if (content.includes("signature")) score.form += 1;

  const maxScore = Math.max(
    score.invoice,
    score.id,
    score.certificate,
    score.form
  );

  if (maxScore === 0) {
    return { type: "Unknown", confidence: 0 };
  }

  let type: DocType = "Unknown";

  if (maxScore === score.invoice) type = "Invoice";
  else if (maxScore === score.id) type = "ID Card";
  else if (maxScore === score.certificate) type = "Certificate";
  else if (maxScore === score.form) type = "Form";

  return {
    type,
    confidence: Math.min(95, maxScore * 20),
  };
}
