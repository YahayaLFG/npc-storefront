import Link from 'next/link';
import { getActiveAnnouncement } from '@/lib/announcements';

const STYLE_CLASSES = {
  default: 'bg-canvas-alt text-ink border-rule',
  inverted: 'bg-ink text-canvas border-ink',
  subtle: 'bg-canvas text-ink-fog border-rule',
};

export default async function AnnouncementBar() {
  const announcement = await getActiveAnnouncement();
  if (!announcement) return null;

  const styleClass = STYLE_CLASSES[announcement.style] || STYLE_CLASSES.default;

  const content = (
    <p className="mx-auto max-w-7xl px-5 py-2.5 text-center text-xs tracking-wide md:px-8">
      {announcement.message}
      {announcement.link_url && announcement.link_label && (
        <span className="ml-2 underline underline-offset-2">{announcement.link_label}</span>
      )}
    </p>
  );

  return (
    <div className={`border-b ${styleClass}`}>
      {announcement.link_url ? <Link href={announcement.link_url}>{content}</Link> : content}
    </div>
  );
}
