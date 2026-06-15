// src/components/hotel/firebase/clientValidation.ts

/**
 * Validation côté client avant envoi serveur.
 * Réduit les allers-retours inutiles.
 */

export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin) return { valid: false, error: 'Code requis' };
  if (pin.length < 4) return { valid: false, error: 'Minimum 4 chiffres' };
  if (pin.length > 8) return { valid: false, error: 'Maximum 8 chiffres' };
  if (!/^\d+$/.test(pin)) return { valid: false, error: 'Chiffres uniquement' };
  return { valid: true };
}

export function validateTemperature(temp: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(temp)) return { valid: false, error: 'Entier requis' };
  if (temp < 16) return { valid: false, error: 'Minimum 16°C' };
  if (temp > 28) return { valid: false, error: 'Maximum 28°C' };
  return { valid: true };
}

export function validateRoomId(roomId: string): { valid: boolean; error?: string } {
  if (!roomId) return { valid: false, error: 'ID de chambre requis' };
  if (!/^hotel_F[1-3]_(left|right)_R[0-4]$/.test(roomId)) {
    return { valid: false, error: 'Format d\'ID invalide' };
  }
  return { valid: true };
}

export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (typeof price !== 'number') return { valid: false, error: 'Prix requis' };
  if (price < 0) return { valid: false, error: 'Prix ne peut pas être négatif' };
  if (!Number.isFinite(price)) return { valid: false, error: 'Prix invalide' };
  return { valid: true };
}

export function validateDateRange(
  checkIn: string,
  checkOut: string
): { valid: boolean; error?: string } {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (isNaN(inDate.getTime())) return { valid: false, error: 'Date d\'arrivée invalide' };
  if (isNaN(outDate.getTime())) return { valid: false, error: 'Date de départ invalide' };
  if (outDate <= inDate) return { valid: false, error: 'Le départ doit être après l\'arrivée' };
  if (inDate < new Date()) return { valid: false, error: 'L\'arrivée ne peut pas être dans le passé' };

  return { valid: true };
}