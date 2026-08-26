import { MessageCircle, Mail, Clock } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export const metadata = { title: 'Contact — NPC' };

export default function ContactPage() {
  const whatsappHref = buildWhatsAppLink("Hey NPC, I have a question before ordering.");

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">If you know, you know</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Talk to a real person</h1>
      <p className="mt-4 max-w-lg text-ink-fog">
        Every conversation runs through WhatsApp with our team directly — no
        ticket queues, no chatbots.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col justify-between border border-rule p-6 transition-colors hover:border-ink md:col-span-2"
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={24} className="text-ink" />
            <div>
              <p className="font-display text-xl">Chat on WhatsApp</p>
              <p className="mt-1 text-sm text-ink-fog">Usually a reply within the hour.</p>
            </div>
          </div>
          <span className="mt-6 inline-flex w-fit items-center rounded-full border border-rule px-4 py-2 text-xs text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-canvas">
            Open WhatsApp
          </span>
        </a>

        <div className="border border-rule p-6">
          <Mail size={20} className="text-ink" />
          <p className="mt-3 font-display text-lg">Email</p>
          <a href="mailto:hello@npc.ng" className="mt-1 block text-sm text-ink-fog hover:text-ink">
            hello@npc.ng
          </a>
        </div>

        <div className="border border-rule p-6">
          <Clock size={20} className="text-ink" />
          <p className="mt-3 font-display text-lg">Response hours</p>
          <p className="mt-1 text-sm text-ink-fog">Mon–Sat, 9am–8pm WAT</p>
        </div>
      </div>
    </div>
  );
}
