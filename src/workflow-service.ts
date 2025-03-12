import sleep from "sleep-promise";
import { AccountService } from "./account-service.ts";
import { InvoiceService } from "./invoice-service.ts";
import { PaymentService } from "./payment-service.ts";

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

  async collectPayment(invoiceId: string): Promise<void> {
    console.log("collecting invoice...", invoiceId);

    const invoice = await this.invoiceService.find(invoiceId);

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
      const success = await this.paymentService.capture(account.paymentToken);

      if (success) {
        await this.invoiceService.markAsPaid(invoice.id);
        console.log("invoice paid", invoiceId);
        return;
      }

      console.log("capture failed, retry after pause...", invoiceId);
      await sleep(10000);
    }

    console.log("account blocked", invoiceId);
    await this.accountService.block(account.id);
  }
}
