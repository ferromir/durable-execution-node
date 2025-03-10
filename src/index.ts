import express from "express";
import { z } from "zod";
import { BikeService } from "./bike-service.ts";
import { PaymentService } from "./payment-service.ts";
import { SessionService } from "./session-service.ts";

const app = express();
app.use(express.json());

const port = 3000;
const bikeService = new BikeService();
const paymentService = new PaymentService();
const sessionService = new SessionService(bikeService, paymentService);

const startSchema = z.object({
  bikeId: z.string(),
  paymentToken: z.string(),
});

app.post("/start", async (req, res) => {
  const payload = startSchema.parse(req.body);
  const { bikeId, paymentToken } = payload;
  sessionService.start(bikeId, paymentToken);
  res.send();
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});
