// Steps/support are TypeScript, loaded via ts-node (tsconfig.integration.json).
process.env.TS_NODE_PROJECT ??= 'tsconfig.integration.json';
process.env.NODE_ENV ??= 'test';

module.exports = {
  default: {
    require: ['integration/support/**/*.ts', 'integration/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    paths: ['integration/features/**/*.feature'],
    publishQuiet: true,
    format: ['summary'],
  },
};
