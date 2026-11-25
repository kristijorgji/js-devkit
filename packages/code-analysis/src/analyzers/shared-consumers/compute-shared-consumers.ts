import type { InternalEdge } from './shared-package-index.js';

export function computeSharedConsumers(
    direct: Map<string, Set<string>>,
    edges: InternalEdge[]
): Map<string, Set<string>> {
    const consumers = new Map<string, Set<string>>();
    for (const [file, names] of direct) {
        consumers.set(file, new Set(names));
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const edge of edges) {
            const importerConsumers = consumers.get(edge.importer);
            if (!importerConsumers || importerConsumers.size === 0) {
                continue;
            }
            let dependencyConsumers = consumers.get(edge.dependency);
            if (!dependencyConsumers) {
                dependencyConsumers = new Set();
                consumers.set(edge.dependency, dependencyConsumers);
            }
            for (const consumer of importerConsumers) {
                if (!dependencyConsumers.has(consumer)) {
                    dependencyConsumers.add(consumer);
                    changed = true;
                }
            }
        }
    }

    return consumers;
}
