import sleep from "sleep-promise";
import { AccountService } from "./account-service.ts";
import { InvoiceService } from "./invoice-service.ts";
import { PaymentService } from "./payment-service.ts";
import { WorkflowContext } from "./durex.ts";

export class WorkflowService {
  accountService: AccountService;
  invoiceService: InvoiceService;
  paymentService: PaymentService;

  constructor(
    accountService: AccountService,
    invoiceService: InvoiceService,
    paymentService: PaymentService,
  ) {
    this.accountService = accountService;
    this.invoiceService = invoiceService;
    this.paymentService = paymentService;
  }

  async collectPayment(wc: WorkflowContext, invoiceId: string): Promise<void> {
    console.log("collecting payment for invoice...", invoiceId);

    const invoice = await wc.step("find-invoice", async () => {
      return await this.invoiceService.find(invoiceId);
    });

    if (!invoice) {
      console.log("invoice not found", invoiceId);
      return;
    }

    if (invoice.status === "paid") {
      console.log("invoice already paid", invoiceId);
      return;
    }

    const account = await this.accountService.find(invoice.accountId);

    if (!account) {
      console.log("account not found", invoiceId);
      return;
    }

    for (let i = 0; i < 3; i++) {
      const success = await this.paymentService.capture(
        account.paymentToken,
        invoice.amount,
      );

      if (success) {
        await this.invoiceService.markAsPaid(invoice.id);
        console.log("invoice paid", invoiceId);
        return;
      }

      console.log("capture failed, retry after pause...", invoiceId);
      await wc.sleep(`sleep-${i}`, 10_000);
    }

    await this.accountService.block(account.id);
    console.log("account blocked", invoiceId);
  }
}
