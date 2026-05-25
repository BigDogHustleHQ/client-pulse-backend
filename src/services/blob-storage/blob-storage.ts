import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { BlobObjectSummary } from '../../types';
import type {
  BlobStorageClientOptions,
  BlobStorageHealth,
  UploadBlobInput,
} from './types';

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
      throw error;
    }

    return {
      bucket: input.bucket,
      name: data?.path ?? input.path,
      id: data?.id ?? null,
      updatedAt: null,
    };
  }
}
