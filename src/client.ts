import { makeClient } from "lidex";
import { makeMongoPersistence } from "lidex-mongo";

const persistence = makeMongoPersistence(
  "mongodb://localhost:27017/lidex?directConnection=true",
);

await persistence.init();
const client = await makeClient({ persistence });

async function produceWorkflows(): Promise<void> {
  for (let i = 0; i < 100_000; i++) {
    const invoiceId = `invoice-${i}`;

    await client.start(
      `collect-payment-${invoiceId}`,
      "collect-payment",
      invoiceId,
    );
  }
}

process.on("SIGINT", async () => {
  await persistence.terminate();
  process.exit();
});

await produceWorkflows();
await persistence.terminate();
process.exit();
