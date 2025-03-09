export interface Payment {
  id: string;
  status: "refused" | "authorized" | "captured" | "cancelled";
  paymentToken: string;
  authorizedAmount: number;
  finalAmount: number;
  currency: string;
}

export class PaymentService {
  payments: Map<string, Payment>;
  counter: number;

  constructor() {
    this.payments = new Map();
    this.counter = 0;
  }

  authorize(
    paymentToken: string,
    amount: number,
    currency: string,
  ): Promise<Payment> {
    const status =
      paymentToken === "payment-token-1" ? "authorized" : "refused";

    this.counter++;

    const payment: Payment = {
      id: `payment-${this.counter}`,
      status,
      paymentToken,
      authorizedAmount: amount,
      finalAmount: 0,
      currency,
    };

    this.payments.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  capture(id: string, amount: number): Promise<Payment> {
    const payment = this.payments.get(id)!;
    payment.finalAmount = amount;
    payment.status = "captured";
    return Promise.resolve(payment);
  }

  cancel(id: string): Promise<Payment> {
    const payment = this.payments.get(id)!;
    payment.status = "cancelled";
    return Promise.resolve(payment);
  }
}
