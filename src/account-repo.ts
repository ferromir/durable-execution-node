export interface Account {
  id: string;
  paymentToken: string;
}

export class AccountRepo {
  find(id: string): Promise<Account | undefined> {
    return Promise.resolve({
      id,
      paymentToken: "payment-token-1",
    });
  }

  block(id: string): Promise<void> {
    return Promise.resolve();
  }
}
