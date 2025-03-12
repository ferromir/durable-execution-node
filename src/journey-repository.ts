import { Session } from "./charging-service.ts";
import { Payment } from "./payment-service.ts";

export interface Journey {
  id: string;
  payment?: Payment;
  session?: Session;
}

export class JourneyRepository {
  save(journey: Journey): Promise<void> {
    // TODO: store in mongo
    return Promise.resolve();
  }
}
