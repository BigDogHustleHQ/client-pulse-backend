import type { BlobObjectSummary } from '../../types';
import type { UploadBlobInput } from '../../services/blob-storage/blob-storage.types';

export const STORAGE_WRITER = 'STORAGE_WRITER';

export interface StorageWriter {
  upload(input: UploadBlobInput): Promise<BlobObjectSummary>;
  remove(bucket: string, paths: string[]): Promise<string[]>;
  list(bucket: string, prefix?: string): Promise<string[]>;
  createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number,
  ): Promise<{ signedUrl: string }>;
}
