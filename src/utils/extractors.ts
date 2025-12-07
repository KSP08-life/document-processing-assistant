export function extractMetadata(type: string, text: string) {
  switch (type) {
    case "Invoice":
      return {
        InvoiceNumber: match(text, /invoice\s*(no|number)?\s*[:\-]?\s*(\w+)/i),
        TotalAmount: match(text, /(total|amount)\s*[:\-]?\s*(₹?\$?\s*\d+(\.\d+)?)/i),
        Date: match(text, /\d{2}[\/\-]\d{2}[\/\-]\d{4}/),
      };

    case "ID Card":
      return {
        Name: match(text, /name\s*[:\-]?\s*([A-Z ]+)/i),
        DOB: match(text, /\d{2}[\/\-]\d{2}[\/\-]\d{4}/),
        IDNumber: match(text, /(id|uid)\s*(no)?\s*[:\-]?\s*(\w+)/i),
      };

    case "Certificate":
      return {
        Recipient: match(text, /certify that\s*([A-Z ]+)/i),
        Course: match(text, /(course|program)\s*[:\-]?\s*(.+)/i),
        Organization: match(text, /(university|institute|college)\s*[:\-]?\s*(.+)/i),
      };

    case "Form":
      return {
        Applicant: match(text, /name\s*[:\-]?\s*(.+)/i),
        Email: match(text, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i),
        Phone: match(text, /\b\d{10}\b/),
      };

    default:
      return {};
  }
}

function match(text: string, regex: RegExp) {
  const m = text.match(regex);
  return m ? m[m.length - 1] : "—";
}
