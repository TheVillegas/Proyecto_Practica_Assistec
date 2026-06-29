/**
 * Jest configuration for AssisTec API
 *
 * Supports both JavaScript tests (legacy) and TypeScript tests (golden tests).
 * Uses Jest projects to isolate JS and TS test runners, preventing transformer
 * interactions from breaking existing mocks.
 */
module.exports = {
  projects: [
    {
      displayName: 'js',
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json'],
      testMatch: [
        '**/__tests__/**/*.test.js',
        '**/validators/__tests__/**/*.test.js'
      ],
      testPathIgnorePatterns: ['/node_modules/']
    },
    {
      displayName: 'ts',
      testEnvironment: 'node',
      moduleFileExtensions: ['ts', 'js', 'json'],
      testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/validators/__tests__/**/*.test.ts'
      ],
      transform: {
        '^.+\\.tsx?$': '@swc/jest'
      },
      testPathIgnorePatterns: [
        '/node_modules/',
        '/src/services/saureus/__tests__/',
        '/src/routes/__tests__/'
      ]
    }
  ]
};
