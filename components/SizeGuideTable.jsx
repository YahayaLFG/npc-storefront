export default function SizeGuideTable({ sizeGuide }) {
  if (!sizeGuide) return null;
  const { unit, fields, rows } = sizeGuide;

  return (
    <div className="border border-rule bg-canvas-alt">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-rule">
            <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-fog">
              Size
            </th>
            {fields.map((field) => (
              <th
                key={field}
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-fog"
              >
                {field} {unit ? `(${unit})` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size} className="border-b border-rule last:border-b-0">
              <td className="px-4 py-3 text-ink">{row.size}</td>
              {row.values.map((value, i) => (
                <td key={i} className="px-4 py-3 font-mono text-ink-fog">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
