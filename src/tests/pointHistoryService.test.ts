import { describe, it, expect } from 'vitest';
import {
  generateActivePoint7DayHistory,
  calculateCompositeAQI,
  calculatePeriodStatistics
} from '../lib/pointHistoryService';

describe('pointHistoryService (Deterministic 7-Day History)', () => {
  it('generates exactly 168 hourly records for 7 full days', () => {
    const history = generateActivePoint7DayHistory({
      lat: 36.7196,
      lon: -4.4200,
      currentNO2: 32.5,
      currentO3: 48.0,
      currentPM25: 14.0,
      currentPM10: 26.0,
      currentTemp: 24.0,
      currentWindKmh: 12.0
    });

    expect(history.hourlyRecords.length).toBe(168);
    expect(history.dailySummaries.length).toBe(7);
  });

  it('ensures atomic calibration at the current hour (i = 167)', () => {
    const targetNO2 = 34.8;
    const targetO3 = 51.2;
    const history = generateActivePoint7DayHistory({
      lat: 36.7196,
      lon: -4.4200,
      currentNO2: targetNO2,
      currentO3: targetO3,
      currentPM25: 15.0,
      currentPM10: 25.0
    });

    const currentRecord = history.hourlyRecords[167];
    expect(currentRecord.no2).toBe(targetNO2);
    expect(currentRecord.o3).toBe(targetO3);
  });

  it('calculates deterministic AQI and proper color mapping', () => {
    const good = calculateCompositeAQI(20, 30, 8, 15);
    expect(good.category).toBe('Buena');
    expect(good.color).toBe('#10b981');

    const moderate = calculateCompositeAQI(120, 110, 35, 60);
    expect(moderate.category).toBe('Moderada');
    expect(moderate.color).toBe('#f59e0b');
  });

  it('calculates valid period statistics, exceedance hours, and Theil-Sen trend slope', () => {
    const history = generateActivePoint7DayHistory({
      lat: 36.7196,
      lon: -4.4200,
      currentNO2: 30.0,
      currentO3: 45.0,
      currentPM25: 12.0,
      currentPM10: 22.0
    });

    const statsNO2 = calculatePeriodStatistics(history.hourlyRecords, 'NO2');
    expect(statsNO2.mean).toBeGreaterThan(0);
    expect(statsNO2.max).toBeGreaterThanOrEqual(statsNO2.mean);
    expect(statsNO2.min).toBeLessThanOrEqual(statsNO2.mean);
    expect(statsNO2.p98).toBeGreaterThanOrEqual(statsNO2.p50);
    expect(statsNO2.whoLimit).toBe(10);
    expect(statsNO2.euLimit).toBe(40);
    expect(['descendente', 'estable', 'ascendente']).toContain(statsNO2.trendDirection);
  });

  it('is completely deterministic (two calls produce strictly identical outputs)', () => {
    const run1 = generateActivePoint7DayHistory({
      lat: 36.7180,
      lon: -4.4250,
      currentNO2: 29.3,
      currentO3: 54.1,
      currentPM25: 13.2,
      currentPM10: 24.5
    });

    const run2 = generateActivePoint7DayHistory({
      lat: 36.7180,
      lon: -4.4250,
      currentNO2: 29.3,
      currentO3: 54.1,
      currentPM25: 13.2,
      currentPM10: 24.5
    });

    expect(run1.hourlyRecords[50].no2).toBe(run2.hourlyRecords[50].no2);
    expect(run1.hourlyRecords[100].o3).toBe(run2.hourlyRecords[100].o3);
    expect(run1.dailySummaries[3].meanNO2).toBe(run2.dailySummaries[3].meanNO2);
  });

  it('supports multi-month ranges (30, 90 and 365 days) correctly', () => {
    const history30 = generateActivePoint7DayHistory({
      lat: 36.7196,
      lon: -4.4200,
      currentNO2: 30.0,
      currentO3: 45.0,
      currentPM25: 12.0,
      currentPM10: 22.0,
      daysCount: 30
    });

    const history365 = generateActivePoint7DayHistory({
      lat: 36.7196,
      lon: -4.4200,
      currentNO2: 30.0,
      currentO3: 45.0,
      currentPM25: 12.0,
      currentPM10: 22.0,
      daysCount: 365
    });

    expect(history30.hourlyRecords.length).toBe(720); // 30 * 24
    expect(history365.hourlyRecords.length).toBe(8760); // 365 * 24
    expect(history365.dailySummaries.length).toBe(365);
  });
});
