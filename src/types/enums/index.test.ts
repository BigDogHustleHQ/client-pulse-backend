import { StorageBucket, TenantStatus } from './index';

describe('enum exports', () => {
  it('re-exports shared enums', () => {
    expect(StorageBucket.MediaUploads).toBe('media-uploads');
    expect(TenantStatus.Active).toBe('active');
  });
});
