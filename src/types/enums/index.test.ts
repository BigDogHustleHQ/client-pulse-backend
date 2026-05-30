import { StorageBucket, TenantStatus } from './index';

describe('enum exports', () => {
  it('re-exports shared enums', () => {
    expect(StorageBucket.MediaUploads).toEqual('media-uploads');
    expect(TenantStatus.Active).toEqual('active');
  });
});
