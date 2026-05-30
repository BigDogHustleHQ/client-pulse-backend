import { createClerkClient } from '@clerk/backend';

export const CLERK_CLIENT = Symbol('CLERK_CLIENT');

export const clerkProvider = {
  provide: CLERK_CLIENT,
  /* istanbul ignore next */
  useFactory: (): ReturnType<typeof createClerkClient> =>
    createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }),
};
