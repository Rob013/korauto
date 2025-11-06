/**
 * Batch DOM read and write operations to prevent forced reflows
 * This utility helps achieve better performance by batching layout operations
 */

type DOMReadTask = () => any;
type DOMWriteTask = () => void;

class DOMBatcher {
  private readTasks: DOMReadTask[] = [];
  private writeTasks: DOMWriteTask[] = [];
  private scheduled = false;

  /**
   * Schedule a DOM read operation
   * All reads happen before writes to prevent layout thrashing
   */
  read(task: DOMReadTask): Promise<any> {
    return new Promise((resolve) => {
      this.readTasks.push(() => {
        const result = task();
        resolve(result);
        return result;
      });
      this.schedule();
    });
  }

  /**
   * Schedule a DOM write operation
   * All writes happen after reads to prevent layout thrashing
   */
  write(task: DOMWriteTask): void {
    this.writeTasks.push(task);
    this.schedule();
  }

  /**
   * Schedule the batch execution
   */
  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Execute all queued operations
   * Reads first, then writes
   */
  private flush(): void {
    // Execute all reads first
    const readResults: any[] = [];
    while (this.readTasks.length) {
      const task = this.readTasks.shift();
      if (task) {
        readResults.push(task());
      }
    }

    // Then execute all writes
    while (this.writeTasks.length) {
      const task = this.writeTasks.shift();
      if (task) {
        task();
      }
    }

    this.scheduled = false;
  }

  /**
   * Measure an element without causing reflow
   */
  measure(element: HTMLElement): Promise<DOMRect> {
    return this.read(() => element.getBoundingClientRect());
  }

  /**
   * Update an element's style without causing reflow
   */
  mutate(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    this.write(() => {
      Object.assign(element.style, styles);
    });
  }
}

// Export singleton instance
export const domBatcher = new DOMBatcher();

/**
 * Helper to batch multiple DOM measurements
 */
export function batchMeasure(elements: HTMLElement[]): Promise<DOMRect[]> {
  return Promise.all(elements.map(el => domBatcher.measure(el)));
}

/**
 * Helper to batch multiple DOM mutations
 */
export function batchMutate(
  mutations: Array<{ element: HTMLElement; styles: Partial<CSSStyleDeclaration> }>
): void {
  mutations.forEach(({ element, styles }) => {
    domBatcher.mutate(element, styles);
  });
}

export default domBatcher;
