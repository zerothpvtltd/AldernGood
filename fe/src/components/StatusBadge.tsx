import { OrderItemStatus } from '@/types';

const STATUS_STYLES: Record<OrderItemStatus, string> = {
  placed: 'border-border bg-[#F4F3F0] text-ink',
  processing: 'border-warning/30 bg-warning/10 text-warning',
  shipped: 'border-accent/30 bg-accent/10 text-accent',
  delivered: 'border-success/30 bg-success/10 text-success',
  cancelled: 'border-danger/30 bg-danger/10 text-danger',
};

export function StatusBadge({ status }: { status: OrderItemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}