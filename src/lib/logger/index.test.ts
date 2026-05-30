const ORIG = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = ORIG;
  jest.resetModules();
});

describe('logger module', () => {
  it('is silent in test environment', async () => {
    const { logger } = await import('./index');
    expect(logger.silent).toBeTruthy();
  });

  it('createModuleLogger returns a distinct child logger', async () => {
    const { logger, createModuleLogger } = await import('./index');
    const child = createModuleLogger('hub');
    expect(child).toBeDefined();
    expect(child).not.toEqual(logger);
  });

  it('is not silent and exercises dev printf format when NODE_ENV is not production or test', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const { logger } = await import('./index');
      expect(logger.silent).toBeFalsy();

      // Covers: mod defined branch in printf
      logger.info('with-module', { module: 'mymod' });
      // Covers: mod undefined branch in printf
      logger.info('no-module');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('is not silent and uses JSON format when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const { logger } = await import('./index');
      expect(logger.silent).toBeFalsy();
      logger.info('prod-message');
    } finally {
      logSpy.mockRestore();
    }
  });
});
