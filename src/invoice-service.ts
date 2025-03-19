import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { PaymentApi } from "./payment-api.ts";
import type { Context } from "lidex";

export class InvoiceService {
  accountRepo: AccountRepo;
  invoiceRepo: InvoiceRepo;
  paymentApi: PaymentApi;

  constructor(
    accountRepo: AccountRepo,
    invoiceRepo: InvoiceRepo,
    paymentApi: PaymentApi,
  ) {
    this.accountRepo = accountRepo;
    this.invoiceRepo = invoiceRepo;
    this.paymentApi = paymentApi;
  }

  async collectPayment(ctx: Context, invoiceId: string): Promise<void> {
    console.log("warming up...", invoiceId);
    await ctx.sleep("warmup", 10_000);

    console.log("collecting payment for invoice...", invoiceId);

    const invoice = await ctx.act("find-invoice", async () => {
      console.log("executing find-invoice...");
      return await this.invoiceRepo.find(invoiceId);
    });

    if (!invoice) {
      console.log("invoice not found", invoiceId);
      return;
    }

    if (invoice.status === "paid") {
      console.log("invoice already paid", invoiceId);
      return;
    }

    const account = await ctx.act("find-account", async () => {
      console.log("executing find-account...");
      return await this.accountRepo.find(invoice.accountId);
    });

    if (!account) {
      console.log("account not found", invoiceId);
      return;
    }

    for (let i = 0; i < 10; i++) {
      const success = await ctx.act(`capture-payment-${i}`, async () => {
        console.log(`executing capture-payment-${i}...`);
        return await this.paymentApi.capture(
          account.paymentToken,
          invoice.amount,
        );
      });

      if (success) {
        await ctx.act("mark-invoice-as-paid", async () => {
          await this.invoiceRepo.markAsPaid(invoice.id);
        });

        console.log("invoice paid", invoiceId);
        return;
      }

      console.log("capture failed, retry after pause...", invoiceId);
      await ctx.sleep(`sleep-${i}`, 20_000);
    }

    await ctx.act("block-account", async () => {
      console.log("executing block-account...");
      await this.accountRepo.block(account.id);
    });

    console.log("account blocked", invoiceId);
  }
}
