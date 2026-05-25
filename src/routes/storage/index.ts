import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Module,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { StorageBucket } from '../../types/enums/storage';
import type { BlobObjectSummary } from '../../types';
import { STORAGE_WRITER, type StorageWriter } from './types';

const storageWriter: StorageWriter = {
  upload: /* istanbul ignore next */ (input) =>
    new BlobStorageClient().upload(input),
  remove: /* istanbul ignore next */ (b, p) =>
    new BlobStorageClient().remove(b, p),
  list: /* istanbul ignore next */ (b, p) => new BlobStorageClient().list(b, p),
  createSignedUrl: /* istanbul ignore next */ (b, p, e) =>
    new BlobStorageClient().createSignedUrl(b, p, e),
};

@Controller('storage')
export class StorageController {
  constructor(@Inject(STORAGE_WRITER) private readonly writer: StorageWriter) {}

  private assertBucket(bucket: string): void {
    if (!Object.values(StorageBucket).includes(bucket as StorageBucket)) {
      throw new BadRequestException(`Unknown storage bucket: ${bucket}`);
    }
  }

  @Put(':bucket/objects')
  @HttpCode(HttpStatus.OK)
  upload(
    @Param('bucket') bucket: string,
    @Body()
    body: {
      path: string;
      body: string;
      contentType?: string;
      upsert?: boolean;
    },
  ): Promise<BlobObjectSummary> {
    this.assertBucket(bucket);
    return this.writer.upload({ bucket, ...body });
  }

  @Delete(':bucket/objects')
  async remove(
    @Param('bucket') bucket: string,
    @Body() body: { paths: string[] },
  ): Promise<{ removed: string[] }> {
    this.assertBucket(bucket);
    if (!Array.isArray(body.paths) || body.paths.length === 0) {
      throw new BadRequestException('paths must be a non-empty array');
    }
    return { removed: await this.writer.remove(bucket, body.paths) };
  }

  @Get(':bucket/objects')
  async list(
    @Param('bucket') bucket: string,
    @Query('prefix') prefix?: string,
  ): Promise<{ objects: string[] }> {
    this.assertBucket(bucket);
    return { objects: await this.writer.list(bucket, prefix) };
  }

  @Post(':bucket/objects/signed-url')
  signedUrl(
    @Param('bucket') bucket: string,
    @Body() body: { path: string; expiresIn?: number },
  ): Promise<{ signedUrl: string }> {
    this.assertBucket(bucket);
    if (!body.path) {
      throw new BadRequestException('path is required');
    }
    return this.writer.createSignedUrl(
      bucket,
      body.path,
      body.expiresIn ?? 3600,
    );
  }
}

@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_WRITER,
      useValue: storageWriter,
    },
  ],
})
export class StorageModule {}
