import Link from 'next/link';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-[14px] text-muted">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-secondary mt-4">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}