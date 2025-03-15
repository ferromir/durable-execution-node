import express from "express";
import { PaymentService } from "./payment-service.ts";
import { AccountService } from "./account-service.ts";
import { InvoiceService } from "./invoice-service.ts";
import { WorkflowService } from "./workflow-service.ts";
import type { WorkflowContext } from "./durex.ts";
import { Worker } from "./durex.ts";

const app = express();
app.use(express.json());
const port = 3000;
const accountService = new AccountService();
const invoiceService = new InvoiceService();
const paymentService = new PaymentService();

const workflowService = new WorkflowService(
  accountService,
  invoiceService,
  paymentService,
);

const worker = new Worker(
  "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true",
  () => new Date(),
  new Map(),
);

app.post("/invoices/:invoiceId/collect", async (req, res) => {
  workflowService.collectPayment({} as WorkflowContext, req.params.invoiceId);
  res.send();
});

app.post("/test", async (req, res) => {
  await worker.create("workflow-1", "function-1", "invoice-1");
  res.send();
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});

await worker.init();
