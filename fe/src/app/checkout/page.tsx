'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cart, Order } from '@/types';
import { apiFetch, ApiClientError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient full name is required'),
  line1: z.string().trim().min(4, 'Street address is required'),
  city: z.string().trim().min(2, 'City is required'),
  postalCode: z.string().trim().min(3, 'Postal code is required'),
  phone: z.string().trim().min(6, 'Phone number is required'),
  cardholderName: z.string().trim().min(2, 'Name on card is required'),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => /^\d{16}$/.test(v), 'Enter a valid 16-digit card number'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Enter a 3 or 4 digit CVC'),
});

type CheckoutValues = z.infer<typeof checkoutFormSchema>;

export default function CheckoutPage() {
  const { user, loading: authLoading, refreshCartCount } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      cardNumber: '4242 4242 4242 4242',
      expiry: '08/29',
      cvc: '424',
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'buyer') {
      router.replace('/login');
      return;
    }

    setValue('fullName', user.name);
    setValue('cardholderName', user.name);

    apiFetch<{ cart: Cart }>('/cart')
      .then((res) => {
        if (res.cart.items.length === 0) {
          router.replace('/cart');
        } else {
          setCart(res.cart);
        }
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router, setValue]);

  const onSubmit = async (values: CheckoutValues) => {
    setPaymentError(null);
    try {
      const payload = {
        shippingAddress: {
          fullName: values.fullName,
          line1: values.line1,
          city: values.city,
          postalCode: values.postalCode,
          phone: values.phone,
        },
        cardDetails: {
          cardholderName: values.cardholderName,
          cardNumber: values.cardNumber,
          expiry: values.expiry,
          cvc: values.cvc,
        },
      };

      const res = await apiFetch<{ order: Order }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await refreshCartCount();
      showToast('Order placed successfully');
      router.push(`/orders/${res.order._id}?confirmed=1`);
    } catch (err) {
      setPaymentError(
        err instanceof ApiClientError ? err.message : 'Checkout failed'
      );
    }
  };

  if (authLoading || loading || !cart) {
    return <div className="h-64 animate-pulse rounded-[8px] bg-[#EFECE6]" />;
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-[24px] font-semibold text-ink">Checkout</h1>

      <div className="rounded-[8px] border border-border bg-[#F4F2ED] px-4 py-3 text-[13px] text-ink">
        <strong>Test mode, no real payment.</strong> Use{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px]">
          4242 4242 4242 4242
        </code>{' '}
        for an approved order, or{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px]">
          4000 0000 0000 0002
        </code>{' '}
        to test a declined payment.
      </div>

      {paymentError && (
        <div className="rounded-[8px] border border-danger/40 bg-danger/10 px-4 py-3 text-[14px] text-danger">
          {paymentError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface space-y-4 p-6">
            <h2 className="text-[18px] font-semibold text-ink">Shipping Address</h2>

            <div>
              <label htmlFor="fullName" className="block text-[13px] font-medium text-ink">
                Full name
              </label>
              <input id="fullName" {...register('fullName')} className="input-field mt-1" />
              {errors.fullName && (
                <p className="mt-1 text-[12px] text-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="line1" className="block text-[13px] font-medium text-ink">
                Street address
              </label>
              <input
                id="line1"
                placeholder="123 Elm Street, Apt 4"
                {...register('line1')}
                className="input-field mt-1"
              />
              {errors.line1 && (
                <p className="mt-1 text-[12px] text-danger">{errors.line1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="city" className="block text-[13px] font-medium text-ink">
                  City
                </label>
                <input id="city" {...register('city')} className="input-field mt-1" />
                {errors.city && (
                  <p className="mt-1 text-[12px] text-danger">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-[13px] font-medium text-ink">
                  Postal code
                </label>
                <input id="postalCode" {...register('postalCode')} className="input-field mt-1" />
                {errors.postalCode && (
                  <p className="mt-1 text-[12px] text-danger">{errors.postalCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-[13px] font-medium text-ink">
                  Phone
                </label>
                <input id="phone" {...register('phone')} className="input-field mt-1" />
                {errors.phone && (
                  <p className="mt-1 text-[12px] text-danger">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="card-surface space-y-4 p-6">
            <h2 className="text-[18px] font-semibold text-ink">Payment Details</h2>

            <div>
              <label htmlFor="cardholderName" className="block text-[13px] font-medium text-ink">
                Cardholder name
              </label>
              <input
                id="cardholderName"
                {...register('cardholderName')}
                className="input-field mt-1"
              />
              {errors.cardholderName && (
                <p className="mt-1 text-[12px] text-danger">{errors.cardholderName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="cardNumber" className="block text-[13px] font-medium text-ink">
                Card number
              </label>
              <input id="cardNumber" {...register('cardNumber')} className="input-field mt-1" />
              {errors.cardNumber && (
                <p className="mt-1 text-[12px] text-danger">{errors.cardNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-[13px] font-medium text-ink">
                  Expiry (MM/YY)
                </label>
                <input id="expiry" {...register('expiry')} className="input-field mt-1" />
                {errors.expiry && (
                  <p className="mt-1 text-[12px] text-danger">{errors.expiry.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="cvc" className="block text-[13px] font-medium text-ink">
                  CVC
                </label>
                <input id="cvc" {...register('cvc')} className="input-field mt-1" />
                {errors.cvc && (
                  <p className="mt-1 text-[12px] text-danger">{errors.cvc.message}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="card-surface h-fit space-y-4 p-6">
          <h2 className="text-[18px] font-semibold text-ink">Order Summary</h2>
          <ul className="divide-y divide-border text-[13px]">
            {cart.items.map((item) => (
              <li key={item.product._id} className="flex justify-between py-2.5">
                <span className="text-ink">
                  {item.product.title} &times; {item.quantity}
                </span>
                <span className="font-medium text-ink">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between border-t border-border pt-4 text-[16px] font-semibold text-ink">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Processing...' : `Pay ${formatPrice(totalAmount)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}