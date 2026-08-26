/** Builds a human-readable order number, e.g. NPC-2608-4821. */
export function generateOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const tail = Math.floor(1000 + Math.random() * 9000);
  return `NPC-${yy}${mm}-${tail}`;
}
