import { validate } from 'class-validator';
import { HasAtLeastOneField } from './validation.util';

@HasAtLeastOneField(['name', 'slug'])
class TestDto {
  name?: string;
  slug?: string;
}

describe('HasAtLeastOneField', () => {
  it('passes when at least one field is provided', async () => {
    const dto = Object.assign(new TestDto(), { name: 'Acme' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('passes when multiple fields are provided', async () => {
    const dto = Object.assign(new TestDto(), { name: 'Acme', slug: 'acme' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when no fields are provided', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.hasAtLeastOneField).toBe(
      'at least one of name, slug must be provided',
    );
  });
});
