/** Print tabular CLI output (intentional stdout; not for application logging). */
export function cliTable(rows: Record<string, unknown>[]): void {
    console.table(rows);
}
