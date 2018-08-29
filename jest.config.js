module.exports = {
  transform: {
    '\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.{t,j}s?(x)', '**/?(*.)(spec|test).{t,j}s?(x)'],
  testPathIgnorePatterns: ['<rootDir>/(node_modules|lib|es|dist)'],
  collectCoverageFrom: ['src/**/*.{t,j}s?(x)', '!src/**/*.d.ts'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  globals: {
    'ts-jest': {},
  },
  testEnvironment: 'node',
};
