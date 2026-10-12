// The questions of the purchase page, about the one thing it sells: the complete toolkit. They live
// in lib/ because pages may not import content/.
//
// Provisional beta copy, and the page says so above them. The answers on adapting the content, AI
// tools, SharePoint and language state what the toolkit is today; the commercial ones (licence
// terms, updates, purchase orders) describe the intent and stay placeholders until the terms are
// set.
export const PURCHASE_QUESTIONS: readonly { question: string; answer: string }[] = [
  {
    question: "What file formats do I get?",
    answer:
      "The templates are editable Word, PowerPoint and Excel files, with a few print-ready PDFs. The format is shown on every template in the sample catalog.",
  },
  {
    question: "Can my whole organization use what I buy?",
    answer:
      "The intent is one licence per organization for the complete toolkit, reused across every wave of your rollout. Final licence terms will be published before launch.",
  },
  {
    question: "Can I change the content?",
    answer:
      "Yes. It is meant to be adapted: edit it by hand or feed it to your AI tools, add your branding and remove what does not apply. You keep the copies you adapt.",
  },
  {
    question: "Does it work with AI tools?",
    answer:
      "Yes. The content is built to be fed into AI tools: give them the material and let them tailor it to your organization, your tone and your timeline.",
  },
  {
    question: "Is it only for SharePoint?",
    answer:
      "It is SharePoint-first out of the box. The change management core (structured planning, resistance management, sponsor coaching, Go/No-Go decisions and sustainment) applies to almost any technology rollout.",
  },
  {
    question: "Are the job aids available in French?",
    answer: "No. Today the job aids are English only.",
  },
  {
    question: "Do I get updates?",
    answer:
      "The plan is for buyers to receive updated versions of the toolkit. Details will be confirmed before launch.",
  },
  {
    question: "Can public-sector organizations buy by purchase order?",
    answer:
      "Purchase orders and invoicing for government buyers are planned. Contact us and we will tell you what is available.",
  },
];
