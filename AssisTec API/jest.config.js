/**
 * Jest configuration for AssisTec API
 *
 * No ts-jest required — tests are in .js.
 * .ts files loaded by require() must be mocked or use ts-jest.
 */
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.test.js', '**/validators/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/']
};
