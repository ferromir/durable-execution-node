import sleep from "sleep-promise";
import { PaymentService } from "./payment-service.ts";
import { ChargingService } from "./charging-service.ts";
import { JourneyRepository } from "./journey-repository.ts";

export class WorkflowService {
  paymentService: PaymentService;
  chargingService: ChargingService;
  journeyRepository: JourneyRepository;

  constructor(
    paymentService: PaymentService,
    chargingService: ChargingService,
    journeyRepository: JourneyRepository,
  ) {
    this.paymentService = paymentService;
    this.chargingService = chargingService;
    this.journeyRepository = journeyRepository;
  }

  async startJourney(bikeId: string, paymentToken: string): Promise<void> {}
}
