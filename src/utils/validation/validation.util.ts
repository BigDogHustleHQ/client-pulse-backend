import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

// Class-level constraint: the object must carry at least one of the named
// fields. Used for PATCH-style DTOs where an empty body is meaningless.
export const HasAtLeastOneField = (
  fields: string[],
  validationOptions?: ValidationOptions,
): ClassDecorator => {
  return (target) => {
    registerDecorator({
      name: 'hasAtLeastOneField',
      target: target,
      propertyName: undefined as unknown as string,
      constraints: fields,
      options: validationOptions,
      validator: {
        validate: (_value: unknown, args: ValidationArguments): boolean => {
          const allowed = args.constraints as string[];
          const object = args.object as Record<string, unknown>;
          return allowed.some((field) => object[field] !== undefined);
        },
        defaultMessage: (args: ValidationArguments): string =>
          `at least one of ${(args.constraints as string[]).join(', ')} must be provided`,
      },
    });
  };
};
