import sleep from "sleep-promise";
import { ChargingService } from "./charging-service.ts";
import { PaymentService } from "./payment-service.ts";
import type { AdhocSession } from "./adhoc-session-repo.ts";
import { AdhocSessionRepo } from "./adhoc-session-repo.ts";

export class AdhocService {
  chargingService: ChargingService;
  paymentService: PaymentService;
  adhocSessionRepo: AdhocSessionRepo;
  authorizationAmount: number;

  constructor(
    chargingService: ChargingService,
    paymentService: PaymentService,
    adhocSessionRepo: AdhocSessionRepo,
  ) {
    this.chargingService = chargingService;
    this.paymentService = paymentService;
    this.adhocSessionRepo = adhocSessionRepo;
    this.authorizationAmount = 10;
  }

  async start(adhocSession: AdhocSession): Promise<void> {
    let payment = await this.paymentService.authorize(
      adhocSession.paymentToken,
      this.authorizationAmount,
      "EUR",
    );

    adhocSession = await this.adhocSessionRepo.updatePayment(
      adhocSession.id,
      payment,
    );

    if (payment.status === "refused") {
      return;
    }

    let chargeSession = await this.chargingService.start(
      adhocSession.chargePointId,
    );

    adhocSession = await this.adhocSessionRepo.updateChargeSession(
      adhocSession.id,
      chargeSession,
    );

    if (chargeSession.status === "failed") {
      payment = await this.paymentService.cancel(payment.id);
      this.adhocSessionRepo.updatePayment(adhocSession.id, payment);
      return;
    }

    while (chargeSession.cost < this.authorizationAmount * 0.9) {
      await sleep(5000);
      chargeSession = await this.chargingService.find(chargeSession.id);

      adhocSession = await this.adhocSessionRepo.updateChargeSession(
        adhocSession.id,
        chargeSession,
      );
    }

    chargeSession = await this.chargingService.stop(chargeSession.id);

    adhocSession = await this.adhocSessionRepo.updateChargeSession(
      adhocSession.id,
      chargeSession,
    );

    payment = await this.paymentService.capture(payment.id, chargeSession.cost);

    adhocSession = await this.adhocSessionRepo.updatePayment(
      adhocSession.id,
      payment,
    );

    console.log("start finished", JSON.stringify(adhocSession, null, 2));
  }

  async stop(id: string): Promise<void> {
    let adhocSession = await this.adhocSessionRepo.find(id);

    const chargingSession = await this.chargingService.stop(
      adhocSession.chargeSession?.id!,
    );

    adhocSession = await this.adhocSessionRepo.updateChargeSession(
      adhocSession.id,
      chargingSession,
    );

    const payment = await this.paymentService.capture(
      adhocSession.payment?.id!,
      chargingSession.cost,
    );

    adhocSession = await this.adhocSessionRepo.updatePayment(
      adhocSession.id,
      payment,
    );

    console.log("stop finished", JSON.stringify(adhocSession, null, 2));
  }
}
