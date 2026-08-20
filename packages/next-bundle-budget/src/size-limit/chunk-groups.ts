export interface SizeLimitEntry {
    name: string;
    path: string | string[];
    limit: string;
}

export function routeOwnedBudgetName(routeName: string): string {
    return `Route ${routeName} (page-owned)`;
}

export function parseRouteOwnedBudgetName(name: string): string | null {
    const match = name.match(/^Route (.+) \(page-owned\)$/);
    return match?.[1] ?? null;
}

export function lookupGroupLimit(
    groups: Record<string, { limit: string }>,
    groupId: string,
): string | undefined {
    if (groups[groupId]?.limit) {
        return groups[groupId].limit;
    }
    const sharedMatch = groupId.match(/^sharedVendor\d+$/);
    if (sharedMatch) {
        return groups.sharedVendor?.limit;
    }
    return undefined;
}
