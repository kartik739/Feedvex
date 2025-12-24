module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend/src', '<rootDir>/backend/utils'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    'backend/utils/**/*.ts',
    '!backend/src/**/*.test.ts',
    '!backend/src/**/*.spec.ts',
    '!backend/src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
};
