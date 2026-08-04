import { WidgetManifest, WidgetCategory } from './types';

class WidgetRegistryClass {
  private registry = new Map<string, WidgetManifest>();

  /**
   * Registers a new widget manifest.
   */
  public register(manifest: WidgetManifest) {
    if (this.registry.has(manifest.type)) {
      console.warn(`Widget of type "${manifest.type}" is already registered. Overwriting.`);
    }
    this.registry.set(manifest.type, manifest);
  }

  /**
   * Retrieves a widget manifest by its unique type identifier.
   */
  public get(type: string): WidgetManifest | undefined {
    return this.registry.get(type);
  }

  /**
   * Returns all registered widget manifests as an array.
   */
  public getAll(): WidgetManifest[] {
    return Array.from(this.registry.values());
  }

  /**
   * Returns all widgets grouped by their category.
   */
  public getGroupedByCategory(): Record<string, WidgetManifest[]> {
    const grouped: Record<string, WidgetManifest[]> = {};
    for (const manifest of this.registry.values()) {
      if (!grouped[manifest.category]) {
        grouped[manifest.category] = [];
      }
      grouped[manifest.category].push(manifest);
    }
    return grouped;
  }
}

// Export as a singleton
export const WidgetRegistry = new WidgetRegistryClass();
