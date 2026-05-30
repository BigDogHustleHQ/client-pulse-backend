import { Test } from '@nestjs/testing';
import {
  HttpStatus,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import request from 'supertest';
import { StorageModule } from './storage.module';
import { ClerkAuthGuard } from '../../lib/auth/clerk-auth.guard';
import { STORAGE_WRITER } from './storage.types';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({})),
  verifyToken: jest.fn(),
}));

describe('Storage controller', () => {
  let app: INestApplication;
  const upload = jest.fn();
  const remove = jest.fn();
  const list = jest.fn();
  const createSignedUrl = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StorageModule],
    })
      .overrideProvider(STORAGE_WRITER)
      .useValue({ upload, remove, list, createSignedUrl })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await app.close();
  });

  it('PUT /storage/:bucket/objects uploads a blob', async () => {
    upload.mockResolvedValue({
      bucket: 'media-uploads',
      name: 'logo.png',
      id: 'id',
      updatedAt: null,
    });

    const res = await request(app.getHttpServer())
      .put('/storage/media-uploads/objects')
      .send({ path: 'logo.png', body: 'data', contentType: 'image/png' });

    expect(res.status).toEqual(HttpStatus.OK);
    expect(upload).toHaveBeenCalledWith({
      bucket: 'media-uploads',
      path: 'logo.png',
      body: 'data',
      contentType: 'image/png',
    });
  });

  it('PUT /storage/:bucket/objects rejects an unknown bucket', async () => {
    const res = await request(app.getHttpServer())
      .put('/storage/bogus/objects')
      .send({ path: 'logo.png', body: 'data' });

    expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(upload).not.toHaveBeenCalled();
  });

  it('DELETE /storage/:bucket/objects removes objects', async () => {
    remove.mockResolvedValue(['a.png', 'b.png']);

    const res = await request(app.getHttpServer())
      .delete('/storage/media-uploads/objects')
      .send({ paths: ['a.png', 'b.png'] });

    expect(res.status).toEqual(HttpStatus.OK);
    expect(res.body).toEqual({ removed: ['a.png', 'b.png'] });
    expect(remove).toHaveBeenCalledWith('media-uploads', ['a.png', 'b.png']);
  });

  it('DELETE /storage/:bucket/objects rejects empty paths', async () => {
    const res = await request(app.getHttpServer())
      .delete('/storage/media-uploads/objects')
      .send({ paths: [] });

    expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(remove).not.toHaveBeenCalled();
  });

  it('GET /storage/:bucket/objects lists objects', async () => {
    list.mockResolvedValue(['a.png']);

    const res = await request(app.getHttpServer())
      .get('/storage/generated-sites/objects')
      .query({ prefix: 'tenants/' });

    expect(res.status).toEqual(HttpStatus.OK);
    expect(res.body).toEqual({ objects: ['a.png'] });
    expect(list).toHaveBeenCalledWith('generated-sites', 'tenants/');
  });

  it('POST /storage/:bucket/objects/signed-url returns a signed url', async () => {
    createSignedUrl.mockResolvedValue({ signedUrl: 'https://signed/a.png' });

    const res = await request(app.getHttpServer())
      .post('/storage/media-uploads/objects/signed-url')
      .send({ path: 'a.png' });

    expect(res.status).toEqual(HttpStatus.CREATED);
    expect(res.body).toEqual({ signedUrl: 'https://signed/a.png' });
    expect(createSignedUrl).toHaveBeenCalledWith(
      'media-uploads',
      'a.png',
      3600,
    );
  });

  it('POST /storage/:bucket/objects/signed-url rejects a missing path', async () => {
    const res = await request(app.getHttpServer())
      .post('/storage/media-uploads/objects/signed-url')
      .send({});

    expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
