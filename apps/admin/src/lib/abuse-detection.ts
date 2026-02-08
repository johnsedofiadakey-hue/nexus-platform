/**
 * 🛡️ NEXUS ABUSE DETECTION SYSTEM
 * Real-time anomaly detection for field operations.
 */

// Haversine Formula for distance (Meters)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (v: number) => (v * Math.PI) / 180;
    const a =
        Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 1. VELOCITY CHECK (Teleportation)
// Returns TRUE if speed is suspiciously high (e.g., > 200km/h implies GPS spoofing)
export function isTeleporting(
    prevLat: number, prevLng: number, prevTime: number,
    currLat: number, currLng: number, currTime: number
): boolean {
    if (!prevLat || !prevLng) return false; // No history

    const distanceMeters = calculateDistance(prevLat, prevLng, currLat, currLng);
    const timeDiffSeconds = (currTime - prevTime) / 1000;

    if (timeDiffSeconds <= 0) return true; // Time travel?

    const speedMps = distanceMeters / timeDiffSeconds;
    const speedKmph = speedMps * 3.6;

    // Threshold: 300km/h (Generous for flights, but impossible for local shops)
    return speedKmph > 300;
}

// 2. RAPID FIRE CHECK (Edge Hugging)
// Returns TRUE if sales are happening too fast (e.g., < 2 seconds between transactions)
export function isRapidFire(lastTransactionTime: Date): boolean {
    if (!lastTransactionTime) return false;

    const now = new Date();
    const diff = now.getTime() - new Date(lastTransactionTime).getTime();

    // Threshold: 2 seconds
    return diff < 2000;
}

// 3. ANOMALY SCORE
// Returns a risk score (0-100) based on factors
export function calculateRiskScore(saleAmount: number, avgSale: number, distance: number): number {
    let score = 0;

    // High Amount Deviation
    if (avgSale > 0 && saleAmount > avgSale * 5) score += 50;

    // GPS Drift (Too far from shop)
    if (distance > 200) score += 30; // 200m radius buffer

    return Math.min(score, 100);
}
