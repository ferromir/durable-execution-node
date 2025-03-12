import { v4 as uuidv4 } from "uuid";

export interface Payment {
  id: string;
  status: "rejected" | "authorized" | "captured" | "cancelled";
  token: string;
  authorizationAmount: number;
  finalAmount: number;
  currency: string;
}

export class PaymentService {
  constructor() {}

  authorize(token: string, amount: number, currency: string): Promise<Payment> {
    return Promise.resolve({
      id: uuidv4(),
      status: "authorized",
      token,
      authorizationAmount: amount,
      finalAmount: 0,
      currency,
    });
  }

  capture(payment: Payment, amount: number): Promise<Payment> {
    payment.status = "captured";
    payment.finalAmount = amount;
    return Promise.resolve(payment);
  }

  cancel(payment: Payment): Promise<Payment> {
    payment.status = "cancelled";
    return Promise.resolve(payment);
  }
}
