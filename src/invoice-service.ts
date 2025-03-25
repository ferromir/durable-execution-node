import { AccountRepo } from "./account-repo.ts";
import { InvoiceRepo } from "./invoice-repo.ts";
import { PaymentApi } from "./payment-api.ts";
import type { Context } from "lidex";
import pino from "pino";

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

  // This worflow simulates collecting a payment for a given invoice
  async collectPayment(ctx: Context, invoiceId: string): Promise<void> {
    const log = pino();

    const invoice = await ctx.step("find-invoice", async () => {
      log.info(`${invoiceId} - finding invoice`);
      return await this.invoiceRepo.find(invoiceId);
    });

    if (!invoice) {
      log.info(`${invoiceId} - invoice not found`);
      return;
    }

    if (invoice.status === "paid") {
      log.info(`${invoiceId} - invoice already paid`);
      return;
    }

    const account = await ctx.step("find-account", async () => {
      log.info(`${invoiceId} - finding account`);
      return await this.accountRepo.find(invoice.accountId);
    });

    if (!account) {
      log.info(`${invoiceId} - account not found`);
      return;
    }

    // Retry up to 10 times
    for (let i = 0; i < 10; i++) {
      const success = await ctx.step(`capture-payment-${i}`, async () => {
        log.info(`${invoiceId} - capturing payment ${i}`);
        return await this.paymentApi.capture(
          account.paymentToken,
          invoice.amount,
        );
      });

      if (success) {
        await ctx.step("mark-invoice-as-paid", async () => {
          log.info(`${invoiceId} - mark invoice as paid`);
          await this.invoiceRepo.markAsPaid(invoice.id);
        });

        return;
      }

      // add jitter so wake-up time is more distribured among workflows
      await ctx.sleep(`sleep-${i}`, 10_000 + Math.random() * 1_000);
    }

    await ctx.step("block-account", async () => {
      log.info(`${invoiceId} - blocking account`);
      await this.accountRepo.block(account.id);
    });
  }
}
