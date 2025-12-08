import { JitterOptions } from '../types';

export class JitterCollector {
    private prevQ: number | null = null;
    private sortedWindow: number[] = [];
    private rollingWindow: number[] = [];
    private bitBuffer: number[] = [];
    private bytes: number[] = [];

    // Configurations
    private scale: number;
    private windowSize: number;

    constructor(options: JitterOptions = {}) {
        this.scale = options.scale ?? 1000;
        this.windowSize = options.windowSize ?? 256;
    }

    /**
     * Estimates the median of the rolling window.
     * Uses the pre-sorted window for O(1) access.
     */
    private getMedian(): number {
        if (this.sortedWindow.length === 0) return 0;
        const mid = Math.floor(this.sortedWindow.length / 2);
        return this.sortedWindow[mid];
    }

    /**
     * Inserts value into sorted array using binary search.
     */
    private insertSorted(val: number) {
        let low = 0, high = this.sortedWindow.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.sortedWindow[mid] < val) low = mid + 1;
            else high = mid;
        }
        this.sortedWindow.splice(low, 0, val);
    }

    /**
     * Removes a value from sorted array using binary search.
     */
    private removeSorted(val: number) {
        let low = 0, high = this.sortedWindow.length;
        // Simple scan for removal might be O(N) anyway due to splice.
        // But finding index is O(log N). 
        // Given N=256, built-in indexOf is fast enough too, but let's be consistent.

        // Find FIRST occurrence >= val
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.sortedWindow[mid] < val) low = mid + 1;
            else high = mid;
        }

        // Verify it matches and remove
        if (low < this.sortedWindow.length && this.sortedWindow[low] === val) {
            this.sortedWindow.splice(low, 1);
        }
    }

    /**
     * Processes a single time delta.
     * Extracts bits and accumulates bytes.
     */
    public addSample(delta: number): void {
        const q = Math.round(delta * this.scale);

        // Update rolling window and sorted window
        this.rollingWindow.push(q);
        this.insertSorted(q);

        if (this.rollingWindow.length > this.windowSize) {
            const old = this.rollingWindow.shift()!;
            this.removeSorted(old);
        }

        if (this.prevQ === null) {
            this.prevQ = q;
            return;
        }

        const d = q - this.prevQ;
        const medianQ = this.getMedian();

        // 3-bit extraction
        const signBit = d > 0 ? 1 : 0;
        const absLsbBit = (Math.abs(d) & 1) ? 1 : 0;
        const threshBit = q > medianQ ? 1 : 0;

        // Add bits to buffer
        this.bitBuffer.push(signBit, absLsbBit, threshBit);

        this.prevQ = q;

        // Pack bits into bytes
        while (this.bitBuffer.length >= 8) {
            let byte = 0;
            for (let i = 0; i < 8; i++) {
                byte |= (this.bitBuffer.shift()!) << i;
            }
            this.bytes.push(byte);
        }
    }

    /**
     * Returns the collected bytes and clears the buffer.
     */
    public getBytes(): Uint8Array {
        const result = new Uint8Array(this.bytes);
        this.bytes = [];
        return result;
    }

    /**
     * Checks if we have enough bytes
     */
    public get byteLength(): number {
        return this.bytes.length;
    }
}