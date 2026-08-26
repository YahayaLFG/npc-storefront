import { ORDER_STATUSES, orderStatusIndex } from '@/lib/orderStatus';

export default function OrderTrackingTimeline({ status }) {
  const currentIndex = orderStatusIndex(status);

  return (
    <ol className="space-y-0">
      {ORDER_STATUSES.map((s, i) => {
        const isDone = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={s.value} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-2.5 w-2.5 rounded-full border ${
                  isDone ? 'border-ink bg-ink' : 'border-rule bg-canvas'
                }`}
              />
              {i < ORDER_STATUSES.length - 1 && (
                <span className={`w-px flex-1 ${isDone ? 'bg-ink' : 'bg-rule'}`} style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm ${isCurrent ? 'font-medium text-ink' : isDone ? 'text-ink' : 'text-ink-fog'}`}>
                {s.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
