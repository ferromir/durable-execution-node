import { Collection, Db, MongoClient, ReturnDocument } from "mongodb";

export type WorkflowStatus =
  | "idle"
  | "running"
  | "failed"
  | "finished"
  | "aborted";

export interface Workflow {
  id: string;
  functionName: string;
  input: unknown;
  status: WorkflowStatus;
  createdAt: Date;
  timeoutAt?: Date;
  finishedAt?: Date;
  abortedAt?: Date;
  failures?: number;
  error?: string;
}

export interface Step {
  id: string;
  workflowId: string;
  output: unknown;
  createdAt: Date;
}

export interface Timeout {
  createdAt: Date;
}

export class WorkflowContext {
  id: string;
  now: () => Date;

  constructor(id: string, now: () => Date) {
    this.id;
    this.now = now;
  }

  step<T>(id: string, fn: () => Promise<T>): Promise<T> {
    throw new Error("todo");
  }

  sleep(id: string, ms: number): Promise<void> {
    throw new Error("todo");
  }
}

export type WorkflowFn = (wc: WorkflowContext, input: unknown) => Promise<void>;

export class Worker {
  now: () => Date;
  client: MongoClient;
  db: Db;
  workflows: Collection<Workflow>;
  steps: Collection<Step>;
  timeouts: Collection<Timeout>;
  functions: Map<string, WorkflowFn>;
  waitMs: number;
  maxFailures: number;

  constructor(mongoUrl: string, now: () => Date) {
    this.now = now;
    this.client = new MongoClient(mongoUrl);
    this.db = this.client.db("durex");
    this.workflows = this.db.collection("workflows");
    this.steps = this.db.collection("steps");
    this.timeouts = this.db.collection("timeouts");
    this.functions = new Map();
    this.waitMs = 10_000;
    this.maxFailures = 3;
  }

  async create(
    id: string,
    functionName: string,
    input: unknown,
  ): Promise<void> {
    console.log("creating workflow...");

    const workflow: Workflow = {
      id,
      functionName,
      input,
      status: "idle",
      createdAt: this.now(),
    };

    await this.workflows.insertOne(workflow);
  }

  async init(functions: Map<string, WorkflowFn>): Promise<void> {
    console.log("initializing worker...");
    this.functions = functions;

    this.workflows.createIndex({ id: 1 }, { unique: true });
    this.workflows.createIndex({ status: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1, failures: 1 });
    this.steps.createIndex({ id: 1, workflowId: 1 }, { unique: true });

    this.client = await this.client.connect();
    const changeStream = this.workflows.watch();

    for await (const _change of changeStream) {
      await this.claim();
    }

    await changeStream.close();
    await this.client.close();
  }

  async claim(): Promise<void> {
    console.log("claiming workflow...");
    const now = this.now();
    const timeoutAt = new Date(now.getTime() + this.waitMs);

    const filter = {
      $or: [
        {
          status: "idle" as WorkflowStatus,
        },
        {
          status: "running" as WorkflowStatus,
          timeoutAt: { $lt: now },
        },
        {
          status: "failed" as WorkflowStatus,
          timeoutAt: { $lt: now },
          failures: { $lt: this.maxFailures },
        },
      ],
    };

    const update = {
      $set: {
        status: "running" as WorkflowStatus,
        timeoutAt,
      },
    };

    const workflow = await this.workflows.findOneAndUpdate(filter, update, {
      returnDocument: ReturnDocument.AFTER,
    });

    if (!workflow) {
      return;
    }

    console.log(JSON.stringify(workflow, null, 2) + `\n ${this.now()}`);

    const timeout: Timeout = { createdAt: now };
    await this.timeouts.insertOne(timeout);
  }

  async run(workflow: Workflow): Promise<void> {
    console.log("running workflow...");
    throw new Error("todo");
  }
}
