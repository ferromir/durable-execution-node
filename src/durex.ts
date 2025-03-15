import { Collection, Db, MongoClient } from "mongodb";
import goSleep from "sleep-promise";

type WorkflowStatus = "idle" | "running" | "failed" | "finished" | "aborted";

interface Workflow {
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

interface Action {
  id: string;
  workflowId: string;
  output: unknown;
  createdAt: Date;
}

interface Nap {
  id: string;
  workflowId: string;
  wakeUpAt: Date;
  createdAt: Date;
}

export interface WorkflowContext {
  input: unknown;
  act<T>(id: string, fn: () => Promise<T>): Promise<T>;
  sleep(id: string, ms: number): Promise<void>;
}

type WorkflowFn = (wc: WorkflowContext) => Promise<void>;

export class Worker {
  now: () => Date;
  client: MongoClient;
  db: Db;
  workflows: Collection<Workflow>;
  actions: Collection<Action>;
  naps: Collection<Nap>;
  functions: Map<string, WorkflowFn>;
  maxFailures: number;
  timeoutIntervalMs: number;
  claimIntervalMs: number;

  constructor(
    mongoUrl: string,
    now: () => Date,
    functions: Map<string, WorkflowFn>,
  ) {
    this.now = now;
    this.client = new MongoClient(mongoUrl);
    this.db = this.client.db("durex");
    this.workflows = this.db.collection("workflows");
    this.actions = this.db.collection("actions");
    this.naps = this.db.collection("naps");
    this.functions = functions;

    // TODO: pass via config
    this.maxFailures = 3;
    this.timeoutIntervalMs = 60_000;
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

  async init(): Promise<void> {
    this.workflows.createIndex({ id: 1 }, { unique: true });
    this.workflows.createIndex({ status: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1, failures: 1 });
    this.actions.createIndex({ id: 1, workflowId: 1 }, { unique: true });
    this.naps.createIndex({ id: 1, workflowId: 1 }, { unique: true });

    while (true) {
      const workflow = await this.claim();

      if (workflow) {
        console.log("workflow claimed:");
        console.log(JSON.stringify(workflow, null, 2));
        console.log("\n");

        // Intentionally not awaiting, otherwise
        // a sleeping workflow would block others
        // from running.
        this.run(workflow);
      } else {
        await goSleep(this.claimIntervalMs);
      }
    }
  }

  private async claim(): Promise<Workflow | null> {
    const now = this.now();
    const timeoutAt = new Date(now.getTime() + this.timeoutIntervalMs);

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

  private async run(workflow: Workflow): Promise<void> {
    const act = async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const filter = { id, workflowId: workflow.id };
      const existingAction = await this.actions.findOne(filter);

      if (existingAction) {
        return existingAction.output as T;
      }

      const output = await fn();

      const newAction: Action = {
        id,
        workflowId: workflow.id,
        output,
        createdAt: this.now(),
      };

      await this.actions.insertOne(newAction);
      const timeoutAt = new Date(this.now().getTime() + this.timeoutIntervalMs);

      await this.workflows.updateOne(
        { id: workflow.id },
        { $set: { timeoutAt } },
      );

      return output;
    };

    const sleep = async (id: string, ms: number): Promise<void> => {
      const filter = { id, workflowId: workflow.id };
      const existingNap = await this.naps.findOne(filter);
      const now = this.now();

      if (!existingNap) {
        const nap: Nap = {
          id,
          workflowId: workflow.id,
          wakeUpAt: new Date(now.getTime() + ms),
          createdAt: now,
        };

        await this.naps.insertOne(nap);
        await goSleep(ms);
        return;
      }

      const remainingMs = existingNap.wakeUpAt.getTime() - now.getTime();

      if (remainingMs > 0) {
        await goSleep(remainingMs);
        return;
      }
    };

    const wc: WorkflowContext = {
      input: workflow.input,
      act,
      sleep,
    };

    const fn = this.functions.get(workflow.functionName);

    if (!fn) {
      throw new Error(`function not found: ${workflow.functionName}`);
    }

    try {
      await fn(wc);
    } catch (err) {
      let error = "";

      if (err instanceof Error) {
        error = err.message;
      } else {
        error = JSON.stringify(err);
      }

      const failures = (workflow.failures || 0) + 1;

      const status: WorkflowStatus =
        failures < this.maxFailures ? "failed" : "aborted";

      const filter = { id: workflow.id };
      const update = { $set: { status, error, failures } };
      await this.workflows.updateOne(filter, update);
    }
  }
}
