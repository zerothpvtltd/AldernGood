export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardholderName: string;
}

export interface PaymentResult {
  status: 'paid' | 'failed';
  reference: string;
  last4: string;
  message?: string;
}

export interface PaymentProcessor {
  processPayment(amountCents: number, cardDetails: CardDetails): Promise<PaymentResult>;
}

class MockPaymentService implements PaymentProcessor {
  async processPayment(amountCents: number, cardDetails: CardDetails): Promise<PaymentResult> {
    const normalized = cardDetails.cardNumber.replace(/\s+/g, '');
    const last4 = normalized.slice(-4);
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    if (amountCents <= 0) {
      return {
        status: 'failed',
        reference,
        last4,
        message: 'Charge amount must be greater than zero.',
      };
    }

    if (normalized === '4242424242424242') {
      return {
        status: 'paid',
        reference,
        last4,
      };
    }

    if (normalized === '4000000000000002') {
      return {
        status: 'failed',
        reference,
        last4,
        message: 'Your card was declined by the issuing bank. Please use another test card.',
      };
    }

    return {
      status: 'failed',
      reference,
      last4,
      message: 'Unsupported test card. Use 4242 4242 4242 4242 for approval or 4000 0000 0000 0002 to simulate decline.',
    };
  }
}

export const paymentService: PaymentProcessor = new MockPaymentService();