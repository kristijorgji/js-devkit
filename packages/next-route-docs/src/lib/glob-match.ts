export function matchesGlob(relativePath: string, pattern: string): boolean {
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const regex = globToRegExp(normalizedPattern);
    return regex.test(normalizedPath);
}

function globToRegExp(pattern: string): RegExp {
    const chars: string[] = [...pattern];
    let regex = '^';
    for (let index = 0; index < chars.length; index += 1) {
        const char = chars[index];
        if (char === '*') {
            if (chars[index + 1] === '*') {
                regex += '.*';
                index += 1;
                if (chars[index + 1] === '/') {
                    index += 1;
                }
            } else {
                regex += '[^/]*';
            }
        } else if (char !== undefined && '.+^${}()|[]\\'.includes(char)) {
            regex += `\\${char}`;
        } else {
            regex += char;
        }
    }
    regex += '$';
    return new RegExp(regex);
}

export function matchesAnyGlob(relativePath: string, patterns: readonly string[]): boolean {
    return patterns.some((pattern) => matchesGlob(relativePath, pattern) || matchesGlob(relativePath, `**/${pattern}`));
}
