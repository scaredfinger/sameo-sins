import { Subject, firstValueFrom } from 'rxjs';

export class Signal {
    private subject: Subject<void> = new Subject();
  
    public untilSignaled(): Promise<void> {
      return firstValueFrom(this.subject);
    }
  
    public signal(): void {
      this.subject.next();
    }
  }
  
  export class PendingTasks {
    private tasks: Promise<unknown>[] = [];
  
    public add(task: Promise<unknown>) {
      this.tasks.push(task);
    }
  
    public async untilAllDone() {
      await Promise.all(this.tasks);
    }
  
    public clear() {
      this.tasks = [];
    }
  }