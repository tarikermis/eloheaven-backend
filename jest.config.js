import { resolve } from 'path';

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/**/*.test.ts'],
  verbose: true,
  forceExit: true,
  roots: ['<rootDir>/__tests__'],
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '@bot': resolve(__dirname, './src/bot.ts'),
    '@config': resolve(__dirname, './src/config.ts'),
    '@database': resolve(__dirname, './src/database/index.ts'),
    '^@common/(.*)$': resolve(__dirname, './src/common/$1'),
    '^@core/(.*)$': resolve(__dirname, './src/core/$1'),
    '^@data/(.*)$': resolve(__dirname, './src/data/$1'),
    '^@helpers/(.*)$': resolve(__dirname, './src/helpers/$1'),
    '^@models/(.*)$': resolve(__dirname, './src/database/models/$1'),
    '^@repository/(.*)$': resolve(__dirname, './src/database/repository/$1'),
    '^@router/(.*)$': resolve(__dirname, './src/router/$1'),
    '^@socket/(.*)$': resolve(__dirname, './src/socket/$1'),
    '^@types/(.*)$': resolve(__dirname, './src/types/$1'),
  },
  // clearMocks: true,
};
