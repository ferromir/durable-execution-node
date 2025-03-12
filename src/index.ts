import express from "express";
import { PaymentService } from "./payment-service.ts";
import { AccountService } from "./account-service.ts";
import { InvoiceService } from "./invoice-service.ts";
import { WorkflowService } from "./workflow-service.ts";

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

app.post("/invoices/:invoiceId/collect", async (req, res) => {
  workflowService.collectPayment(req.params.invoiceId);
  res.send();
});

app.listen(port, () => {
  console.log(`durex app listening on port ${port}`);
});
