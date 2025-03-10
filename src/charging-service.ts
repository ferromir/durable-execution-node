import * as fs from "fs";

export interface ChargeSession {
  id: string;
  status: "started" | "stopped" | "failed";
  chargePointId: string;
  kwh: number;
  cost: number;
  currency: string;
}

export class ChargingService {
  counter: number;
  tariff: number;
  chargeSessions: Array<ChargeSession>;

  constructor() {
    this.counter = 0;
    this.tariff = 0.5;

    try {
      const data = fs.readFileSync("charge-sessions.json", {
        encoding: "utf-8",
      });
      this.chargeSessions = JSON.parse(data) as Array<ChargeSession>;
    } catch {
      fs.writeFileSync("charge-sessions.json", "[]", { encoding: "utf-8" });
      this.chargeSessions = new Array();
    }
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

    this.chargeSessions.push(chargeSession);

    fs.writeFileSync(
      "charge-sessions.json",
      JSON.stringify(this.chargeSessions, null, 2),
      {
        encoding: "utf-8",
      },
    );

    return Promise.resolve(chargeSession);
  }

  find(id: string): Promise<ChargeSession> {
    const chargeSession = this.chargeSessions.find((p) => p.id === id)!;
    chargeSession.kwh += 1;
    chargeSession.cost = chargeSession.kwh * this.tariff;

    fs.writeFileSync(
      "charge-sessions.json",
      JSON.stringify(this.chargeSessions, null, 2),
      {
        encoding: "utf-8",
      },
    );

    return Promise.resolve(chargeSession);
  }

  stop(id: string): Promise<ChargeSession> {
    const chargeSession = this.chargeSessions.find((p) => p.id === id)!;
    chargeSession.status = "stopped";

    fs.writeFileSync(
      "charge-sessions.json",
      JSON.stringify(this.chargeSessions, null, 2),
      {
        encoding: "utf-8",
      },
    );

    return Promise.resolve(chargeSession);
  }
}
