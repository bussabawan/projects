import { vi } from 'vitest';

export interface MockDbConnection {
  query: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  beginTransaction: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
  rollback: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
}

export function createMockConnection(): MockDbConnection {
  return {
    query: vi.fn().mockResolvedValue([[]]),
    execute: vi.fn().mockResolvedValue([[]]),
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined)
  };
}

export function createMockPool(mockConn: MockDbConnection = createMockConnection()) {
  return {
    query: mockConn.query,
    execute: mockConn.execute,
    getConnection: vi.fn().mockResolvedValue(mockConn),
    end: vi.fn().mockResolvedValue(undefined)
  };
}
