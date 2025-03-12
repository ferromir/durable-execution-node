import { v4 as uuidv4 } from "uuid";

interface Payment {
  id: string;
  status: "rejected" | "authorized" | "captured" | "cancelled";
  terminalId: string;
  authorizationAmount: number;
  finalAmount: number;
  currency: string;
}

export class PaymentProvider {
  constructor() {}

  authorize(
    terminalId: string,
    amount: number,
    currency: string,
  ): Promise<Payment> {
    return Promise.resolve({
      id: uuidv4(),
      status: terminalId === "terminal-1" ? "authorized" : "rejected",
      terminalId,
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
