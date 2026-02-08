import { getDistance } from 'geolib';

/**
 * Validates if a staff member is within the allowed radius of their shop.
 * @param staffLat Current latitude of staff
 * @param staffLng Current longitude of staff
 * @param shopLat Target shop latitude
 * @param shopLng Target shop longitude
 * @param radius Allowed radius in meters
 */
export const checkGeofence = (
  staffLat: number,
  staffLng: number,
  shopLat: number,
  shopLng: number,
  radius: number
): boolean => {
  const distance = getDistance(
    { latitude: staffLat, longitude: staffLng },
    { latitude: shopLat, longitude: shopLng }
  );

  return distance <= radius;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount);
};