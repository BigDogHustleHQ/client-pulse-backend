import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Module,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { StorageBucket } from '../../types/enums/storage';
import type { BlobObjectSummary } from '../../types';
import { STORAGE_WRITER, type StorageWriter } from './types';
import {
  CreateSignedUrlDto,
  DeleteObjectsDto,
  UploadObjectDto,
} from './dto';

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

  // Store or replace a customer file: photo/logo uploads (media-uploads) or a
  // published AI-generated website build (generated-sites).
  @Put(':bucket/objects')
  @HttpCode(HttpStatus.OK)
  upload(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Body() body: UploadObjectDto,
  ): Promise<BlobObjectSummary> {
    return this.writer.upload({ bucket, ...body });
  }

  // Remove customer files — e.g. cleaning up replaced media or tearing down a
  // generated site when a customer offboards.
  @Delete(':bucket/objects')
  async remove(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Body() body: DeleteObjectsDto,
  ): Promise<{ removed: string[] }> {
    return { removed: await this.writer.remove(bucket, body.paths) };
  }

  // Browse a customer's stored files — powers the dashboard media library and
  // the generated-site file listing.
  @Get(':bucket/objects')
  async list(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Query('prefix') prefix?: string,
  ): Promise<{ objects: string[] }> {
    return { objects: await this.writer.list(bucket, prefix) };
  }

  // Issue a short-lived signed download link so the frontend can fetch a
  // private customer file straight from storage without proxying bytes
  // through this service.
  @Post(':bucket/objects/signed-url')
  signedUrl(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Body() body: CreateSignedUrlDto,
  ): Promise<{ signedUrl: string }> {
    return this.writer.createSignedUrl(bucket, body.path, body.expiresIn ?? 3600);
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
