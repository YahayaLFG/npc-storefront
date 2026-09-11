/**
 * ⚠️ REPLACE THIS with your real WhatsApp Business number before launch.
 * Format: country code + number, no "+", no spaces, no leading zero.
 */
export const WHATSAPP_NUMBER = '2349115380205';

/** Builds a wa.me link that opens WhatsApp with a pre-filled message. */
export function buildWhatsAppLink(message, number = WHATSAPP_NUMBER) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

/** Message for the Request page — someone asking about a piece not on the site. */
export function buildRequestMessage({ link, hasImage, size, color, quantity, whatsapp }) {
  return [
    `Hey NPC, I'm looking for something you don't have listed.`,
    ``,
    link ? `*Reference:* ${link}` : `*Reference:* sending an image on WhatsApp`,
    hasImage ? `*Image:* attached separately on WhatsApp` : null,
    `*Size:* ${size || 'N/A'}`,
    `*Color:* ${color || 'N/A'}`,
    `*Quantity:* ${quantity || 1}`,
    `*My WhatsApp:* ${whatsapp || 'N/A'}`,
  ]
    .filter(Boolean)
    .join('\n');
}
