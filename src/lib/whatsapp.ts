/**
 * Build WhatsApp chat URL for a phone number (India-friendly: 10-digit → +91).
 */
export function getWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.startsWith("0")) {
    digits = `91${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}`;
}

export function openWhatsApp(phone: string | null | undefined) {
  const url = getWhatsAppUrl(phone);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
