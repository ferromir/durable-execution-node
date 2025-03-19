export class PaymentApi {
  capture(paymentToken: string, amount: number): Promise<boolean> {
    console.log("capture payment", paymentToken, amount);
    return Promise.resolve(Math.random() < 0.25);
  }
}
