// Cucumber configuration for the integration suite.
// Steps and support code are TypeScript, loaded on the fly via ts-node using
// the integration tsconfig (CommonJS, decorator metadata for NestJS DI).
process.env.TS_NODE_PROJECT =
  process.env.TS_NODE_PROJECT ?? 'tsconfig.integration.json';
// NestJS/winston are silent in tests; keep the integration run quiet too.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

module.exports = {
  default: {
    require: [
      'integration/support/**/*.ts',
      'integration/steps/**/*.ts',
    ],
    requireModule: ['ts-node/register'],
    paths: ['integration/features/**/*.feature'],
    publishQuiet: true,
    format: ['summary', 'progress'],
  },
};
