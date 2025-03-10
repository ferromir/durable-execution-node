import { v4 as uuidv4 } from "uuid";

interface Payment {
  id: string;
  result: "authorized" | "rejected";
}

export class PaymentService {
  authorize(
    paymentToken: string,
    amount: number,
    currency: string,
  ): Promise<Payment> {
    const result =
      paymentToken === "payment-token-1" ? "authorized" : "rejected";

    return Promise.resolve({
      id: uuidv4(),
      result,
    });
  }

  capture(id: string, amount: number): Promise<void> {
    return Promise.resolve();
  }

  cancel(id: string): Promise<void> {
    return Promise.resolve();
  }
}

// export interface Payment {
//   id: string;
//   status: "failed" | "authorized" | "captured" | "cancelled";
//   paymentToken: string;
//   authorizedAmount: number;
//   finalAmount: number;
//   currency: string;
// }

// export class PaymentService {
//   constructor() {}

//   authorize(
//     paymentToken: string,
//     amount: number,
//     currency: string,
//   ): Promise<Payment> {
//     const status = paymentToken === "payment-token-1" ? "authorized" : "failed";

//     const payment: Payment = {
//       id: uuidv4(),
//       status,
//       paymentToken,
//       authorizedAmount: amount,
//       finalAmount: 0,
//       currency,
//     };

//     return Promise.resolve(payment);
//   }

//   capture(payment: Payment, amount: number): Promise<Payment> {
//     payment.finalAmount = amount;
//     payment.status = "captured";
//     return Promise.resolve(payment);
//   }

//   cancel(payment: Payment): Promise<Payment> {
//     payment.status = "cancelled";
//     return Promise.resolve(payment);
//   }
// }
