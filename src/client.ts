import { makeClient } from "lidex";
import { makeMongoPersistence } from "lidex-mongo";

const url = "mongodb://localhost:27017/lidex?directConnection=true";
const persistence = makeMongoPersistence(url);
await persistence.init();
const client = await makeClient(persistence);
const skip = Number(process.argv[2]) || 0;
const limit = Number(process.argv[3]) || 1_000_000;

async function produceWorkflows(): Promise<void> {
  for (let i = skip; i < limit; i++) {
    const invoiceId = `invoice-${i}`;

    const created = await client.start(
      `collect-payment-${invoiceId}`,
      "collect-payment",
      invoiceId,
    );

    console.log(`collect-payment-${invoiceId}: ${created}`);
  }
}

process.on("SIGINT", async () => {
  await persistence.terminate();
  process.exit();
});

await produceWorkflows();
await persistence.terminate();
process.exit();
