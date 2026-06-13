/**
 * EconomySystem.ts
 * ----------------------------------------------------------------------------
 * Économie avancée : porte-monnaie (cash), banque, transferts, taxes,
 * historique de transactions, intérêts.
 *
 *  - Soldes cash + banque par joueur
 *  - deposit / withdraw / transfer (avec taxe configurable)
 *  - pay entre joueurs
 *  - Historique des transactions (audit économique)
 *  - applyInterest() sur les comptes bancaires
 *  - Sérialisable
 * ----------------------------------------------------------------------------
 */

export interface Account {
  id: string;
  cash: number;
  bank: number;
}

export type TxType =
  | "give"
  | "set"
  | "deposit"
  | "withdraw"
  | "transfer_out"
  | "transfer_in"
  | "tax"
  | "interest";

export interface Transaction {
  id: string;
  type: TxType;
  from?: string;
  to?: string;
  amount: number;
  /** Solde résultant pour l'acteur principal. */
  balanceAfter: number;
  reason?: string;
  timestamp: number;
}

export interface EconomyState {
  accounts: Account[];
  transactions: Transaction[];
}

export interface EconomyOptions {
  /** Taux de taxe sur les transferts (0.05 = 5%). */
  transferTaxRate?: number;
  /** Taux d'intérêt bancaire par application (0.01 = 1%). */
  interestRate?: number;
  /** Solde initial des nouveaux comptes. */
  startingCash?: number;
  /** Limite de l'historique de transactions. */
  txLimit?: number;
}

export class EconomySystem {
  private accounts = new Map<string, Account>();
  private transactions: Transaction[] = [];
  private seq = 0;

  private taxRate: number;
  private interestRate: number;
  private startingCash: number;
  private txLimit: number;

  constructor(options?: EconomyOptions) {
    this.taxRate = options?.transferTaxRate ?? 0.05;
    this.interestRate = options?.interestRate ?? 0.01;
    this.startingCash = options?.startingCash ?? 0;
    this.txLimit = options?.txLimit ?? 50_000;
  }

  // --- Comptes ------------------------------------------------------------ //

  private account(id: string): Account {
    let acc = this.accounts.get(id);
    if (!acc) {
      acc = { id, cash: this.startingCash, bank: 0 };
      this.accounts.set(id, acc);
    }
    return acc;
  }

  getBalance(id: string): { cash: number; bank: number; total: number } {
    const a = this.account(id);
    return { cash: a.cash, bank: a.bank, total: a.cash + a.bank };
  }

  private record(tx: Omit<Transaction, "id" | "timestamp">): Transaction {
    const t: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${this.seq++}`,
      timestamp: Date.now(),
    };
    this.transactions.push(t);
    if (this.transactions.length > this.txLimit) {
      this.transactions.splice(0, this.transactions.length - this.txLimit);
    }
    return t;
  }

  // --- Opérations admin --------------------------------------------------- //

  give(id: string, amount: number, reason = "admin"): Transaction {
    if (amount <= 0) throw new Error("Le montant doit être positif.");
    const a = this.account(id);
    a.cash += amount;
    return this.record({ type: "give", to: id, amount, balanceAfter: a.cash, reason });
  }

  set(id: string, amount: number, reason = "admin"): Transaction {
    if (amount < 0) throw new Error("Le montant ne peut être négatif.");
    const a = this.account(id);
    a.cash = amount;
    return this.record({ type: "set", to: id, amount, balanceAfter: a.cash, reason });
  }

  // --- Banque ------------------------------------------------------------- //

  deposit(id: string, amount: number): Transaction {
    if (amount <= 0) throw new Error("Le montant doit être positif.");
    const a = this.account(id);
    if (a.cash < amount) throw new Error("Fonds insuffisants en liquide.");
    a.cash -= amount;
    a.bank += amount;
    return this.record({ type: "deposit", from: id, amount, balanceAfter: a.bank });
  }

  withdraw(id: string, amount: number): Transaction {
    if (amount <= 0) throw new Error("Le montant doit être positif.");
    const a = this.account(id);
    if (a.bank < amount) throw new Error("Fonds insuffisants en banque.");
    a.bank -= amount;
    a.cash += amount;
    return this.record({ type: "withdraw", to: id, amount, balanceAfter: a.cash });
  }

  // --- Transferts entre joueurs ------------------------------------------ //

  /**
   * Transfère du cash de `from` vers `to`, en prélevant une taxe.
   * Retourne { net, tax } et enregistre les transactions.
   */
  transfer(
    from: string,
    to: string,
    amount: number
  ): { net: number; tax: number; outTx: Transaction; inTx: Transaction } {
    if (from === to) throw new Error("Émetteur et destinataire identiques.");
    if (amount <= 0) throw new Error("Le montant doit être positif.");
    const src = this.account(from);
    if (src.cash < amount) throw new Error("Fonds insuffisants.");

    const tax = Math.round(amount * this.taxRate);
    const net = amount - tax;
    const dst = this.account(to);

    src.cash -= amount;
    dst.cash += net;

    const outTx = this.record({
      type: "transfer_out",
      from,
      to,
      amount,
      balanceAfter: src.cash,
    });
    if (tax > 0) {
      this.record({ type: "tax", from, amount: tax, balanceAfter: src.cash, reason: "transfer tax" });
    }
    const inTx = this.record({
      type: "transfer_in",
      from,
      to,
      amount: net,
      balanceAfter: dst.cash,
    });
    return { net, tax, outTx, inTx };
  }

  /** Applique les intérêts à tous les comptes bancaires. */
  applyInterest(): { totalPaid: number; accounts: number } {
    let totalPaid = 0;
    let count = 0;
    for (const a of this.accounts.values()) {
      if (a.bank <= 0) continue;
      const interest = Math.round(a.bank * this.interestRate);
      if (interest <= 0) continue;
      a.bank += interest;
      totalPaid += interest;
      count++;
      this.record({ type: "interest", to: a.id, amount: interest, balanceAfter: a.bank });
    }
    return { totalPaid, accounts: count };
  }

  // --- Audit / classement ------------------------------------------------- //

  getTransactions(id?: string, limit = 50): Transaction[] {
    const list = id
      ? this.transactions.filter((t) => t.from === id || t.to === id)
      : this.transactions;
    return list.slice(-limit).reverse();
  }

  /** Top N joueurs les plus riches (cash + bank). */
  leaderboard(top = 10): { id: string; total: number }[] {
    return Array.from(this.accounts.values())
      .map((a) => ({ id: a.id, total: a.cash + a.bank }))
      .sort((x, y) => y.total - x.total)
      .slice(0, top);
  }

  // --- Sérialisation ------------------------------------------------------ //

  toState(): EconomyState {
    return {
      accounts: Array.from(this.accounts.values()).map((a) => ({ ...a })),
      transactions: [...this.transactions],
    };
  }

  loadState(state: EconomyState): void {
    this.accounts = new Map((state.accounts ?? []).map((a) => [a.id, { ...a }]));
    this.transactions = [...(state.transactions ?? [])];
  }
}

export default EconomySystem;
