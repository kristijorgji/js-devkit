import { lookup as lookupMimeType } from 'mime-types';

export function contentTypeForFileName(fileName: string): string {
    return lookupMimeType(fileName) || 'application/octet-stream';
}
