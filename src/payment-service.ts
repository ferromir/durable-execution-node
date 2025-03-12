export class PaymentService {
  capture(paymentToken: string): Promise<boolean> {
    return Promise.resolve(Math.random() < 0.5);
  }
}
