export interface ChargePoint {
  id: string;
  terminalId: string;
  currency: string;
  status: "charging" | "available" | "unavailable";
  tariff: number;
}

export interface ChargeSession {
  id: string;
  status: "started" | "stopped";
  chargePointId: string;
  kwh: number;
  cost: number;
}

export class ChargingService {
  chargePoints: Array<ChargePoint>;
  chargeSessions: Array<ChargeSession>;

  constructor() {}
}
