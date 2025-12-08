import { describe, it, expect } from 'vitest';
import { JitterCollector } from '../src/core/extractor';

describe('JitterCollector', () => {
    it('should collect bytes from deltas', () => {
        const collector = new JitterCollector({ scale: 1000 });

        // Feed enough deltas to get bytes. 
        // Need at least 8 bits / 3 bits-per-sample approx 3 samples.
        // Actually dependent on implementation details (buffer flush).

        // Simulate some deltas
        const deltas = [0.1, 0.2, 0.3, 0.1, 0.5, 0.6, 0.1, 0.2];
        deltas.forEach(d => collector.addSample(d));

        expect(collector.byteLength).toBeGreaterThan(0);
        const bytes = collector.getBytes();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(collector.byteLength).toBe(0); // cleared
    });

    it('should produce variability from simple input sequence', () => {
        // Check that we don't just output zeros for changing input
        const collector = new JitterCollector();
        // Monotonic increasing inputs
        for (let i = 0; i < 30; i++) {
            collector.addSample(0.1 + i * 0.01);
        }
        const bytes = collector.getBytes();
        expect(bytes.some(b => b !== 0)).toBe(true);
    });
});
