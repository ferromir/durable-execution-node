import { PaymentApi } from "./payment-api.ts";
import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { InvoiceService } from "./invoice-service.ts";
import { makeWorker } from "lidex";
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
const worker = await makeWorker({ persistence, handlers });
let stop = false;

process.on("SIGINT", async () => {
  stop = true;
  await persistence.terminate();
  process.exit();
});

await worker.poll(() => stop);
