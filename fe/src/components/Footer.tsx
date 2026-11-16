import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-container flex-col justify-between gap-4 px-4 py-8 text-[13px] text-muted sm:flex-row sm:items-center sm:px-6">
        <div>
          <span className="font-medium text-ink">Alder &amp; Goods</span> — Independent makers and everyday essentials.
        </div>
        <div className="flex items-center gap-6">
          <Link href="/products" className="hover:text-ink transition-colors">
            Browse Catalog
          </Link>
          <Link href="/register" className="hover:text-ink transition-colors">
            Open a Store
          </Link>
        </div>
      </div>
    </footer>
  );
}