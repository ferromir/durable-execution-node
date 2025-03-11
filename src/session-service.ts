import sleep from "sleep-promise";
import { BikeService } from "./bike-service.ts";
import { PaymentService } from "./payment-service.ts";

export class SessionService {
  bikeService: BikeService;
  paymentService: PaymentService;

  constructor(bikeService: BikeService, paymentService: PaymentService) {
    this.bikeService = bikeService;
    this.paymentService = paymentService;
  }

  async start(bikeId: string, paymentToken: string): Promise<void> {
    console.log("retrieving tariff...");
    const tariff = await this.bikeService.tariff(bikeId);

    console.log("authorizing payment...");
    const payment = await this.paymentService.authorize(
      paymentToken,
      100,
      tariff.currency,
    );

    if (payment.result === "rejected") {
      return;
    }

    console.log("unlocking bike...");
    const result = await this.bikeService.unlock(bikeId);

    if (result === "failure") {
      console.log("canceling payment...");
      await this.paymentService.cancel(payment.id);

      console.log("done!");
      return;
    }

    await sleep(30_000);

    console.log("retrieving usage...");
    const usage = await this.bikeService.usage(bikeId);

    console.log("locking bike...");
    await this.bikeService.lock(bikeId);

    const captureAmount = usage * tariff.amount;

    console.log("capturing payment...");
    await this.paymentService.capture(payment.id, captureAmount);

    console.log("done!");
  }
}
