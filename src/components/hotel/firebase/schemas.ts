// src/components/hotel/firebase/schemas.ts

import { z } from 'zod';

/**
 * Schémas de validation partagés entre client et serveur.
 */

export const roomIdSchema = z
  .string()
  .regex(
    /^hotel_F[1-3]_(left|right)_R[0-4]$/,
    'Format d\'ID de chambre invalide. Attendu: hotel_F{1-3}_{left|right}_R{0-4}'
  );

export const pinSchema = z
  .string()
  .min(4, 'Le code doit avoir au moins 4 caractères')
  .max(8, 'Le code ne peut pas dépasser 8 caractères')
  .regex(/^\d+$/, 'Le code ne doit contenir que des chiffres');

export const temperatureSchema = z
  .number()
  .int()
  .min(16, 'Température minimum: 16°C')
  .max(28, 'Température maximum: 28°C');

export const accessTypeSchema = z.enum([
  'owner',
  'tenant',
  'guest',
  'staff',
  'maintenance',
]);

export const priceSchema = z
  .number()
  .min(0, 'Le prix ne peut pas être négatif');