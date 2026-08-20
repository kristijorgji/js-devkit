export function formatKilobytes(bytes: number): string {
    return `${(bytes / 1024).toFixed(2)} KB`;
}

export function formatSignedKilobytes(deltaBytes: number): string {
    const sign = deltaBytes > 0 ? '+' : '';
    return `${sign}${formatKilobytes(deltaBytes)}`;
}
