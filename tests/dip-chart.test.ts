import { describe, it, expect } from 'vitest';
import { DipChartEngine } from '../src/core/domain/dip-chart.js';
import { DipChartEntry } from '../src/core/types/domain.js';

describe('DipChartEngine', () => {
  const sampleChart: DipChartEntry[] = [
    { id: '1', tank_id: 't1', dip_mm: 500, volume_litres: 3500 },
    { id: '2', tank_id: 't1', dip_mm: 1000, volume_litres: 8000 },
    { id: '3', tank_id: 't1', dip_mm: 1500, volume_litres: 13000 },
    { id: '4', tank_id: 't1', dip_mm: 2000, volume_litres: 18500 },
  ];

  it('interpolates intermediate dip level accurately', () => {
    // Dip 1250 mm is exactly halfway between 1000 mm (8000 L) and 1500 mm (13000 L)
    // Expected volume: 8000 + 0.5 * (13000 - 8000) = 8000 + 2500 = 10,500 L
    const volume = DipChartEngine.interpolateVolume(1250, sampleChart);
    expect(volume).toBe(10500);
  });

  it('handles exact chart points', () => {
    const volume = DipChartEngine.interpolateVolume(1000, sampleChart);
    expect(volume).toBe(8000);
  });

  it('handles zero or negative dip gracefully', () => {
    expect(DipChartEngine.interpolateVolume(0, sampleChart)).toBe(0);
    expect(DipChartEngine.interpolateVolume(-10, sampleChart)).toBe(0);
  });

  it('caps at maximum chart capacity', () => {
    expect(DipChartEngine.interpolateVolume(2500, sampleChart)).toBe(18500);
  });
});
