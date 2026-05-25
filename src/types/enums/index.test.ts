import { StorageBucket } from './index';

describe('enum exports', () => {
  it('re-exports shared enums', () => {
    expect(StorageBucket.MediaUploads).toBe('media-uploads');
  });
});
