import express from "express";
import { PaymentApi } from "./payment-api.ts";
import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { InvoiceService } from "./invoice-service.ts";
import { makeClient } from "lidex";

const app = express();
app.use(express.json());
const port = 3000;
const accountRepo = new AccountRepo();
const invoiceRepo = new InvoiceRepo();
const paymentApi = new PaymentApi();
const invoiceService = new InvoiceService(accountRepo, invoiceRepo, paymentApi);
const handlers = new Map();

handlers.set(
  "collect-payment",
  invoiceService.collectPayment.bind(invoiceService),
);

const client = await makeClient({
  handlers,
  mongoUrl: "mongodb://localhost:27017/lidex?directConnection=true",
  now: () => new Date(),
});

app.post("/invoices/collect-all", async (req, res) => {
  const pool: Promise<boolean>[] = [];

  for (let i = 0; i < 100_000; i++) {
    const invoiceId = `invoice-${i}`;

    pool.push(
      client.start(
        `collect-payment-${invoiceId}`,
        "collect-payment",
        invoiceId,
      ),
    );
  }

  await Promise.all(pool);
  res.send();
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

const server = app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});

let stop = false;

process.on("SIGINT", () => {
  stop = true;
  server.close();
  process.exit();
});

await client.poll(() => stop);
