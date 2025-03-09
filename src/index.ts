import express from "express";
import { ChargingService } from "./charging-service.ts";
import { PaymentService } from "./payment-service.ts";
import { z } from "zod";
import { AdhocService } from "./adhoc-service.ts";
import { AdhocSessionRepo } from "./adhoc-session-repo.ts";

const app = express();
app.use(express.json());

const port = 3000;
const chargingService = new ChargingService();
const paymentService = new PaymentService();
const adhocSessionRepo = new AdhocSessionRepo();

const adhocService = new AdhocService(
  chargingService,
  paymentService,
  adhocSessionRepo,
);

const startSchema = z.object({
  chargePointId: z.string(),
  paymentToken: z.string(),
});

app.post("/adhoc-sessions", async (req, res) => {
  const payload = startSchema.parse(req.body);
  const { chargePointId, paymentToken } = payload;

  const adhocSession = await adhocSessionRepo.create(
    chargePointId,
    paymentToken,
  );

  adhocService.start(adhocSession);
  res.send(adhocSession);
});

app.post("/adhoc-sessions/:id/stop", async (req, res) => {
  const id = req.params.id;
  adhocService.stop(id);
  res.send();
});

app.get("/adhoc-sessions/:id", async (req, res) => {
  const id = req.params.id;
  const adhocSession = await adhocSessionRepo.find(id);
  res.send(adhocSession);
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});
