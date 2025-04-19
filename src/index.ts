import { PaymentApi } from "./payment-api.ts";
import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { InvoiceService } from "./invoice-service.ts";
import { makeClient, makeWorker } from "lidex";
import { makeMongoPersistence } from "lidex-mongo";

const accountRepo = new AccountRepo();
const invoiceRepo = new InvoiceRepo();
const paymentApi = new PaymentApi();
const invoiceService = new InvoiceService(accountRepo, invoiceRepo, paymentApi);
const handlers = new Map();

handlers.set(
  "collect-payment",
  invoiceService.collectPayment.bind(invoiceService),
);

const persistence = makeMongoPersistence(
  "mongodb://localhost:27017/lidex?directConnection=true",
);

await persistence.init();
const client = await makeClient({ persistence });
const worker = await makeWorker({ persistence, handlers });

async function produceWorkflows(): Promise<void> {
  for (let i = 0; i < 100_000; i++) {
    const invoiceId = `invoice-${i}`;

    await client.start(
      `collect-payment-${invoiceId}`,
      "collect-payment",
      invoiceId,
    );
  }
}

let stop = false;

process.on("SIGINT", async () => {
  stop = true;
  await persistence.terminate();
  process.exit();
});

await Promise.all([produceWorkflows(), worker.poll(() => stop)]);
