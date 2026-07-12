/**
 * Unit test config: domain/application layers are colocated *.spec.ts next
 * to the source they test (docs/ARCHITECTURE.md §12.1) — no network, no DB,
 * fast. Infra-adapter integration tests and the e2e suite live under test/
 * with their own config, added when Phase 4 starts.
 */
module.exports = {
  rootDir: 'src',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!generated/**'],
  coverageDirectory: '../coverage',
};
