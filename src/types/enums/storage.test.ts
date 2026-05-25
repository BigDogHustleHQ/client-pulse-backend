import { StorageBucket } from './storage';

describe('StorageBucket', () => {
  it('defines Supabase Storage bucket names', () => {
    expect(StorageBucket).toEqual({
      GeneratedSites: 'generated-sites',
      MediaUploads: 'media-uploads',
    });
  });
});
