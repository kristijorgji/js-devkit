import path from 'node:path';
import fs from 'node:fs';

export const joined = path.join('a', 'b');
export const exists = fs.existsSync(joined);
