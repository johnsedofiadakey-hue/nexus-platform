/**
 * NEXUS SCORING ENGINE v1.0
 * Weights: 
 * - Attendance: 40% (Integrity)
 * - Conversion: 30% (Skill)
 * - Revenue: 30% (Impact)
 */

export function calculateNexusScore(
  attendanceRate: number, // 0 to 100
  conversionRate: number, // 0 to 100
  revenue: number,
  targetRevenue: number
): number {
  // Normalize revenue score (capped at 100)
  const revenueScore = Math.min((revenue / targetRevenue) * 100, 100);

  const weightedScore = 
    (attendanceRate * 0.4) + 
    (conversionRate * 0.3) + 
    (revenueScore * 0.3);

  return Math.round(weightedScore);
}