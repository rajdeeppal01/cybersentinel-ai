import { describe, it, expect } from 'vitest';
import { analyzeLogLocal } from './aiEngine';

describe('aiEngine', () => {
  describe('analyzeLogLocal', () => {
    it('should correctly analyze a high severity log string', async () => {
      // Mock SQLi log
      const mockLog = '192.168.1.142 - - [01/Jul/2026:09:42:01 +0000] "GET /api/users/profile?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users%20--%20HTTP/1.1" 200 4821';
      
      const result = await analyzeLogLocal(mockLog);
      
      expect(result).toHaveProperty('detectedThreat');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('severity');
      
      expect(result.detectedThreat).toContain('SQL Injection');
      expect(result.severity).toBe('high');
      expect(result.confidence).toBeGreaterThan(90);
    });

    it('should return a low severity / safe log analysis for benign logs', async () => {
      const mockLog = '10.0.0.5 - - [10/Oct/2023:14:02:11 -0700] "GET /index.html HTTP/1.1" 200 1042';
      
      const result = await analyzeLogLocal(mockLog);
      
      expect(result.severity).toBe('low');
      expect(result.detectedThreat).toBe('Unrecognized Activity (Heuristic Engine Failed)');
    });
  });
});
