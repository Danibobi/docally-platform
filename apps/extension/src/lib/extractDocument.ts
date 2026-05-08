import {Readability} from "@mozilla/readability";
import type {ExtractedDocument} from "@docally/shared";

export function extractDocument(): ExtractedDocument | {error: string} {
  const url = window.location.href;
  const title = document.title || "Untitled document";

  if (looksLikePdf()) {
    return {
      error:
        "This page looks like a browser PDF or embedded document. Production PDF.js extraction is planned for this surface; open an HTML version for now.",
    };
  }

  const clone = document.cloneNode(true) as Document;
  clone.querySelectorAll("script, style, noscript, nav, header, footer, [aria-hidden='true']").forEach((node) => node.remove());
  const article = new Readability(clone).parse();
  const text = cleanText(article?.textContent || document.body?.innerText || "");

  if (text.length < 80) {
    return {
      error:
        "DocAlly could not find enough readable text. This may be a locked viewer, canvas document, or app screen with little text.",
    };
  }

  return {
    title: article?.title || title,
    url,
    sourceType: detectSourceType(url),
    text,
    html: article?.content || undefined,
    language: document.documentElement.lang || "en",
  };
}

function cleanText(text: string): string {
  return text.replace(/\t/g, " ").replace(/[ ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function looksLikePdf(): boolean {
  return (
    window.location.href.toLowerCase().includes(".pdf") ||
    Boolean(document.querySelector("embed[type='application/pdf'], object[type='application/pdf'], iframe[src*='.pdf']"))
  );
}

function detectSourceType(url: string): ExtractedDocument["sourceType"] {
  const lower = url.toLowerCase();
  if (lower.includes("sharepoint") || lower.includes("office.com")) return "document";
  if (lower.includes("outlook") || lower.includes("mail")) return "email";
  return "webpage";
}
