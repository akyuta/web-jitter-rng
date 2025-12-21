import { describe, it, expect } from 'vitest';
import { JitterCollector } from '../src/core/extractor';

describe('JitterCollector', () => {
    it('should collect bytes from deltas (duration mode)', () => {
        const collector = new JitterCollector({ timingMode: 'duration', scale: 1000 });

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

    it('should produce variability from simple input sequence (duration mode)', () => {
        // Check that we don't just output zeros for changing input
        const collector = new JitterCollector({ timingMode: 'duration' });
        // Monotonic increasing inputs
        for (let i = 0; i < 30; i++) {
            collector.addSample(0.1 + i * 0.01);
        }
        const bytes = collector.getBytes();
        expect(bytes.some(b => b !== 0)).toBe(true);
    });

    it('should produce non-zero output with interpCount mode input', () => {
        const collector = new JitterCollector({ timingMode: 'interpCount' });
        // Simulate interpCount-like samples (integer block counts)
        for (let i = 0; i < 30; i++) {
            collector.addSample(100 + (i % 20) + (i & 1));
        }
        const bytes = collector.getBytes();
        expect(bytes.some(b => b !== 0)).toBe(true);
    });

    it('should produce bytes with varied interpCount samples', () => {
        const collector = new JitterCollector({ timingMode: 'interpCount' });
        // Add samples with some pseudo-random variation
        for (let i = 0; i < 50; i++) {
            const noise = ((i * 13 + 5) % 17) - 8; // values from -8 to 8
            collector.addSample(100 + i + noise);
        }
        const bytes = collector.getBytes();
        expect(bytes.length).toBeGreaterThan(0);
        // Check that we have actual entropy (not all same byte)
        const uniqueBytes = new Set(bytes);
        expect(uniqueBytes.size).toBeGreaterThan(1);
    });

    it('uses interpCount mode by default', () => {
        const collector = new JitterCollector({}); // no explicit timingMode
        // Integer samples should work without scale multiplication
        for (let i = 0; i < 30; i++) {
            collector.addSample(50 + i);
        }
        const bytes = collector.getBytes();
        expect(bytes.some(b => b !== 0)).toBe(true);
    });
});

