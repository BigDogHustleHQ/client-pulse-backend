export type BlobBody = string | Buffer | ArrayBuffer | Blob | File | FormData;

export interface BlobStorageAdapter {
  storage: {
    listBuckets(): Promise<{
      data: { name: string }[] | null;
      error: unknown | null;
    }>;
    from(bucket: string): {
      upload(
        path: string,
        body: BlobBody,
        options: {
          contentType?: string;
          upsert: boolean;
        },
      ): Promise<{
        data: { path: string; id: string | null } | null;
        error: unknown | null;
      }>;
    };
  };
}

export interface BlobStorageClientOptions {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  client?: BlobStorageAdapter;
}

export interface UploadBlobInput {
  bucket: string;
  path: string;
  body: BlobBody;
  contentType?: string;
  upsert?: boolean;
}

export interface BlobStorageHealth {
  status: 'ok';
  buckets: string[];
}
