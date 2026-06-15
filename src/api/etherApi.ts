/**
 * src/api/etherApi.ts
 * 
 * Pont Client Officiel (API React) vers le Serveur Node.js Autoritaire.
 * Reçoit le jeton `idToken` de Firebase et exécute les 9 requêtes sensibles de gameplay
 * conformément au principe "Le client demande, le serveur vérifie et décide".
 */

import { FirebaseAuthClient } from '../lib/firebase/firebaseClient';
import type { PlayerDocument, InventoryItem, VehicleDocument, PropertyDocument } from '../lib/firebase/firestoreSchema';

/**
 * Helper unifié pour envoyer une requête authentifiée au backend Express
 */
async function fetchSecure<T>(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<T> {
  const token = await FirebaseAuthClient.getIdToken();
  if (!token) {
    throw new Error("Authentification Firebase requise pour communiquer avec le serveur.");
  }

  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Erreur réseau inconnue." }));
    throw new Error(errorData.error || `Erreur serveur HTTP ${response.status}`);
  }

  return await response.json() as T;
}

/**
 * Client API d'Orchestration Gameplay
 */
export class EtherNodeApiClient {
  /**
   * 1. Sauvegarde pure de la position et de l'orientation
   */
  static async savePlayerPosition(
    position: [number, number, number],
    rotation: [number, number, number],
    currentZone: string
  ): Promise<{ status: string; savedAt: number }> {
    return await fetchSecure("/api/player/save-position", "POST", { position, rotation, currentZone });
  }

  /**
   * 2. Mise à jour autoritaire des constantes de survie (Santé, faim, soif, stress)
   */
  static async updatePlayerSurvivalStatus(
    status: Partial<Pick<PlayerDocument, 'health' | 'armor' | 'hunger' | 'thirst' | 'stamina' | 'stress'>>
  ): Promise<{ status: string; updatedAt: number }> {
    return await fetchSecure("/api/player/update-status", "POST", { status });
  }

  /**
   * 3. Déplacer un objet dans les slots de l'inventaire
   */
  static async moveInventoryItem(fromIndex: number, toIndex: number): Promise<{ status: string }> {
    return await fetchSecure("/api/inventory/move-item", "POST", { fromIndex, toIndex });
  }

  /**
   * 4. Utiliser un objet consommable ou clé
   */
  static async useInventoryItem(itemId: string, targetEntityId?: string): Promise<{ status: string; message: string }> {
    return await fetchSecure("/api/inventory/use-item", "POST", { itemId, targetEntityId });
  }

  /**
   * 5. Demander le spawn d'un véhicule
   */
  static async spawnVehicle(model: string, spawnPos: [number, number, number]): Promise<{ status: string; vehicle: VehicleDocument }> {
    return await fetchSecure("/api/vehicle/spawn", "POST", { model, spawnPos });
  }

  /**
   * 6. Sauvegarder l'état et condition mécanique d'un véhicule
   */
  static async saveVehicleState(vehicleId: string, updates: Partial<VehicleDocument>): Promise<{ status: string }> {
    return await fetchSecure("/api/vehicle/save", "POST", { vehicleId, updates });
  }

  /**
   * 7. Verrouiller ou déverrouiller une propriété / porte
   */
  static async lockProperty(propertyId: string, lockState: boolean): Promise<{ status: string; new_state: boolean }> {
    return await fetchSecure("/api/property/lock", "POST", { propertyId, lockState });
  }

  /**
   * 8. Verser un salaire (Job Pay)
   */
  static async requestJobPay(job: PlayerDocument['job']): Promise<{ status: string; amountPaid: number; newBank: number }> {
    return await fetchSecure("/api/job/pay", "POST", { job });
  }

  /**
   * 9. Commande Modération : Banning
   */
  static async executeAdminBan(targetUid: string, reason: string): Promise<{ status: string; auditId: string }> {
    return await fetchSecure("/api/admin/ban", "POST", { targetUid, reason });
  }

  /**
   * 10. Magasins Accessibles : Achat d'équipement In-Character
   */
  static async buyShopItem(spec: { itemId: string; name: string; price: number; weight: number; definitionId: string }): Promise<{ status: string; newCash: number; itemPurchased: string }> {
    return await fetchSecure("/api/player/inventory/buy", "POST", spec);
  }

  /**
   * 11. Opérations Autoritaires de Banques et Guichets Automatiques
   */
  static async executeBankOperation(spec: { action: 'deposit' | 'withdraw' | 'transfer'; amount: number; targetUid?: string }): Promise<{ status: string; newCash: number; newBank: number }> {
    return await fetchSecure("/api/player/bank/transfer", "POST", spec);
  }

  /**
   * 12. Négociation Boursière Maîtresse sur le Marché
   */
  static async executeMarketTrade(spec: { tradeType: 'buy' | 'sell'; resourceName: string; totalValue: number }): Promise<{ status: string; newBank: number }> {
    return await fetchSecure("/api/player/market/trade", "POST", spec);
  }
}
