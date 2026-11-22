// OXYSYNC 2.0 Deterministic Physics & Depletion Prediction Engine
// Based on Boyle's Gas Law & Van der Waals / Real Gas Compressibility Correction
// Duration: T = V_gas / FlowRate

export interface ConsumptionPoint {
  timeOffsetMin: number;
  timeLabel: string;
  primaryPercent: number;
  secondaryPercent: number;
  reservePercent: number;
  combinedPercent: number;
}

export const BAR_TO_PSI = 14.5038;

/**
 * Calculates remaining gas in liters given pressure and water capacity.
 * Includes compressibility factor Z ≈ 0.96 for compressed O2 at 150 bar, 20°C.
 */
export function calculateGasVolume(pressureBar: number, waterCapacityLiters: number, zFactor = 0.96): number {
  if (pressureBar <= 0 || waterCapacityLiters <= 0) return 0;
  // Volume at 1 atm NTP (accounting for compressibility)
  return Math.max(0, (pressureBar / zFactor) * waterCapacityLiters);
}

/**
 * Calculates remaining duration in minutes at specified flow rate.
 */
export function calculateRuntimeMinutes(gasVolumeLiters: number, flowRateLpm: number): number {
  if (flowRateLpm <= 0) return 9999;
  return Math.max(0, gasVolumeLiters / flowRateLpm);
}

/**
 * Formats high-precision countdown string: "HH:MM:SS.s"
 */
export function formatPrecisionCountdown(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return '00:00:00.0';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds % 1) * 10);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

/**
 * Generates future timestamp string given remaining minutes from now.
 */
export function formatDepletionTimestamp(minutesFromNow: number): string {
  if (!isFinite(minutesFromNow) || minutesFromNow > 2880) return 'Over 48 hours';
  if (minutesFromNow <= 0) return 'Depleted';
  
  const now = new Date();
  const future = new Date(now.getTime() + minutesFromNow * 60 * 1000);
  
  const hours = future.getHours().toString().padStart(2, '0');
  const minutes = future.getMinutes().toString().padStart(2, '0');
  const seconds = future.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Computes exact state at any arbitrary timeline minute offset for Interactive Time Machine
 */
export function calculateStateAtTimelineOffset(
  offsetMinutes: number,
  primaryMaxLiters: number,
  secondaryMaxLiters: number,
  reserveMaxLiters: number,
  flowRateLpm: number,
  thresholdPercent: number
) {
  const thresholdLiters = (thresholdPercent / 100) * primaryMaxLiters;
  let curPrimary = primaryMaxLiters;
  let curSecondary = secondaryMaxLiters;
  let curReserve = reserveMaxLiters;
  let activeSrc: 'primary' | 'secondary' | 'reserve' | 'none' = 'primary';

  const totalConsumed = flowRateLpm * offsetMinutes;

  if (totalConsumed < (primaryMaxLiters - thresholdLiters)) {
    curPrimary -= totalConsumed;
    activeSrc = 'primary';
  } else {
    // Primary reached threshold!
    curPrimary = thresholdLiters;
    const remainingToConsume = totalConsumed - (primaryMaxLiters - thresholdLiters);

    if (remainingToConsume < secondaryMaxLiters) {
      curSecondary -= remainingToConsume;
      activeSrc = 'secondary';
    } else {
      // Secondary depleted!
      curSecondary = 0;
      const reserveToConsume = remainingToConsume - secondaryMaxLiters;

      if (reserveToConsume < reserveMaxLiters) {
        curReserve -= reserveToConsume;
        activeSrc = 'reserve';
      } else {
        curReserve = 0;
        activeSrc = 'none';
      }
    }
  }

  return {
    offsetMinutes,
    primaryPercent: Math.max(0, Math.round((curPrimary / primaryMaxLiters) * 100)),
    secondaryPercent: Math.max(0, Math.round((curSecondary / secondaryMaxLiters) * 100)),
    reservePercent: Math.max(0, Math.round((curReserve / reserveMaxLiters) * 100)),
    activeSrc
  };
}

/**
 * Generates predictive consumption curve points for Recharts.
 */
export function generatePredictiveTrend(
  primaryGasLiters: number,
  secondaryGasLiters: number,
  reserveGasLiters: number,
  flowRateLpm: number,
  switchingThresholdPercent: number,
  primaryMaxLiters: number,
  secondaryMaxLiters: number,
  reserveMaxLiters: number,
  intervals = 16,
  stepMinutes = 15
): ConsumptionPoint[] {
  const points: ConsumptionPoint[] = [];
  let curPrimary = primaryGasLiters;
  let curSecondary = secondaryGasLiters;
  let curReserve = reserveGasLiters;

  const thresholdLiters = (switchingThresholdPercent / 100) * primaryMaxLiters;

  for (let i = 0; i <= intervals; i++) {
    const timeOffsetMin = i * stepMinutes;
    const now = new Date();
    const pointTime = new Date(now.getTime() + timeOffsetMin * 60 * 1000);
    const timeLabel = `${pointTime.getHours().toString().padStart(2, '0')}:${pointTime.getMinutes().toString().padStart(2, '0')}`;

    const primPct = Math.max(0, Math.round((curPrimary / primaryMaxLiters) * 100));
    const secPct = Math.max(0, Math.round((curSecondary / secondaryMaxLiters) * 100));
    const resPct = Math.max(0, Math.round((curReserve / reserveMaxLiters) * 100));

    const totalCurrent = curPrimary + curSecondary + curReserve;
    const totalMax = primaryMaxLiters + secondaryMaxLiters + reserveMaxLiters;
    const combPct = Math.max(0, Math.round((totalCurrent / totalMax) * 100));

    points.push({
      timeOffsetMin,
      timeLabel,
      primaryPercent: primPct,
      secondaryPercent: secPct,
      reservePercent: resPct,
      combinedPercent: combPct
    });

    // Advance consumption by stepMinutes
    const consumedLiters = flowRateLpm * stepMinutes;
    
    // First consume primary until threshold
    if (curPrimary > thresholdLiters) {
      const take = Math.min(consumedLiters, curPrimary - thresholdLiters);
      curPrimary -= take;
      const remainder = consumedLiters - take;
      if (remainder > 0 && curSecondary > 0) {
        curSecondary = Math.max(0, curSecondary - remainder);
      }
    } else if (curSecondary > 0) {
      curSecondary = Math.max(0, curSecondary - consumedLiters);
    } else if (curReserve > 0) {
      curReserve = Math.max(0, curReserve - consumedLiters);
    }
  }

  return points;
}
