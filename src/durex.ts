import { Collection, Db, MongoClient } from "mongodb";

export type WorkflowFn = (wc: WorkflowContext, input: unknown) => Promise<void>;

export interface Workflow {
  type: string;
  key: string;
  input: unknown;
  status: "available" | "processing" | "failed" | "finished" | "aborted";
  createdAt: Date;
  failures?: number;
  error?: string;
  timeoutAt?: Date;
  resumeAt?: Date;
  finishedAt?: Date;
  abortedAt?: Date;
}

export interface Step {
  workflowType: string;
  workflowKey: string;
  key: string;
  output: unknown;
  createdAt: Date;
}

export interface Sleep {
  workflowType: string;
  workflowKey: string;
  key: string;
  wakeUpAt: Date;
  createdAt: Date;
}

export class WorkflowContext {
  type: string;
  key: string;
  now: () => Date;

  constructor(type: string, key: string, now: () => Date) {
    this.type = type;
    this.key = key;
    this.now = now;
  }

  /**
   * Creates a step record.
   * @param key Key of the step
   * @param fn Function to run
   */
  step<T>(key: string, fn: () => Promise<T>): Promise<T> {
    throw new Error("todo");
  }

  /**
   * Creates a sleep record.
   * @param key Key of the sleep
   * @param milliseconds Amount of milliseconds to sleep
   */
  sleep(key: string, milliseconds: number): Promise<void> {
    throw new Error("todo");
  }

  /**
   * Sets the status to processing.
   */
  processing(): Promise<void> {
    throw new Error("todo");
  }

  /**
   * Sets the status to failed.
   */
  failed(error: string): Promise<void> {
    throw new Error("todo");
  }

  /**
   * Sets the status to finished.
   */
  finished(): Promise<void> {
    throw new Error("todo");
  }

  /**
   * Sets the status to aborted.
   */
  aborted(): Promise<void> {
    throw new Error("todo");
  }
}

export class Worker {
  now: () => Date;
  initialized: boolean;
  client: MongoClient;
  db: Db;
  workflows: Collection;
  steps: Collection;
  sleeps: Collection;
  registry: Map<string, WorkflowFn>;

  constructor(now: () => Date, mongoUrl: string) {
    this.now = now;
    this.initialized = false;
    this.client = new MongoClient(mongoUrl);
    this.db = this.client.db();
    this.workflows = this.db.collection("workflows");
    this.steps = this.db.collection("steps");
    this.sleeps = this.db.collection("sleeps");
    this.registry = new Map();
  }

  /**
   * It creates a workflow in the database.
   * @param type The type of the workflow
   * @param key The id of the workflow
   * @param input The input of the workflow
   */
  async create<T>(type: string, key: string, input: unknown): Promise<void> {
    if (!this.initialized) {
      throw new Error("not initialized");
    }

    const workflow: Workflow = {
      type,
      key,
      input,
      status: "available",
      createdAt: this.now(),
    };

    await this.workflows.insertOne(workflow);
  }

  /**
   * It executes the function for the workflow.
   * @param workflow The workflow
   * @param key The id of the workflow
   */
  async run<T>(workflow: Workflow): Promise<void> {
    if (!this.initialized) {
      throw new Error("not initialized");
    }

    const fn = this.registry.get(workflow.type);

    if (!fn) {
      throw new Error(`no registered function for type ${workflow.type}`);
    }

    let now = this.now();
    const timeoutAt = new Date(now.getTime() + 300_000); // 5m
    const filter = { type: workflow.type, key: workflow.key };
    let update = { status: "processing", timeoutAt };
    await this.workflows.updateOne(filter, update);
    const wc = new WorkflowContext(workflow.type, workflow.key, this.now);

    try {
      await fn(wc, workflow.input);
    } catch (err) {
      const failure = JSON.stringify(err);

      now = this.now();
      const resumeAt = new Date(now.getTime() + 300_000); // 5m
    }

    throw new Error("todo");
  }

  /**
   * It starts polling workflows from database.
   * @param registry Map of type to function, used to select the correct function to run.
   */
  init(registry: Map<string, WorkflowFn>): Promise<void> {
    throw new Error("todo");
  }

  /**
   * It picks a ready-to-run workflow from the database.
   * A workflow is ready-to-run if one of these conditions is true:
   *  status=available
   *  status=processing AND NOW>timeoutAt
   *  status=failed AND failures<MAX_FAILURES AND NOW>resumeAt
   * From these, the oldest one should be selected.
   */
  pick(): Promise<Workflow | undefined> {
    throw new Error("todo");
  }
}
