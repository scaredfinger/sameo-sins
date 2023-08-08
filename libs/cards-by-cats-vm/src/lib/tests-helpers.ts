import { Subject, firstValueFrom } from 'rxjs';

export class Signal {
  private subject: Subject<void> = new Subject();

  public untilSignaled(): Promise<void> {
    return firstValueFrom(this.subject);
  }

  public signal(): void {
    this.subject.next();
  }

  public signalError(message = 'simulated-error'): void {
    this.subject.error(Error(message));
  }
}

export class PendingTasks {
  private tasks: Promise<unknown>[] = [];

  public add(task: Promise<unknown>) {
    this.tasks.push(task);
  }

  public async untilAllDone() {
    try {
      await Promise.all(this.tasks);
    } catch (error) {}
  }

  public clear() {
    this.tasks = [];
  }
}
