import { Collection, Db, MongoClient, ReturnDocument } from "mongodb";
import sleep from "sleep-promise";

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

export interface Action {
  id: string;
  workflowId: string;
  output: unknown;
  createdAt: Date;
}

// export class WorkflowContext {
//   id: string;
//   now: () => Date;

//   constructor(id: string, now: () => Date) {
//     this.id;
//     this.now = now;
//   }

//   step<T>(id: string, fn: () => Promise<T>): Promise<T> {
//     throw new Error("todo");
//   }

//   sleep(id: string, ms: number): Promise<void> {
//     throw new Error("todo");
//   }
// }

export interface WorkflowContext {
  input: unknown;
  act<T>(id: string, fn: () => Promise<T>): Promise<T>;
  sleep(id: string, ms: number): Promise<void>;
}

export type WorkflowFn = (wc: WorkflowContext) => Promise<void>;

export class Worker {
  now: () => Date;
  client: MongoClient;
  db: Db;
  workflows: Collection<Workflow>;
  actions: Collection<Action>;
  functions: Map<string, WorkflowFn>;
  waitMs: number;
  maxFailures: number;
  claimIntervalMs: number;

  constructor(mongoUrl: string, now: () => Date) {
    this.now = now;
    this.client = new MongoClient(mongoUrl);
    this.db = this.client.db("durex");
    this.workflows = this.db.collection("workflows");
    this.actions = this.db.collection("actions");
    this.functions = new Map();
    this.waitMs = 10_000;
    this.maxFailures = 3;
    this.claimIntervalMs = 1_000;
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
    this.functions = functions;
    this.workflows.createIndex({ id: 1 }, { unique: true });
    this.workflows.createIndex({ status: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1, failures: 1 });
    this.actions.createIndex({ id: 1, workflowId: 1 }, { unique: true });

    while (true) {
      const workflow = await this.claim();

      if (workflow) {
        console.log("workflow claimed:");
        console.log(JSON.stringify(workflow, null, 2));
        console.log("\n");
        this.run(workflow);
      } else {
        await sleep(this.claimIntervalMs);
      }
    }
  }

  async claim(): Promise<Workflow | null> {
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

    const workflow = await this.workflows.findOneAndUpdate(filter, update);
    return workflow;
  }

  async run(workflow: Workflow): Promise<void> {
    const act = async <T>(id: string, fn: () => Promise<T>) => {
      const filter = { id, workflowId: workflow.id };
      const existingAction = await this.actions.findOne(filter);

      if (existingAction) {
        return existingAction.output;
      }

      const output = await fn();

      const newAction: Action = {
        id,
        workflowId: workflow.id,
        output,
        createdAt: this.now(),
      };

      await this.actions.insertOne(newAction);

      if (!workflow.timeoutAt) {
        return;
      }

      // Extend the timeout further since we just had a successful action.
      const timeoutAt = new Date(workflow.timeoutAt.getTime() + this.waitMs);

      await this.workflows.updateOne(
        { id: workflow.id },
        { $set: { timeoutAt } },
      );
    };
    return Promise.resolve();
  }
}
