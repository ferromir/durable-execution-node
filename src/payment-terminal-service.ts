import { v4 as uuidv4 } from "uuid";

export interface CardRead {
  terminalId: string;
  cardHash: string;
}

export interface Payment {
  id: string;
  status: "refused" | "authorized" | "captured" | "cancelled";
  authorizedAmount: number;
  finalAmount: number;
  currency: string;
  terminalId: string;
  cardHash: string;
}

export class PaymentTerminalService {
  baseUrl: string;
  payments: Map<string, Payment>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.payments = new Map();
  }

  authorize(
    terminalId: string,
    amount: number,
    currency: string,
    cardHash: string,
  ): Promise<Payment> {
    const status = terminalId === "terminal-1" ? "authorized" : "refused";

    const payment: Payment = {
      id: uuidv4(),
      status,
      authorizedAmount: amount,
      finalAmount: 0,
      currency,
      terminalId,
      cardHash,
    };

    this.payments.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  capture(id: string, amount: number): Promise<Payment> {
    const payment = this.payments.get(id);

    if (!payment) {
      throw new Error("payment not found");
    }

    payment.finalAmount = amount;
    payment.status = "captured";
    return Promise.resolve(payment);
  }

  cancel(id: string): Promise<Payment> {
    const payment = this.payments.get(id);

    if (!payment) {
      throw new Error("payment not found");
    }

    payment.status = "cancelled";
    return Promise.resolve(payment);
  }
}
