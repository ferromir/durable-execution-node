export class PaymentService {
  authorize(
    token: string,
    amount: number,
    currency: string,
  ): Promise<"authorized" | "rejected"> {
    const result = token === "token-1" ? "authorized" : "rejected";
    return Promise.resolve(result);
  }

  capture(token: string, amount: number): Promise<void> {
    return Promise.resolve();
  }

  cancel(token: string): Promise<void> {
    return Promise.resolve();
  }
}
