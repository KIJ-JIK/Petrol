import { DipChartEntry } from '../types/domain.js';

export class DipChartEngine {
  /**
   * Interpolate volume in litres from dip reading in mm using calibrated tank dip chart.
   */
  static interpolateVolume(dip_mm: number, chart: DipChartEntry[]): number {
    if (!chart || chart.length === 0) {
      throw new Error('No dip chart entries available for tank');
    }

    if (dip_mm <= 0) {
      return 0;
    }

    // Sort chart by dip_mm ascending
    const sorted = [...chart].sort((a, b) => a.dip_mm - b.dip_mm);

    // If dip is less than or equal to minimum recorded
    if (dip_mm <= sorted[0].dip_mm) {
      const ratio = dip_mm / sorted[0].dip_mm;
      return Math.round(sorted[0].volume_litres * ratio * 100) / 100;
    }

    // If dip is greater than or equal to maximum recorded
    const last = sorted[sorted.length - 1];
    if (dip_mm >= last.dip_mm) {
      return last.volume_litres;
    }

    // Find bounding entries [lower, upper]
    let lower = sorted[0];
    let upper = sorted[1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (dip_mm >= sorted[i].dip_mm && dip_mm <= sorted[i + 1].dip_mm) {
        lower = sorted[i];
        upper = sorted[i + 1];
        break;
      }
    }

    if (lower.dip_mm === upper.dip_mm) {
      return lower.volume_litres;
    }

    // Linear interpolation: v = v1 + (v2 - v1) * (d - d1) / (d2 - d1)
    const factor = (dip_mm - lower.dip_mm) / (upper.dip_mm - lower.dip_mm);
    const volume = lower.volume_litres + factor * (upper.volume_litres - lower.volume_litres);

    return Math.round(volume * 100) / 100;
  }
}
