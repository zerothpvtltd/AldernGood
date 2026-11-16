import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, getImageUrl } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product._id}`}
      className="group card-surface flex flex-col overflow-hidden transition-shadow duration-150 ease-out hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-[#F3F1ED]">
        <img
          src={getImageUrl(product.images[0])}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-[12px] text-muted">
            {product.seller?.storeName || product.seller?.name || 'Independent Studio'}
          </p>
          <h3 className="mt-1 text-[15px] font-medium text-ink group-hover:text-accent transition-colors">
            {product.title}
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between pt-2">
          <span className="font-medium text-ink">{formatPrice(product.price)}</span>
          <span className="text-[12px] text-muted">
            {product.ratingCount > 0
              ? `${product.ratingAverage.toFixed(1)} (${product.ratingCount})`
              : product.stock > 0
              ? 'New'
              : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}