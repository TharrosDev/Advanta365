import { formatPrice, formatPriceParts } from "@/lib/format";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-card";
import { OFFER, SITE, TOOLKIT } from "@/lib/site";

const PRICE = formatPrice(OFFER.priceCents, OFFER.currency);
const { amount, currency } = formatPriceParts(OFFER.priceCents, OFFER.currency);

export const alt = `${OFFER.name} from ${SITE.name}: ${PRICE}, one purchase.`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    label: OFFER.name,
    title: "One toolkit, one price.",
    body: `Every phase of a Microsoft 365 rollout and training for ${TOOLKIT.trainingAudiences} audiences.`,
    aside: amount,
    asideNote: `${currency}, one purchase`,
  });
}
