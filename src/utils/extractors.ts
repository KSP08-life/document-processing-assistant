// src/utils/extractors.ts

export type DocumentType =
  | "invoice"
  | "id_card"
  | "certificate"
  | "form"
  | "unknown";

/**
 * Main entry: route to type-specific extractor
 */
export function extractMetadata(
  type: string,
  text: string
): Record<string, any> {
  const normalized = type.toLowerCase() as DocumentType;

  switch (normalized) {
    case "invoice":
      return extractInvoiceMetadata(text);
    case "id_card":
      return extractIdCardMetadata(text);
    case "certificate":
      return extractCertificateMetadata(text);
    case "form":
      return extractFormMetadata(text);
    default:
      return {};
  }
}

/* ----------------- INVOICE EXTRACTOR ----------------- */

const MONEY_REGEX =
  /([€£$₹])?\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/g;

function extractInvoiceMetadata(raw: string): Record<string, any> {
  const text = raw.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const metadata: Record<string, any> = {
    DocumentType: "invoice",
  };

  /* Vendor name – e.g. "Company Name INVOICE" -> "Company Name" */
  if (lines.length > 0) {
    const first = lines[0];
    const idx = first.toUpperCase().indexOf("INVOICE");
    if (idx > 0) {
      const vendorName = first.slice(0, idx).trim();
      if (vendorName) metadata.VendorName = vendorName;
    }
  }

  /* Invoice number – search for "INVOICE # / NO / NUMBER" */
  let invoiceNumber: string | null = null;
  for (const line of lines) {
    if (/INVOICE\s*(#|NO|NUMBER)/i.test(line)) {
      const m = line.match(
        /INVOICE\s*(#|NO|NUMBER)?\s*[:\-]?\s*([A-Z0-9\-]+)/i
      );
      if (m && m[2]) {
        invoiceNumber = m[2];
        break;
      }
    }
  }
  if (invoiceNumber) {
    metadata.InvoiceNumber = invoiceNumber;
  }

  /* Invoice date & due date – any date on lines containing "DATE" */
  let invoiceDate: string | null = null;
  let dueDate: string | null = null;

  for (const line of lines) {
    if (/DATE/i.test(line)) {
      const m = line.match(
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
      );
      if (m && m[1]) {
        if (/DUE\s*DATE/i.test(line)) {
          dueDate = m[1];
        } else if (!invoiceDate) {
          invoiceDate = m[1];
        }
      }
    }
  }

  if (invoiceDate) metadata.InvoiceDate = invoiceDate;
  if (dueDate) metadata.DueDate = dueDate;

  /* Subtotal, taxable, tax rate, tax due – exact labels */
  const subtotalMatch = text.match(/Subtotal\s+(\d+[.,]\d{2})/i);
  if (subtotalMatch) {
    metadata.Subtotal = parseFloat(
      subtotalMatch[1].replace(",", ".")
    );
  }

  const taxableMatch = text.match(/Taxable\s+(\d+[.,]\d{2})/i);
  if (taxableMatch) {
    metadata.TaxableAmount = parseFloat(
      taxableMatch[1].replace(",", ".")
    );
  }

  const taxRateMatch = text.match(/Tax\s*rate\s+(\d+[.,]\d+)%?/i);
  if (taxRateMatch) {
    metadata.TaxRate = parseFloat(
      taxRateMatch[1].replace(",", ".")
    );
  }

  const taxDueMatch = text.match(/Tax\s*due\s+(\d+[.,]\d{2})/i);
  if (taxDueMatch) {
    metadata.TaxAmount = parseFloat(
      taxDueMatch[1].replace(",", ".")
    );
  }

  /* Total amount – prefer line starting with TOTAL, else max money value */
  let currency: string | null = null;
  let totalAmountStr: string | null = null;

  const totalLine = lines.find((l) => /^TOTAL\b/i.test(l));
  if (totalLine) {
    // e.g. "TOTAL S$ 604.69"
    const m = totalLine.match(
      /TOTAL\s*([A-Z$€£₹]{0,3})\s*(\d+[.,]\d{2})/i
    );
    if (m) {
      currency = m[1] || null;
      totalAmountStr = m[2];
    }
  }

  // Fallback: pick largest money-like number in whole text
  if (!totalAmountStr) {
    const matches = [...text.matchAll(MONEY_REGEX)];
    if (matches.length > 0) {
      let best = matches[0];
      let bestVal = parseFloat(
        matches[0][2].replace(",", ".")
      );
      for (const m of matches.slice(1)) {
        const val = parseFloat(m[2].replace(",", "."));
        if (val > bestVal) {
          best = m;
          bestVal = val;
        }
      }
      currency = best[1] || null;
      totalAmountStr = best[2];
    }
  }

  if (totalAmountStr) {
    metadata.TotalAmount = parseFloat(
      totalAmountStr.replace(",", ".")
    );
    if (currency) {
      metadata.Currency = currency;
    }
  }

  /* Payment terms – "due in 30 days" */
  const dueInMatch = text.match(/due in\s+(\d+)\s+days/i);
  if (dueInMatch) {
    metadata.PaymentTermsDays = parseInt(dueInMatch[1], 10);
  }

  return metadata;
}

/* ----------------- OTHER TYPES (simple for now) ----------------- */

function extractIdCardMetadata(text: string): Record<string, any> {
  const meta: Record<string, any> = {
    DocumentType: "id_card",
  };

  // Very simple heuristics – you can improve later
  const dob =
    text.match(
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i
    )?.[1] || null;
  if (dob) meta.DateOfBirth = dob;

  const idMatch = text.match(/\b([A-Z0-9]{6,})\b/);
  if (idMatch) meta.IdNumber = idMatch[1];

  return meta;
}

function extractCertificateMetadata(text: string): Record<string, any> {
  const meta: Record<string, any> = {
    DocumentType: "certificate",
  };

  // Recipient name – line before "has successfully" or "is awarded"
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 1; i < lines.length; i++) {
    if (
      /has successfully|is hereby|is awarded/i.test(
        lines[i]
      )
    ) {
      meta.RecipientName = lines[i - 1];
      break;
    }
  }

  return meta;
}

function extractFormMetadata(text: string): Record<string, any> {
  const meta: Record<string, any> = {
    DocumentType: "form",
  };

  const emailMatch = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );
  if (emailMatch) meta.Email = emailMatch[0];

  const phoneMatch = text.match(
    /(\+?\d[\d\s\-]{7,}\d)/i
  );
  if (phoneMatch) meta.Phone = phoneMatch[1];

  return meta;
}
