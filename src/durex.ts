export type WorkflowFn = (wc: WorkflowContext, input: unknown) => Promise<void>;

export interface Workflow {
  type: string;
  key: string;
  status: "available" | "processing" | "failed" | "finished" | "aborted";
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
  executedAt: Date;
}

export interface Sleep {
  workflowType: string;
  workflowKey: string;
  key: string;
  startAt: Date;
  wakeUpAt: Date;
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

  constructor(now: () => Date) {
    this.now = now;
  }

  /**
   * It creates a workflow in the database.
   * @param type The type of the workflow
   * @param key The id of the workflow
   */
  create<T>(type: string, key: string): Promise<void> {
    throw new Error("todo");
  }

  /**
   * It executes the function for the workflow.
   * @param type The type of the workflow
   * @param key The id of the workflow
   */
  run<T>(type: string, key: string): Promise<void> {
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
   * status=available
   * status=processing AND NOW>timeoutAt
   * status=failed AND failures<MAX_FAILURES AND NOW>resumeAt
   */
  pick(): Promise<Workflow | undefined> {
    throw new Error("todo");
  }
}
