'use client';

import { useState } from 'react';
import { UploadCloud, Link2, Image as ImageIcon, X } from 'lucide-react';
import { buildRequestMessage, buildWhatsAppLink } from '@/lib/whatsapp';

export default function RequestPage() {
  const [link, setLink] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');

  function handleFile(file) {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!link.trim() && !image) {
      setError('Drop a link or an image so we know what you mean.');
      return;
    }
    if (!whatsapp.trim()) {
      setError('Enter your WhatsApp number so we can reach you.');
      return;
    }
    setError('');

    const message = buildRequestMessage({
      link: link.trim(),
      hasImage: Boolean(image),
      size,
      color,
      quantity,
      whatsapp,
    });

    window.open(buildWhatsAppLink(message), '_blank');
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Not everything makes the site</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Send it through</h1>
      <p className="mt-4 max-w-md text-sm text-ink-fog md:text-base">
        Seen something we don't have listed? Drop a link or an image and your
        details, and we'll come back with a price and a straight answer.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <label htmlFor="link" className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-fog">
            <Link2 size={14} /> Link
          </label>
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="mt-3 w-full border border-rule bg-canvas-alt px-4 py-3 text-sm text-ink placeholder:text-ink-fog focus:border-ink"
          />
        </div>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-ink-fog">
          <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-fog">
            <ImageIcon size={14} /> Upload an image
          </label>

          {preview ? (
            <div className="relative mt-3 w-fit">
              <img src={preview} alt="Uploaded reference preview" className="h-40 border border-rule object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }}
                className="absolute -right-2 -top-2 border border-rule bg-canvas p-1 text-ink hover:border-ink"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="image"
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-rule bg-canvas-alt px-4 py-10 text-center transition-colors hover:border-ink-fog"
            >
              <UploadCloud size={22} className="text-ink" />
              <span className="text-sm text-ink/80">Tap to choose an image</span>
              <span className="text-xs text-ink-fog">PNG or JPG</span>
              <input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="size" className="text-xs uppercase tracking-wide text-ink-fog">Size</label>
            <input
              id="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="e.g. M / 42"
              className="mt-3 w-full border border-rule bg-canvas-alt px-4 py-3 text-sm placeholder:text-ink-fog focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="color" className="text-xs uppercase tracking-wide text-ink-fog">Color</label>
            <input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black"
              className="mt-3 w-full border border-rule bg-canvas-alt px-4 py-3 text-sm placeholder:text-ink-fog focus:border-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="quantity" className="text-xs uppercase tracking-wide text-ink-fog">Quantity</label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="mt-3 w-28 border border-rule bg-canvas-alt px-4 py-3 text-sm focus:border-ink"
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="text-xs uppercase tracking-wide text-ink-fog">Your WhatsApp number</label>
          <input
            id="whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="e.g. 0803 123 4567"
            className="mt-3 w-full border border-rule bg-canvas-alt px-4 py-3 text-sm placeholder:text-ink-fog focus:border-ink"
          />
        </div>

        {error && <p className="text-sm text-ink-fog">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01] md:w-auto md:px-10"
        >
          Send on WhatsApp
        </button>
        <p className="text-xs text-ink-fog">
          This opens WhatsApp with your details filled in. If you uploaded an
          image, attach it in the chat once it opens.
        </p>
      </form>
    </div>
  );
}
