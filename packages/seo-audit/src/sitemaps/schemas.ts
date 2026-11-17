import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const schemasDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schemas');

export const SITEMAP_XSD = readFileSync(path.join(schemasDir, 'sitemap.xsd'), 'utf8');
export const SITEINDEX_XSD = readFileSync(path.join(schemasDir, 'siteindex.xsd'), 'utf8');
