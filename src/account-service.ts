export interface Account {
  id: string;
  status: "active" | "blocked";
  paymentToken: string;
}

export class AccountService {
  find(id: string): Promise<Account | undefined> {
    return Promise.resolve({
      id,
      status: "active",
      paymentToken: "payment-token-1",
    });
  }

  block(id: string): Promise<void> {
    return Promise.resolve();
  }
}
