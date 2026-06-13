// src/systems/jobs/duties/DealerDuty.ts

import { db } from "@/lib/firebase/config";
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { PoliceDuty } from "./PoliceDuty";

interface DrugType {
  id: string;
  name: string;
  buyPrice: number;     // prix d'achat en gros
  sellPrice: number;    // prix de vente rue
  processTime: number;  // minutes pour transformer
  wantedRisk: number;   // 0-1 chance de se faire repérer
}

const DRUG_CATALOG: DrugType[] = [
  {
    id: "weed",
    name: "Cannabis",
    buyPrice: 50,
    sellPrice: 120,
    processTime: 5,
    wantedRisk: 0.1,
  },
  {
    id: "coke",
    name: "Cocaïne",
    buyPrice: 200,
    sellPrice: 500,
    processTime: 10,
    wantedRisk: 0.3,
  },
  {
    id: "meth",
    name: "Méthamphétamine",
    buyPrice: 300,
    sellPrice: 800,
    processTime: 15,
    wantedRisk: 0.5,
  },
  {
    id: "pills",
    name: "Pilules",
    buyPrice: 80,
    sellPrice: 200,
    processTime: 3,
    wantedRisk: 0.15,
  },
];

export class DealerDuty {
  // ─── Acheter de la matière première ───────────────────────
  static async buySupply(
    playerUid: string,
    drugId: string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> {
    const drug = DRUG_CATALOG.find((d) => d.id === drugId);
    if (!drug) return { success: false, message: "❌ Drogue inconnue" };

    const totalCost = drug.buyPrice * quantity;

    // Vérifier l'argent
    const playerRef = doc(db, "players", playerUid);
    const playerSnap = await getDoc(playerRef);
    const cash = playerSnap.data()?.cashOnHand ?? 0;

    if (cash < totalCost) {
      return {
        success: false,
        message: `❌ Pas assez de cash! Besoin: $${totalCost}, tu as: $${cash}`,
      };
    }

    // Déduire l'argent + ajouter l'inventaire
    await updateDoc(playerRef, {
      cashOnHand: increment(-totalCost),
    });

    // Ajouter à l'inventaire
    await updateDoc(doc(db, "inventories", playerUid), {
      [`drugs.${drugId}`]: increment(quantity),
    });

    return {
      success: true,
      message: `🌿 Acheté ${quantity}x ${drug.name} pour $${totalCost}`,
    };
  }

  // ─── Vendre de la drogue à un joueur ──────────────────────
  static async sellToPlayer(
    dealerUid: string,
    buyerUid: string,
    drugId: string,
    quantity: number,
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    const drug = DRUG_CATALOG.find((d) => d.id === drugId);
    if (!drug) return { success: false, message: "❌ Drogue inconnue" };

    const totalPrice = drug.sellPrice * quantity;

    // Vérifier stock du dealer
    const invRef = doc(db, "inventories", dealerUid);
    const invSnap = await getDoc(invRef);
    const stock = invSnap.data()?.drugs?.[drugId] ?? 0;

    if (stock < quantity) {
      return {
        success: false,
        message: `❌ Stock insuffisant. Tu as: ${stock}x ${drug.name}`,
      };
    }

    // Vérifier argent du buyer
    const buyerRef = doc(db, "players", buyerUid);
    const buyerSnap = await getDoc(buyerRef);
    const buyerCash = buyerSnap.data()?.cashOnHand ?? 0;

    if (buyerCash < totalPrice) {
      return { success: false, message: "❌ L'acheteur n'a pas assez d'argent" };
    }

    // Transaction
    await updateDoc(invRef, { [`drugs.${drugId}`]: increment(-quantity) });
    await updateDoc(doc(db, "inventories", buyerUid), {
      [`drugs.${drugId}`]: increment(quantity),
    });
    await updateDoc(buyerRef, { cashOnHand: increment(-totalPrice) });
    await updateDoc(doc(db, "players", dealerUid), {
      cashOnHand: increment(totalPrice),
    });

    // Risque d'être repéré par la police!
    if (Math.random() < drug.wantedRisk) {
      socket.emit("police:alert", {
        type: "drug_sale",
        suspectUid: dealerUid,
        location: "Position suspecte détectée",
      });

      return {
        success: true,
        message: `🌿 Vendu ${quantity}x ${drug.name} pour $${totalPrice} ⚠️ ATTENTION: La police a été alertée!`,
      };
    }

    return {
      success: true,
      message: `🌿 Vendu ${quantity}x ${drug.name} pour $${totalPrice} — Transaction discrète ✅`,
    };
  }

  static getCatalog(): DrugType[] {
    return DRUG_CATALOG;
  }
}