import { describe, it, expect } from 'vitest';
import { generateActivePoint7DayHistory } from '../lib/pointHistoryService';

describe('D3 Correlation Scatter Plot & Physical Dynamics Tests', () => {
  const sampleHistory = generateActivePoint7DayHistory({
    lat: 36.7196,
    lon: -4.4200,
    currentNO2: 32.5,
    currentO3: 48.0,
    currentPM25: 12.0,
    currentPM10: 24.0,
    currentTemp: 25.0,
    currentWindKmh: 14.0,
    currentRH: 65.0,
    svf: 0.45,
    hwRatio: 1.5
  });

  it('generates 168 synchronous hourly records with valid physicochemical variables', () => {
    expect(sampleHistory.hourlyRecords).toHaveLength(168);
    sampleHistory.hourlyRecords.forEach(r => {
      expect(r.no2).toBeGreaterThan(0);
      expect(r.o3).toBeGreaterThan(0);
      expect(r.rhPct).toBeGreaterThanOrEqual(20);
      expect(r.rhPct).toBeLessThanOrEqual(100);
      expect(r.tempC).toBeGreaterThan(5);
      expect(r.tempC).toBeLessThan(45);
      expect(r.solarRadiationWm2).toBeGreaterThanOrEqual(0);
      expect(r.photolysisJNO2).toBeGreaterThanOrEqual(0);
    });
  });

  it('verifies photochemical ozone vs solar radiation positive correlation (Leighton Cycle)', () => {
    const o3Vals = sampleHistory.hourlyRecords.map(r => r.o3);
    const radVals = sampleHistory.hourlyRecords.map(r => r.solarRadiationWm2);
    const n = o3Vals.length;

    const meanO3 = o3Vals.reduce((a, b) => a + b, 0) / n;
    const meanRad = radVals.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denO3 = 0;
    let denRad = 0;
    for (let i = 0; i < n; i++) {
      const dO3 = o3Vals[i] - meanO3;
      const dRad = radVals[i] - meanRad;
      num += dO3 * dRad;
      denO3 += dO3 * dO3;
      denRad += dRad * dRad;
    }
    const r = num / Math.sqrt(denO3 * denRad);

    // En Málaga, la insolación solar diurna incrementa fuertemente el O3 secundario
    expect(r).toBeGreaterThan(0.35);
  });

  it('verifies deterministic linear regression slopes and R2 bounds', () => {
    const records = sampleHistory.hourlyRecords;
    const x = records.map(r => r.rhPct);
    const y = records.map(r => r.no2);
    const n = x.length;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = num / den;
    const r2 = r * r;

    expect(Number.isFinite(slope)).toBe(true);
    expect(Number.isFinite(intercept)).toBe(true);
    expect(r2).toBeGreaterThanOrEqual(0);
    expect(r2).toBeLessThanOrEqual(1);
  });
});
