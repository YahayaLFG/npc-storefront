import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/whatsapp';

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-canvas-alt">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-display text-2xl font-extrabold tracking-tightest text-ink">NPC</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-fog">
              Uniforms for the internet. Orders are confirmed and shipped one
              conversation at a time.
            </p>
          </div>

          <div>
            <p className="eyebrow font-mono text-[11px] uppercase text-ink-fog">Navigate</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-fog">
              <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
              <li><Link href="/request" className="hover:text-ink">Request</Link></li>
              <li><Link href="/faq" className="hover:text-ink">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow font-mono text-[11px] uppercase text-ink-fog">Reach us</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-fog">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  className="hover:text-ink"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:hello@npc.ng" className="hover:text-ink">
                  hello@npc.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-rule pt-6 font-mono text-[11px] text-ink-fog md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} NPC. All rights reserved.</span>
          <span>OFFLINE BEFORE EVERYONE ELSE<span className="cursor-blink">_</span></span>
        </div>
      </div>
    </footer>
  );
}
