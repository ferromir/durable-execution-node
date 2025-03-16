import { Collection, Db, MongoClient } from "mongodb";
import goSleep from "sleep-promise";

type Status =
  | "idle"
  | "running"
  | "sleeping"
  | "failed"
  | "finished"
  | "aborted";

interface Workflow {
  id: string;
  functionName: string;
  input: unknown;
  status: Status;
  timeoutAt?: Date;
  actions?: { [key: string]: unknown };
  naps?: { [key: string]: Date };
  failures?: number;
  lastError?: string;
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
  functions: Map<string, WorkflowFn>;
  maxFailures: number;
  timeoutIntervalMs: number;
  pollIntervalMs: number;

  constructor(
    mongoUrl: string,
    now: () => Date,
    functions: Map<string, WorkflowFn>,
    maxFailures: number,
    timeoutIntervalMs: number,
    pollIntervalMs: number,
  ) {
    this.now = now;
    this.client = new MongoClient(mongoUrl);
    this.db = this.client.db("durex");
    this.workflows = this.db.collection("workflows");
    this.functions = functions;
    this.maxFailures = maxFailures;
    this.timeoutIntervalMs = timeoutIntervalMs;
    this.pollIntervalMs = pollIntervalMs;
  }

  async create(
    id: string,
    functionName: string,
    input: unknown,
  ): Promise<void> {
    const workflow: Workflow = {
      id,
      functionName,
      input,
      status: "idle",
    };

    await this.workflows.insertOne(workflow);
  }

  async init(): Promise<void> {
    this.workflows.createIndex({ id: 1 }, { unique: true });
    this.workflows.createIndex({ status: 1 });
    this.workflows.createIndex({ status: 1, timeoutAt: 1 });

    while (true) {
      const workflowId = await this.claim();

      if (workflowId) {
        // Intentionally not awaiting, otherwise
        // a sleeping workflow would block others
        // from running.
        this.run(workflowId);
      } else {
        await goSleep(this.pollIntervalMs);
      }
    }
  }

  private async claim(): Promise<string | undefined> {
    const now = this.now();
    const timeoutAt = new Date(now.getTime() + this.timeoutIntervalMs);

    const filter = {
      $or: [
        {
          status: "idle" as Status,
        },
        {
          status: "running" as Status,
          timeoutAt: { $lt: now },
        },
        {
          status: "sleeping" as Status,
          timeoutAt: { $lt: now },
        },
        {
          status: "failed" as Status,
          timeoutAt: { $lt: now },
        },
      ],
    };

    const update = {
      $set: {
        status: "running" as Status,
        timeoutAt,
      },
    };

    const workflow = await this.workflows.findOneAndUpdate(filter, update);
    return workflow?.id;
  }

  private async run(workflowId: string): Promise<void> {
    const act = async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
      const workflow = await this.workflows.findOne({ id: workflowId });

      if (!workflow) {
        throw new Error(`workflow not found: ${workflowId}`);
      }

      if (workflow.actions && workflow.actions[id]) {
        return workflow.actions[id] as T;
      }

      const output = await fn();

      await this.workflows.updateOne(
        { id: workflowId },
        { $set: { [`actions.${id}`]: output } },
      );

      return output;
    };

    const sleep = async (id: string, ms: number): Promise<void> => {
      const workflow = await this.workflows.findOne({ id: workflowId });

      if (!workflow) {
        throw new Error(`workflow not found: ${workflowId}`);
      }

      const naps = workflow.naps || {};
      const now = this.now();

      if (naps[id]) {
        const remainingMs = naps[id].getTime() - now.getTime();

        if (remainingMs > 0) {
          await goSleep(remainingMs);
          return;
        }
      }

      const sleepUntil = new Date(now.getTime() + ms);
      const timeoutAt = new Date(sleepUntil.getTime() + this.timeoutIntervalMs);

      await this.workflows.updateOne(
        {
          id: workflowId,
        },
        {
          $set: {
            status: "sleeping",
            [`naps.${id}`]: sleepUntil,
            timeoutAt,
          },
        },
      );

      await goSleep(ms);
    };

    const workflow = await this.workflows.findOne({ id: workflowId });

    if (!workflow) {
      throw new Error(`workflow not found: ${workflowId}`);
    }

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
      console.error(err);
      let lastError = "";

      if (err instanceof Error) {
        lastError = err.message;
      } else {
        lastError = JSON.stringify(err);
      }

      const failures = (workflow.failures || 0) + 1;
      const status: Status = failures < this.maxFailures ? "failed" : "aborted";
      const now = this.now();
      const timeoutAt = new Date(now.getTime() + this.timeoutIntervalMs);

      await this.workflows.updateOne(
        {
          id: workflow.id,
        },
        {
          $set: {
            status,
            timeoutAt,
            failures,
            lastError,
          },
        },
      );
    }
  }
}
