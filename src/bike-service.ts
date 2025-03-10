export interface Tariff {
  amount: number;
  currency: string;
}

export class BikeService {
  unlock(bikeId: string): Promise<"success" | "failure"> {
    const result = bikeId === "bike-1" ? "success" : "failure";
    return Promise.resolve(result);
  }

  tariff(bikeId: string): Promise<Tariff> {
    return Promise.resolve({
      amount: 0.5,
      currency: "EUR",
    });
  }

  usage(bikeId: string): Promise<number> {
    const km = Math.random() * 10;
    return Promise.resolve(km);
  }

  lock(bikeId: string): Promise<void> {
    return Promise.resolve();
  }
}
