import { TenantStatus } from './tenant';

describe('TenantStatus', () => {
  it('defines tenant lifecycle states', () => {
    expect(TenantStatus).toEqual({
      Active: 'active',
      Suspended: 'suspended',
    });
  });
});
