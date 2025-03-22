export interface Invoice {
  id: string;
  status: "paid" | "not-paid";
  accountId: string;
  amount: number;
  currency: string;
}

export class InvoiceRepo {
  find(id: string): Promise<Invoice | undefined> {
    return Promise.resolve({
      id,
      status: "not-paid",
      accountId: "account-1",
      amount: 100,
      currency: "EUR",
    });
  }

  markAsPaid(id: string): Promise<void> {
    return Promise.resolve();
  }
}
