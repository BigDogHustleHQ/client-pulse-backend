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
  UseGuards,
} from '@nestjs/common';
import { BlobStorageClient } from '../../services/blob-storage/blob-storage';
import { StorageBucket } from '../../types/enums/storage';
import type { BlobObjectSummary } from '../../types';
import { AuthModule } from '../../lib/auth/auth.module';
import { ClerkAuthGuard } from '../../lib/auth/clerk-auth.guard';
import { STORAGE_WRITER, type StorageWriter } from './storage.types';
import {
  StorageCreateSignedUrlDto,
  StorageDeleteObjectsDto,
  StorageUploadObjectDto,
} from './dto';

// Lazily constructed once and reused — building the client reads env and opens
// a Supabase connection, so we don't want a fresh one per request.
let blobStorageClient: BlobStorageClient | undefined;
/* istanbul ignore next */
const getClient = (): BlobStorageClient =>
  (blobStorageClient ??= new BlobStorageClient());

const storageWriter: StorageWriter = {
  upload: /* istanbul ignore next */ (input) => getClient().upload(input),
  remove: /* istanbul ignore next */ (b, p) => getClient().remove(b, p),
  list: /* istanbul ignore next */ (b, p) => getClient().list(b, p),
  createSignedUrl: /* istanbul ignore next */ (b, p, e) =>
    getClient().createSignedUrl(b, p, e),
};

@UseGuards(ClerkAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(@Inject(STORAGE_WRITER) private readonly writer: StorageWriter) {}

  // Store or replace a customer file: photo/logo uploads (media-uploads) or a
  // published AI-generated website build (generated-sites).
  @Put(':bucket/objects')
  @HttpCode(HttpStatus.OK)
  upload(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Body() body: StorageUploadObjectDto,
  ): Promise<BlobObjectSummary> {
    return this.writer.upload({ bucket, ...body });
  }

  // Remove customer files — e.g. cleaning up replaced media or tearing down a
  // generated site when a customer offboards.
  @Delete(':bucket/objects')
  async remove(
    @Param('bucket', new ParseEnumPipe(StorageBucket)) bucket: StorageBucket,
    @Body() body: StorageDeleteObjectsDto,
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
    @Body() body: StorageCreateSignedUrlDto,
  ): Promise<{ signedUrl: string }> {
    return this.writer.createSignedUrl(
      bucket,
      body.path,
      body.expiresIn ?? 3600,
    );
  }
}

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_WRITER,
      useValue: storageWriter,
    },
  ],
})
export class StorageModule {}
