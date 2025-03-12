export class PaymentService {
  capture(paymentToken: string, amount: number): Promise<boolean> {
    return Promise.resolve(Math.random() < 0.5);
  }
}
