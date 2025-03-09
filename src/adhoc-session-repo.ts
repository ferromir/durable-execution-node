import type { ChargeSession } from "./charging-service.ts";
import type { Payment } from "./payment-service.ts";

export interface AdhocSession {
  id: string;
  chargePointId: string;
  paymentToken: string;
  payment?: Payment;
  chargeSession?: ChargeSession;
}

export class AdhocSessionRepo {
  adhocSessions: Map<string, AdhocSession>;
  counter: number;

  constructor() {
    this.adhocSessions = new Map();
    this.counter = 0;
  }

  find(id: string): Promise<AdhocSession> {
    return Promise.resolve(this.adhocSessions.get(id)!);
  }

  create(chargePointId: string, paymentToken: string): Promise<AdhocSession> {
    this.counter += 1;

    const adhocSession: AdhocSession = {
      id: `adhoc-session-${this.counter}`,
      chargePointId,
      paymentToken,
    };

    this.adhocSessions.set(adhocSession.id, adhocSession);
    console.log(JSON.stringify(adhocSession, null, 2));
    return Promise.resolve(adhocSession);
  }

  updatePayment(id: string, payment: Payment): Promise<AdhocSession> {
    const adhocSession = this.adhocSessions.get(id)!;
    adhocSession.payment = payment;
    console.log(JSON.stringify(adhocSession, null, 2));
    return Promise.resolve(adhocSession);
  }

  updateChargeSession(
    id: string,
    chargeSession: ChargeSession,
  ): Promise<AdhocSession> {
    const adhocSession = this.adhocSessions.get(id)!;
    adhocSession.chargeSession = chargeSession;
    console.log(JSON.stringify(adhocSession, null, 2));
    return Promise.resolve(adhocSession);
  }
}
