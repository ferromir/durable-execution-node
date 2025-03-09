export interface ChargeSession {
  id: string;
  status: "started" | "stopped" | "failed";
  chargePointId: string;
  kwh: number;
  cost: number;
  currency: string;
}

export class ChargingService {
  chargeSessions: Map<string, ChargeSession>;
  counter: number;
  tariff: number;

  constructor() {
    this.chargeSessions = new Map();
    this.counter = 0;
    this.tariff = 0.5;
  }

  start(chargePointId: string): Promise<ChargeSession> {
    const status = chargePointId === "charge-point-1" ? "started" : "failed";
    this.counter++;

    const chargeSession: ChargeSession = {
      id: `charge-session-${this.counter}`,
      status,
      chargePointId,
      kwh: 0,
      cost: 0,
      currency: "EUR",
    };

    this.chargeSessions.set(chargeSession.id, chargeSession);
    return Promise.resolve(chargeSession);
  }

  find(id: string): Promise<ChargeSession> {
    const chargeSession = this.chargeSessions.get(id)!;
    chargeSession.kwh += 1;
    chargeSession.cost = chargeSession.kwh * this.tariff;
    return Promise.resolve(chargeSession);
  }

  stop(id: string): Promise<ChargeSession> {
    const chargeSession = this.chargeSessions.get(id)!;
    chargeSession.status = "stopped";
    return Promise.resolve(chargeSession);
  }
}
