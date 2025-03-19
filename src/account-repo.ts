export interface Account {
  id: string;
  paymentToken: string;
}

export class AccountRepo {
  find(id: string): Promise<Account | undefined> {
    console.log("find account", id);

    return Promise.resolve({
      id,
      paymentToken: "payment-token-1",
    });
  }

  block(id: string): Promise<void> {
    console.log("block account", id);
    return Promise.resolve();
  }
}
