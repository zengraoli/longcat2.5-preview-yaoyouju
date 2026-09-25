import { describe, it, expect } from 'vitest';
import { FollowupService } from './followup.service';

describe('FollowupService', () => {
  it('should be defined', () => {
    const service = new FollowupService();
    expect(service).toBeDefined();
  });
});
