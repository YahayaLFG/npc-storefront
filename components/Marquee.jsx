const ITEMS = [
  'THE ALGORITHM FOUND YOU FIRST',
  'UNIFORMS FOR THE INTERNET',
  'QUIET FLEX ONLY',
  'IF YOU KNOW, YOU KNOW',
  'OFFLINE BEFORE EVERYONE ELSE',
  'CURATED FOR PEOPLE WHO GET IT',
];

export default function Marquee() {
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-b border-line bg-panel py-2">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {track.map((item, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-[10px] tracking-widest text-mute">
            {item}
            <span aria-hidden="true">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
