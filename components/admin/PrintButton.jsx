'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full border border-black/20 px-4 py-2 text-xs text-black print:hidden"
    >
      Print
    </button>
  );
}
