import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { createModuleLogger } from '../../lib/logger/logger';
import type { BlobObjectSummary } from '../../types';
import type {
  BlobStorageClientOptions,
  BlobStorageHealth,
  UploadBlobInput,
} from './blob-storage.types';

const log = createModuleLogger('blob-storage');

@Injectable()
export class BlobStorageClient {
  private readonly client: NonNullable<BlobStorageClientOptions['client']>;

  constructor(options: BlobStorageClientOptions = {}) {
    if (options.client) {
      this.client = options.client;
      return;
    }

    /* istanbul ignore next */
    const supabaseUrl = options.supabaseUrl ?? process.env.SUPABASE_URL;
    /* istanbul ignore next */
    const serviceRoleKey =
      options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for blob storage',
      );
    }

    /* istanbul ignore next */
    this.client = createClient(supabaseUrl, serviceRoleKey);
  }

  async health(): Promise<BlobStorageHealth> {
    const { data, error } = await this.client.storage.listBuckets();

    if (error) {
      log.error('failed to list storage buckets', { error });
      throw error;
    }

    return {
      status: 'ok',
      buckets: (data ?? []).map((bucket) => bucket.name),
    };
  }

  async upload(input: UploadBlobInput): Promise<BlobObjectSummary> {
    const { data, error } = await this.client.storage
      .from(input.bucket)
      .upload(input.path, input.body, {
        contentType: input.contentType,
        upsert: input.upsert ?? false,
      });

    if (error) {
      log.error('failed to upload blob', {
        bucket: input.bucket,
        path: input.path,
        error,
      });
      throw error;
    }

    return {
      bucket: input.bucket,
      name: data?.path ?? input.path,
      id: data?.id ?? null,
      updatedAt: null,
    };
  }

  async remove(bucket: string, paths: string[]): Promise<string[]> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      log.error('failed to remove blobs', { bucket, paths, error });
      throw error;
    }

    return (data ?? []).map((o) => o.name);
  }

  async list(bucket: string, prefix?: string): Promise<string[]> {
    const { data, error } = await this.client.storage.from(bucket).list(prefix);

    if (error) {
      log.error('failed to list blobs', { bucket, prefix, error });
      throw error;
    }

    return (data ?? []).map((o) => o.name);
  }

  async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number,
  ): Promise<{ signedUrl: string }> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      log.error('failed to create signed url', { bucket, path, error });
      throw error;
    }

    return { signedUrl: data?.signedUrl ?? '' };
  }
}
