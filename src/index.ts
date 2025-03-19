import express from "express";
import { PaymentApi } from "./payment-api.ts";
import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { InvoiceService } from "./invoice-service.ts";
import { createClient } from "lidex";

const app = express();
app.use(express.json());
const port = 3000;
const accountRepo = new AccountRepo();
const invoiceRepo = new InvoiceRepo();
const paymentApi = new PaymentApi();
const invoiceService = new InvoiceService(accountRepo, invoiceRepo, paymentApi);
const functions = new Map();

functions.set(
  "collect-payment",
  invoiceService.collectPayment.bind(invoiceService),
);

const client = await createClient({
  functions,
  mongoUrl: "mongodb://localhost:27017/lidex?directConnection=true",
  timeoutIntervalMs: 10_000,
});

app.post("/invoices/:invoiceId/collect", async (req, res) => {
  const invoiceId = req.params.invoiceId;

  await client.start(
    `collect-payment-${invoiceId}`,
    "collect-payment",
    invoiceId,
  );

  res.send();
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});

await client.poll();
