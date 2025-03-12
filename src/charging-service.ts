import { v4 as uuidv4 } from "uuid";

interface Session {
  id: string;
  status: "failed" | "started" | "stopped";
  chargePointId: string;
  kwh: number;
  cost: number;
  currency: string;
}

interface Tariff {
  rate: number;
  currency: string;
}

export class ChargingService {
  constructor() {}

  tariff(chargePointId: string): Promise<Tariff> {
    return Promise.resolve({ rate: 1, currency: "EUR" });
  }

  start(chargePointId: string): Promise<Session> {
    return Promise.resolve({
      id: uuidv4(),
      status: chargePointId === "charge-point-1" ? "started" : "failed",
      chargePointId,
      kwh: 0,
      cost: 0,
      currency: "EUR",
    });
  }

  stop(session: Session): Promise<Session> {
    session.status = "stopped";
    return Promise.resolve(session);
  }
}
