import { BlobStorageClient } from './blob-storage';

const createStorageClient = () => {
  const upload = jest.fn();
  const remove = jest.fn();
  const list = jest.fn();
  const createSignedUrl = jest.fn();
  const from = jest
    .fn()
    .mockReturnValue({ upload, remove, list, createSignedUrl });
  const listBuckets = jest.fn();

  return {
    client: {
      storage: {
        from,
        listBuckets,
      },
    },
    from,
    listBuckets,
    upload,
    remove,
    list,
    createSignedUrl,
  };
};

describe('BlobStorageClient', () => {
  it('creates a Supabase client from credentials', () => {
    expect(
      new BlobStorageClient({
        supabaseUrl: 'https://example.supabase.co',
        serviceRoleKey: 'service-role-key',
      }),
    ).toBeDefined();
  });

  it('requires Supabase credentials without an injected client', () => {
    expect(() => new BlobStorageClient()).toThrow(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for blob storage',
    );
  });

  it('checks storage health', async () => {
    const storage = createStorageClient();
    storage.listBuckets.mockResolvedValue({
      data: [{ name: 'media-uploads' }, { name: 'generated-sites' }],
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.health()).resolves.toEqual({
      status: 'ok',
      buckets: ['media-uploads', 'generated-sites'],
    });
  });

  it('handles health checks with no bucket data', async () => {
    const storage = createStorageClient();
    storage.listBuckets.mockResolvedValue({
      data: null,
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.health()).resolves.toEqual({
      status: 'ok',
      buckets: [],
    });
  });

  it('throws storage health errors', async () => {
    const storage = createStorageClient();
    const error = new Error('storage unavailable');
    storage.listBuckets.mockResolvedValue({ data: [], error });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.health()).rejects.toThrow(error);
  });

  it('uploads blobs', async () => {
    const storage = createStorageClient();
    storage.upload.mockResolvedValue({
      data: { path: 'tenants/acme/logo.png', id: 'object-id' },
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.upload({
        bucket: 'media-uploads',
        path: 'tenants/acme/logo.png',
        body: 'image',
        contentType: 'image/png',
        upsert: true,
      }),
    ).resolves.toEqual({
      bucket: 'media-uploads',
      name: 'tenants/acme/logo.png',
      id: 'object-id',
      updatedAt: null,
    });
    expect(storage.from).toHaveBeenCalledWith('media-uploads');
    expect(storage.upload).toHaveBeenCalledWith(
      'tenants/acme/logo.png',
      'image',
      {
        contentType: 'image/png',
        upsert: true,
      },
    );
  });

  it('throws upload errors', async () => {
    const storage = createStorageClient();
    const error = new Error('upload failed');
    storage.upload.mockResolvedValue({ data: null, error });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.upload({
        bucket: 'media-uploads',
        path: 'logo.png',
        body: 'image',
      }),
    ).rejects.toThrow(error);
  });

  it('falls back to the requested path when upload data is empty', async () => {
    const storage = createStorageClient();
    storage.upload.mockResolvedValue({ data: null, error: null });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.upload({
        bucket: 'media-uploads',
        path: 'logo.png',
        body: 'image',
      }),
    ).resolves.toEqual({
      bucket: 'media-uploads',
      name: 'logo.png',
      id: null,
      updatedAt: null,
    });
  });

  it('removes objects and maps their names', async () => {
    const storage = createStorageClient();
    storage.remove.mockResolvedValue({
      data: [{ name: 'a.png' }, { name: 'b.png' }],
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.remove('media-uploads', ['a.png', 'b.png']),
    ).resolves.toEqual(['a.png', 'b.png']);
    expect(storage.from).toHaveBeenCalledWith('media-uploads');
    expect(storage.remove).toHaveBeenCalledWith(['a.png', 'b.png']);
  });

  it('returns an empty list when remove data is null', async () => {
    const storage = createStorageClient();
    storage.remove.mockResolvedValue({ data: null, error: null });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.remove('media-uploads', ['a.png'])).resolves.toEqual(
      [],
    );
  });

  it('throws remove errors', async () => {
    const storage = createStorageClient();
    const error = new Error('remove failed');
    storage.remove.mockResolvedValue({ data: null, error });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.remove('media-uploads', ['a.png'])).rejects.toThrow(
      error,
    );
  });

  it('lists objects and maps their names', async () => {
    const storage = createStorageClient();
    storage.list.mockResolvedValue({
      data: [{ name: 'a.png' }, { name: 'b.png' }],
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.list('media-uploads', 'tenants/')).resolves.toEqual([
      'a.png',
      'b.png',
    ]);
    expect(storage.from).toHaveBeenCalledWith('media-uploads');
    expect(storage.list).toHaveBeenCalledWith('tenants/');
  });

  it('returns an empty list when list data is null', async () => {
    const storage = createStorageClient();
    storage.list.mockResolvedValue({ data: null, error: null });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.list('media-uploads')).resolves.toEqual([]);
  });

  it('throws list errors', async () => {
    const storage = createStorageClient();
    const error = new Error('list failed');
    storage.list.mockResolvedValue({ data: null, error });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(client.list('media-uploads')).rejects.toThrow(error);
  });

  it('creates a signed url', async () => {
    const storage = createStorageClient();
    storage.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/a.png' },
      error: null,
    });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.createSignedUrl('media-uploads', 'a.png', 3600),
    ).resolves.toEqual({ signedUrl: 'https://signed.example/a.png' });
    expect(storage.from).toHaveBeenCalledWith('media-uploads');
    expect(storage.createSignedUrl).toHaveBeenCalledWith('a.png', 3600);
  });

  it('falls back to an empty signed url when data is null', async () => {
    const storage = createStorageClient();
    storage.createSignedUrl.mockResolvedValue({ data: null, error: null });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.createSignedUrl('media-uploads', 'a.png', 3600),
    ).resolves.toEqual({ signedUrl: '' });
  });

  it('throws signed url errors', async () => {
    const storage = createStorageClient();
    const error = new Error('signed url failed');
    storage.createSignedUrl.mockResolvedValue({ data: null, error });
    const client = new BlobStorageClient({ client: storage.client });

    await expect(
      client.createSignedUrl('media-uploads', 'a.png', 3600),
    ).rejects.toThrow(error);
  });
});
