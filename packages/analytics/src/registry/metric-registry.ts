import type { MetricDefinition } from '@carparty/types';

export class MetricRegistry {
  private definitions = new Map<string, MetricDefinition>();

  register(definition: MetricDefinition): void {
    this.definitions.set(definition.key, definition);
  }

  registerMany(definitions: MetricDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  get(key: string): MetricDefinition | undefined {
    return this.definitions.get(key);
  }

  getAll(): MetricDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByModule(module: string): MetricDefinition[] {
    return this.getAll().filter(
      (d) => d.module === module || d.module === 'global',
    );
  }

  has(key: string): boolean {
    return this.definitions.has(key);
  }

  unregister(key: string): boolean {
    return this.definitions.delete(key);
  }
}

export function createMetricRegistry(
  initial: MetricDefinition[] = [],
): MetricRegistry {
  const registry = new MetricRegistry();
  registry.registerMany(initial);
  return registry;
}
