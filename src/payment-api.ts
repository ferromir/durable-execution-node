export class PaymentApi {
  // Only 10% of chances of a successful capture, for the sake of the test
  capture(paymentToken: string, amount: number): Promise<boolean> {
    return Promise.resolve(Math.random() < 0.1);
  }
}
