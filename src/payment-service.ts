import * as fs from "fs";

export interface Payment {
  id: string;
  status: "refused" | "authorized" | "captured" | "cancelled";
  paymentToken: string;
  authorizedAmount: number;
  finalAmount: number;
  currency: string;
}

export class PaymentService {
  counter: number;
  payments: Array<Payment>;

  constructor() {
    this.counter = 0;

    try {
      const data = fs.readFileSync("payments.json", { encoding: "utf-8" });
      this.payments = JSON.parse(data) as Array<Payment>;
    } catch {
      fs.writeFileSync("payments.json", "[]", { encoding: "utf-8" });
      this.payments = new Array();
    }
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

    this.payments.push(payment);

    fs.writeFileSync("payments.json", JSON.stringify(this.payments, null, 2), {
      encoding: "utf-8",
    });

    return Promise.resolve(payment);
  }

  capture(id: string, amount: number): Promise<Payment> {
    const payment = this.payments.find((p) => p.id === id)!;
    payment.finalAmount = amount;
    payment.status = "captured";

    fs.writeFileSync("payments.json", JSON.stringify(this.payments, null, 2), {
      encoding: "utf-8",
    });

    return Promise.resolve(payment);
  }

  cancel(id: string): Promise<Payment> {
    const payment = this.payments.find((p) => p.id === id)!;
    payment.status = "cancelled";

    fs.writeFileSync("payments.json", JSON.stringify(this.payments, null, 2), {
      encoding: "utf-8",
    });

    return Promise.resolve(payment);
  }
}
