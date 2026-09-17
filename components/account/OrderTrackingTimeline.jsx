import { CUSTOMER_STATUS_STAGES, customerStatusIndex } from '@/lib/orderStatus';

/**
 * Customer-facing progress display — collapses the 11 internal
 * operational statuses into the 7 clean customer stages. Never renders
 * internal status labels (which include things like "Seller Shipped")
 * directly to a customer.
 */
export default function OrderTrackingTimeline({ status }) {
  const currentIndex = customerStatusIndex(status);

  return (
    <ol className="space-y-0">
      {CUSTOMER_STATUS_STAGES.map((label, i) => {
        const isDone = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-2.5 w-2.5 rounded-full border ${
                  isDone ? 'border-ink bg-ink' : 'border-rule bg-canvas'
                }`}
              />
              {i < CUSTOMER_STATUS_STAGES.length - 1 && (
                <span className={`w-px flex-1 ${isDone ? 'bg-ink' : 'bg-rule'}`} style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm ${isCurrent ? 'font-medium text-ink' : isDone ? 'text-ink' : 'text-ink-fog'}`}>
                {label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
