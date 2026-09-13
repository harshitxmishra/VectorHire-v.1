import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from '../src/health/health.service';
import { supabase } from '@/lib/supabase/client';

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('HealthService (Phase 5.3)', () => {
  let service: HealthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new HealthService();
  });

  it('should report database healthy when probe query succeeds', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await service.isDatabaseHealthy();

    expect(result.status).toBe('healthy');
    expect(result.latencyMs).toBeDefined();
    expect(typeof result.latencyMs).toBe('number');
    expect(result.error).toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('candidates');
  });

  it('should report database unavailable when probe returns database error', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'relation "candidates" does not exist' },
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await service.isDatabaseHealthy();

    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('relation "candidates" does not exist');
    expect(result.latencyMs).toBeDefined();
  });

  it('should report database unavailable when query rejects or network fails', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      limit: vi.fn().mockRejectedValue(new Error('Connection timeout to Supabase')),
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const result = await service.isDatabaseHealthy();

    expect(result.status).toBe('unavailable');
    expect(result.error).toContain('Connection timeout to Supabase');
  });
});
