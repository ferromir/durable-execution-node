export class BikeService {
  unlock(bikeId: string): Promise<"success" | "failure"> {
    const result = bikeId === "bike-1" ? "success" : "failure";
    return Promise.resolve(result);
  }

  tariff(bikeId: string): Promise<number> {
    return Promise.resolve(0.5);
  }

  lock(bikeId: string): Promise<number> {
    const km = Math.random() * 10;
    return Promise.resolve(km);
  }
}
