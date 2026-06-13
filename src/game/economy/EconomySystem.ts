// src/game/economy/EconomySystem.ts

import * as THREE from 'three';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════
//  TYPES — ECONOMY
// ═══════════════════════════════════════════════════════════════

export type Currency = 'CAD' | 'USD' | 'EUR' | 'CRYPTO';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'salary'
  | 'purchase'
  | 'sale'
  | 'fine'
  | 'tax'
  | 'loan'
  | 'repayment';

export type TransactionCategory =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'loan'
  | 'bill'
  | 'investment'
  | 'illegal';

export type InvoiceType =
  | 'rent'
  | 'electricity'
  | 'water'
  | 'internet'
  | 'phone'
  | 'insurance'
  | 'property_tax'
  | 'vehicle_tax';

export type LoanType = 'personal' | 'mortgage' | 'vehicle' | 'business';

export type LoanStatus = 'active' | 'paid' | 'defaulted';

export type AccountKey = 'checking' | 'savings' | 'crypto';

// ═══════════════════════════════════════════════════════════════
//  TYPES — JOBS
// ═══════════════════════════════════════════════════════════════

export type JobType =
  | 'police_officer'
  | 'firefighter'
  | 'paramedic'
  | 'couche_tard_clerk'
  | 'esso_attendant'
  | 'mechanic'
  | 'taxi_driver'
  | 'bus_driver'
  | 'delivery_driver'
  | 'bartender'
  | 'chef'
  | 'construction_worker'
  | 'farmer'
  | 'fisherman'
  | 'lumberjack'
  | 'miner'
  | 'security_guard'
  | 'lawyer'
  | 'doctor'
  | 'real_estate_agent'
  | 'drug_dealer'
  | 'arms_dealer'
  | 'hacker'
  | 'hitman';

export type JobSalaryType = 'hourly' | 'salary' | 'commission' | 'illegal';

export type TaskType =
  | 'delivery'
  | 'repair'
  | 'combat'
  | 'social'
  | 'crafting'
  | 'investigation';

export type BenefitType =
  | 'health_insurance'
  | 'dental'
  | 'retirement'
  | 'vehicle'
  | 'housing'
  | 'discount'
  | 'bonus';

export type RiskType = 'injury' | 'legal' | 'reputation' | 'death';

export type VehicleType =
  | 'police'
  | 'ambulance'
  | 'fire_truck'
  | 'taxi'
  | 'bus'
  | 'van'
  | 'truck'
  | 'motorcycle';

export type CryptoSymbol = 'BTC' | 'ETH' | 'SOL';

// ═══════════════════════════════════════════════════════════════
//  INTERFACES — ECONOMY
// ═══════════════════════════════════════════════════════════════

export interface AccountInfo {
  balance:       number;
  interestRate:  number;
  accountNumber: string;
  routingNumber: string;
  institution:   string;
}

export interface Transaction {
  id:          string;
  date:        Date;
  type:        TransactionType;
  amount:      number;
  currency:    Currency;
  from:        string;
  to:          string;
  description: string;
  category:    TransactionCategory;
  /** Balance du compte après cette transaction */
  balance:     number;
}

export interface Invoice {
  id:          string;
  date:        Date;
  dueDate:     Date;
  amount:      number;
  paid:        boolean;
  paidDate?:   Date;
  type:        InvoiceType;
  description: string;
}

export interface Loan {
  id:               string;
  amount:           number;
  remaining:        number;
  interestRate:     number;
  termMonths:       number;
  monthlyPayment:   number;
  startDate:        Date;
  nextPaymentDate:  Date;
  type:             LoanType;
  status:           LoanStatus;
}

export interface CreditCard {
  id:              string;
  number:          string;
  limit:           number;
  balance:         number;
  interestRate:    number;
  dueDate:         Date;
  minimumPayment:  number;
}

export interface EconomyStats {
  totalEarned:     number;
  totalSpent:      number;
  totalSaved:      number;
  creditScore:     number;
  monthlyIncome:   number;
  monthlyExpenses: number;
}

// ── Operation results ──────────────────────────────────────────

export interface OperationResult {
  success: boolean;
  reason?: string;
  amount?: number;
}

// ═══════════════════════════════════════════════════════════════
//  INTERFACES — JOBS
// ═══════════════════════════════════════════════════════════════

export interface JobTask {
  id:           string;
  name:         string;
  description:  string;
  reward:       number;
  difficulty:   number;
  timeRequired: number; // Minutes
  type:         TaskType;
  xpReward:     number;
}

export interface JobBenefit {
  type:  BenefitType;
  value: string;
}

export interface JobRisk {
  type:        RiskType;
  probability: number; // 0–1
  severity:    number; // 1–10
}

export interface JobConfig {
  id:           string;
  type:         JobType;
  name:         string;
  description:  string;
  salary:       number; // Par heure
  salaryType:   JobSalaryType;
  minLevel:     number;
  workHours:    { start: number; end: number };
  location:     THREE.Vector3;
  uniform:      string;
  vehicle:      VehicleType | null;
  tasks:        JobTask[];
  benefits:     JobBenefit[];
  risks:        JobRisk[];
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TRANSACTION_HISTORY_MAX = 500;
const CREDIT_SCORE_MIN = 300;
const CREDIT_SCORE_MAX = 900;
const CREDIT_SCORE_CC_HIGH_THRESHOLD = 0.3;
const CREDIT_SCORE_CC_VERY_HIGH_THRESHOLD = 0.5;
const LOAN_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

const DEFAULT_ECONOMY_STATS: EconomyStats = {
  totalEarned:     0,
  totalSpent:      0,
  totalSaved:      0,
  creditScore:     750,
  monthlyIncome:   0,
  monthlyExpenses: 0,
};

// ═══════════════════════════════════════════════════════════════
//  PURE HELPERS
// ═══════════════════════════════════════════════════════════════

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function msFromNow(ms: number): Date {
  return new Date(Date.now() + ms);
}

function makeTransaction(
  type: TransactionType,
  amount: number,
  from: string,
  to: string,
  description: string,
  category: TransactionCategory,
  balanceAfter: number,
  currency: Currency = 'CAD'
): Transaction {
  return {
    id: generateId('tx'),
    date: new Date(),
    type,
    amount,
    currency,
    from,
    to,
    description,
    category,
    balance: balanceAfter,
  };
}

// ═══════════════════════════════════════════════════════════════
//  ECONOMY STORE
// ═══════════════════════════════════════════════════════════════

interface EconomyStore {
  accounts:     Record<AccountKey, AccountInfo>;
  transactions: Transaction[];
  invoices:     Invoice[];
  loans:        Loan[];
  creditCards:  CreditCard[];
  stats:        EconomyStats;

  // ── Core ────────────────────────────────────────────────────
  addMoney:     (amount: number, account: AccountKey, description: string, category?: TransactionCategory) => void;
  removeMoney:  (amount: number, account: AccountKey, description: string, category?: TransactionCategory) => OperationResult;
  transfer:     (from: AccountKey, to: AccountKey, amount: number, description?: string) => OperationResult;

  // ── Bills ───────────────────────────────────────────────────
  addInvoice:   (invoice: Omit<Invoice, 'id'>) => string;
  payInvoice:   (invoiceId: string) => OperationResult;
  getUnpaidInvoices: () => Invoice[];
  getOverdueInvoices: () => Invoice[];

  // ── Loans ───────────────────────────────────────────────────
  takeLoan:         (config: Omit<Loan, 'id' | 'status' | 'startDate' | 'nextPaymentDate'>) => OperationResult;
  makeLoanPayment:  (loanId: string) => OperationResult;
  defaultLoan:      (loanId: string) => void;
  getActiveLoanTotal: () => number;

  // ── Credit cards ────────────────────────────────────────────
  useCreditCard:    (cardId: string, amount: number, description: string) => OperationResult;
  payCreditCard:    (cardId: string, amount: number) => OperationResult;
  getCCUtilization: () => number;

  // ── Credit score ────────────────────────────────────────────
  updateCreditScore: () => number;

  // ── Queries ─────────────────────────────────────────────────
  getNetWorth:   () => number;
  getBalance:    (account: AccountKey) => number;
}

export const useEconomyStore = create<EconomyStore>()(
  persist(
    (set, get) => ({
      accounts: {
        checking: {
          balance:       5_000,
          interestRate:  0.01,
          accountNumber: '****1234',
          routingNumber: '0001-0002',
          institution:   'Banque Nationale du Québec',
        },
        savings: {
          balance:       25_000,
          interestRate:  0.025,
          accountNumber: '****5678',
          routingNumber: '0001-0003',
          institution:   'Banque Nationale du Québec',
        },
        crypto: {
          balance:       2.5,
          interestRate:  0,
          accountNumber: '0x1234...5678',
          routingNumber: 'N/A',
          institution:   'CryptoExchange QC',
        },
      },

      transactions: [],
      invoices:     [],
      loans:        [],
      creditCards: [
        {
          id:             'cc_visa_1',
          number:         '**** **** **** 9012',
          limit:          10_000,
          balance:        0,
          interestRate:   0.1999,
          dueDate:        msFromNow(30 * 24 * 60 * 60 * 1000),
          minimumPayment: 0,
        },
      ],
      stats: { ...DEFAULT_ECONOMY_STATS },

      // ── Core ──────────────────────────────────────────────────

      addMoney: (amount, account, description, category = 'income') => {
        if (amount <= 0) return;

        set((state) => {
          const newBalance = state.accounts[account].balance + amount;
          const tx = makeTransaction(
            'deposit', amount, 'External', account,
            description, category, newBalance
          );

          return {
            accounts: {
              ...state.accounts,
              [account]: { ...state.accounts[account], balance: newBalance },
            },
            transactions: [tx, ...state.transactions].slice(0, TRANSACTION_HISTORY_MAX),
            stats: {
              ...state.stats,
              totalEarned:   state.stats.totalEarned + amount,
              monthlyIncome: state.stats.monthlyIncome + amount,
            },
          };
        });
      },

      removeMoney: (amount, account, description, category = 'expense') => {
        if (amount <= 0) return { success: false, reason: 'Montant invalide' };

        const { accounts } = get();
        if (accounts[account].balance < amount) {
          return {
            success: false,
            reason:  `Solde insuffisant — disponible: ${accounts[account].balance.toFixed(2)}$`,
          };
        }

        set((state) => {
          const newBalance = state.accounts[account].balance - amount;
          const tx = makeTransaction(
            'withdrawal', amount, account, 'External',
            description, category, newBalance
          );

          return {
            accounts: {
              ...state.accounts,
              [account]: { ...state.accounts[account], balance: newBalance },
            },
            transactions: [tx, ...state.transactions].slice(0, TRANSACTION_HISTORY_MAX),
            stats: {
              ...state.stats,
              totalSpent:      state.stats.totalSpent + amount,
              monthlyExpenses: state.stats.monthlyExpenses + amount,
            },
          };
        });

        return { success: true, amount };
      },

      transfer: (from, to, amount, description = `Virement ${from} → ${to}`) => {
        if (amount <= 0) return { success: false, reason: 'Montant invalide' };

        const { accounts } = get();
        if (accounts[from].balance < amount) {
          return { success: false, reason: 'Solde insuffisant pour le virement' };
        }
        if (from === to) {
          return { success: false, reason: 'Comptes source et destination identiques' };
        }

        set((state) => {
          const fromBalance = state.accounts[from].balance - amount;
          const toBalance   = state.accounts[to].balance   + amount;

          const txOut = makeTransaction('transfer', amount, from, to, description, 'transfer', fromBalance);
          const txIn  = makeTransaction('transfer', amount, from, to, description, 'transfer', toBalance);

          return {
            accounts: {
              ...state.accounts,
              [from]: { ...state.accounts[from], balance: fromBalance },
              [to]:   { ...state.accounts[to],   balance: toBalance   },
            },
            transactions: [txOut, txIn, ...state.transactions].slice(0, TRANSACTION_HISTORY_MAX),
          };
        });

        return { success: true, amount };
      },

      // ── Bills ────────────────────────────────────────────────

      addInvoice: (invoice) => {
        const id = generateId('inv');
        set((state) => ({
          invoices: [...state.invoices, { ...invoice, id }],
        }));
        return id;
      },

      payInvoice: (invoiceId) => {
        const { invoices } = get();
        const invoice = invoices.find((i) => i.id === invoiceId);

        if (!invoice) return { success: false, reason: 'Facture introuvable' };
        if (invoice.paid) return { success: false, reason: 'Facture déjà payée' };

        const result = get().removeMoney(
          invoice.amount,
          'checking',
          `Paiement facture: ${invoice.description}`,
          'bill'
        );

        if (result.success) {
          set((state) => ({
            invoices: state.invoices.map((i) =>
              i.id === invoiceId ? { ...i, paid: true, paidDate: new Date() } : i
            ),
          }));
        }

        return result;
      },

      getUnpaidInvoices: () => {
        return get().invoices.filter((i) => !i.paid);
      },

      getOverdueInvoices: () => {
        const now = Date.now();
        return get().invoices.filter((i) => !i.paid && i.dueDate.getTime() < now);
      },

      // ── Loans ────────────────────────────────────────────────

      takeLoan: (config) => {
        if (config.amount <= 0) return { success: false, reason: 'Montant invalide' };
        if (config.remaining <= 0) return { success: false, reason: 'Montant restant invalide' };

        const loan: Loan = {
          id:              generateId('loan'),
          ...config,
          status:          'active',
          startDate:       new Date(),
          nextPaymentDate: msFromNow(LOAN_PERIOD_MS),
        };

        set((state) => ({ loans: [...state.loans, loan] }));

        get().addMoney(loan.amount, 'checking', `Prêt ${loan.type}`, 'loan');

        return { success: true, amount: loan.amount };
      },

      makeLoanPayment: (loanId) => {
        const { loans } = get();
        const loan = loans.find((l) => l.id === loanId);

        if (!loan) return { success: false, reason: 'Prêt introuvable' };
        if (loan.status !== 'active') return { success: false, reason: `Prêt ${loan.status}` };

        const payment = Math.min(loan.monthlyPayment, loan.remaining);
        const result  = get().removeMoney(payment, 'checking', `Paiement prêt #${loanId.slice(-4)}`, 'loan');

        if (result.success) {
          const newRemaining = loan.remaining - payment;
          const newStatus: LoanStatus = newRemaining <= 0 ? 'paid' : 'active';

          set((state) => ({
            loans: state.loans.map((l) =>
              l.id === loanId
                ? {
                    ...l,
                    remaining:       Math.max(0, newRemaining),
                    nextPaymentDate: msFromNow(LOAN_PERIOD_MS),
                    status:          newStatus,
                  }
                : l
            ),
          }));
        }

        return result;
      },

      defaultLoan: (loanId) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === loanId ? { ...l, status: 'defaulted' } : l
          ),
        }));
        get().updateCreditScore();
      },

      getActiveLoanTotal: () => {
        return get().loans
          .filter((l) => l.status === 'active')
          .reduce((sum, l) => sum + l.remaining, 0);
      },

      // ── Credit cards ─────────────────────────────────────────

      useCreditCard: (cardId, amount, description) => {
        if (amount <= 0) return { success: false, reason: 'Montant invalide' };

        const { creditCards } = get();
        const card = creditCards.find((c) => c.id === cardId);

        if (!card) return { success: false, reason: 'Carte introuvable' };

        const available = card.limit - card.balance;
        if (amount > available) {
          return { success: false, reason: `Limite dépassée — disponible: ${available.toFixed(2)}$` };
        }

        set((state) => ({
          creditCards: state.creditCards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  balance:        c.balance + amount,
                  minimumPayment: Math.max(c.minimumPayment, Math.ceil((c.balance + amount) * 0.03)),
                }
              : c
          ),
        }));

        return { success: true, amount };
      },

      payCreditCard: (cardId, amount) => {
        if (amount <= 0) return { success: false, reason: 'Montant invalide' };

        const { creditCards } = get();
        const card = creditCards.find((c) => c.id === cardId);

        if (!card) return { success: false, reason: 'Carte introuvable' };

        const actualPayment = Math.min(amount, card.balance);
        const result = get().removeMoney(
          actualPayment,
          'checking',
          `Paiement carte ${card.number.slice(-4)}`,
          'bill'
        );

        if (result.success) {
          set((state) => ({
            creditCards: state.creditCards.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    balance:        Math.max(0, c.balance - actualPayment),
                    minimumPayment: Math.max(0, c.minimumPayment - actualPayment),
                  }
                : c
            ),
          }));
        }

        return result;
      },

      getCCUtilization: () => {
        const { creditCards } = get();
        const totalBalance = creditCards.reduce((s, c) => s + c.balance, 0);
        const totalLimit   = creditCards.reduce((s, c) => s + c.limit,   0);
        if (totalLimit === 0) return 0;
        return totalBalance / totalLimit;
      },

      // ── Credit score ─────────────────────────────────────────

      updateCreditScore: () => {
        let score = 0;

        set((state) => {
          score = state.stats.creditScore;

          // Paid invoices on time → +2 per invoice
          const paidInvoices = state.invoices.filter((i) => i.paid).length;
          score += paidInvoices * 2;

          // CC utilization
          const totalBalance = state.creditCards.reduce((s, c) => s + c.balance, 0);
          const totalLimit   = state.creditCards.reduce((s, c) => s + c.limit,   0);
          const utilization  = totalLimit > 0 ? totalBalance / totalLimit : 0;
          if (utilization > CREDIT_SCORE_CC_VERY_HIGH_THRESHOLD) score -= 50;
          else if (utilization > CREDIT_SCORE_CC_HIGH_THRESHOLD)  score -= 20;

          // Defaulted loans
          const defaulted = state.loans.filter((l) => l.status === 'defaulted').length;
          score -= defaulted * 100;

          // Overdue invoices
          const now = Date.now();
          const overdue = state.invoices.filter((i) => !i.paid && i.dueDate.getTime() < now).length;
          score -= overdue * 15;

          score = clamp(Math.round(score), CREDIT_SCORE_MIN, CREDIT_SCORE_MAX);

          return { stats: { ...state.stats, creditScore: score } };
        });

        return score;
      },

      // ── Queries ──────────────────────────────────────────────

      getNetWorth: () => {
        const { accounts, loans, creditCards } = get();
        const assets = Object.values(accounts).reduce((s, a) => s + a.balance, 0);
        const liabilities =
          loans.filter((l) => l.status === 'active').reduce((s, l) => s + l.remaining, 0) +
          creditCards.reduce((s, c) => s + c.balance, 0);
        return assets - liabilities;
      },

      getBalance: (account) => get().accounts[account].balance,
    }),
    {
      name:    'etherworld-economy',
      version: 2,
    }
  )
);

// ═══════════════════════════════════════════════════════════════
//  JOB STORE
// ═══════════════════════════════════════════════════════════════

interface JobStore {
  currentJobId:  string | null;
  jobHistory:    string[];
  experience:    Record<string, number>;
  skills:        Record<string, number>;
  isWorking:     boolean;
  currentTask:   JobTask | null;
  taskProgress:  number; // 0–100
  paychecks:     number;
  promotions:    number;
  level:         number;

  applyForJob:    (jobId: string) => boolean;
  quitJob:        () => void;
  startWork:      () => boolean;
  stopWork:       () => void;
  updateProgress: (delta: number) => void;
  completeTask:   () => void;
  getPromotion:   () => void;
  receivePaycheck: () => boolean;
  gainExperience: (jobId: string, amount: number) => void;
  getJobLevel:    (jobId: string) => number;
}

export const useJobStore = create<JobStore>((set, get) => ({
  currentJobId:  null,
  jobHistory:    [],
  experience:    {},
  skills:        {},
  isWorking:     false,
  currentTask:   null,
  taskProgress:  0,
  paychecks:     0,
  promotions:    0,
  level:         1,

  applyForJob: (jobId) => {
    const job = JOB_CATALOG.find((j) => j.id === jobId);
    if (!job) return false;

    const { level } = get();
    if (level < job.minLevel) return false;

    set((state) => ({
      currentJobId:  jobId,
      jobHistory:    state.currentJobId
        ? [...state.jobHistory, state.currentJobId]
        : state.jobHistory,
      isWorking:     false,
      currentTask:   null,
      taskProgress:  0,
    }));

    return true;
  },

  quitJob: () => {
    set((state) => ({
      jobHistory:    state.currentJobId
        ? [...state.jobHistory, state.currentJobId]
        : state.jobHistory,
      currentJobId:  null,
      isWorking:     false,
      currentTask:   null,
      taskProgress:  0,
    }));
  },

  startWork: () => {
    const { currentJobId } = get();
    const job = JOB_CATALOG.find((j) => j.id === currentJobId);
    if (!job || !job.tasks.length) return false;

    // Pick task weighted by difficulty vs player level
    const { level } = get();
    const affordable = job.tasks.filter((t) => t.difficulty <= level + 3);
    const pool = affordable.length > 0 ? affordable : job.tasks;
    const task = pool[Math.floor(Math.random() * pool.length)];

    set({ isWorking: true, currentTask: task, taskProgress: 0 });
    return true;
  },

  stopWork: () => {
    set({ isWorking: false, currentTask: null, taskProgress: 0 });
  },

  updateProgress: (delta) => {
    const { taskProgress, isWorking } = get();
    if (!isWorking) return;

    const newProgress = Math.min(100, taskProgress + delta);
    set({ taskProgress: newProgress });

    if (newProgress >= 100) {
      get().completeTask();
    }
  },

  completeTask: () => {
    const state = get();
    if (!state.currentTask || !state.currentJobId) return;

    const { currentTask, currentJobId } = state;

    // Pay the player
    useEconomyStore.getState().addMoney(
      currentTask.reward,
      'checking',
      `Tâche accomplie: ${currentTask.name}`,
      'income'
    );

    // Grant XP
    get().gainExperience(currentJobId, currentTask.xpReward);

    set({ taskProgress: 100 });

    // Start next task after a cooldown
    setTimeout(() => {
      if (get().isWorking) {
        get().startWork();
      }
    }, 2000);
  },

  getPromotion: () => {
    set((state) => ({
      promotions: state.promotions + 1,
      level:      state.level + 1,
    }));
  },

  receivePaycheck: () => {
    const { currentJobId } = get();
    const job = JOB_CATALOG.find((j) => j.id === currentJobId);
    if (!job) return false;

    const weeklyPay = job.salary * 40;

    useEconomyStore.getState().addMoney(
      weeklyPay,
      'checking',
      `Paie hebdomadaire: ${job.name}`,
      'income'
    );

    set((state) => ({ paychecks: state.paychecks + 1 }));
    return true;
  },

  gainExperience: (jobId, amount) => {
    set((state) => ({
      experience: {
        ...state.experience,
        [jobId]: (state.experience[jobId] ?? 0) + amount,
      },
    }));
  },

  getJobLevel: (jobId) => {
    const xp = get().experience[jobId] ?? 0;
    return Math.floor(Math.sqrt(xp / 10)) + 1;
  },
}));

// ═══════════════════════════════════════════════════════════════
//  JOB CATALOG
// ═══════════════════════════════════════════════════════════════

export const JOB_CATALOG: Readonly<JobConfig[]> = [

  // ── Légaux ──────────────────────────────────────────────────

  {
    id:          'job_couche_tard',
    type:        'couche_tard_clerk',
    name:        'Commis Couche-Tard',
    description: "Travaille au dépanneur Couche-Tard. Opère la caisse, gère l'inventaire et fais les slushs!",
    salary:      18,
    salaryType:  'hourly',
    minLevel:    1,
    workHours:   { start: 8, end: 16 },
    location:    new THREE.Vector3(20, 0, 0),
    uniform:     'Polo rouge Couche-Tard',
    vehicle:     null,
    tasks: [
      {
        id:           'task_caisse',
        name:         'Opérer la caisse',
        description:  'Sers les clients à la caisse',
        reward:       50,
        difficulty:   1,
        timeRequired: 30,
        type:         'social',
        xpReward:     10,
      },
      {
        id:           'task_inventory',
        name:         "Gérer l'inventaire",
        description:  'Réapprovisionne les tablettes',
        reward:       75,
        difficulty:   2,
        timeRequired: 45,
        type:         'crafting',
        xpReward:     15,
      },
      {
        id:           'task_slush',
        name:         'Préparer les slushs',
        description:  'Remplis les machines à slush',
        reward:       40,
        difficulty:   1,
        timeRequired: 15,
        type:         'crafting',
        xpReward:     8,
      },
      {
        id:           'task_cleaning',
        name:         'Nettoyer le magasin',
        description:  'Passe le balai et nettoie les réfrigérateurs',
        reward:       35,
        difficulty:   1,
        timeRequired: 20,
        type:         'crafting',
        xpReward:     5,
      },
    ],
    benefits: [
      { type: 'discount', value: "10% de rabais employé" },
      { type: 'bonus',    value: 'Slush gratuite!' },
    ],
    risks: [
      { type: 'injury', probability: 0.02, severity: 2 },
      { type: 'legal',  probability: 0.01, severity: 1 },
    ],
  },

  {
    id:          'job_mechanic',
    type:        'mechanic',
    name:        'Mécanicien',
    description: 'Répare et modifie des véhicules au garage du coin',
    salary:      25,
    salaryType:  'hourly',
    minLevel:    3,
    workHours:   { start: 9, end: 17 },
    location:    new THREE.Vector3(-15, 0, -5),
    uniform:     'Salopette de mécanicien',
    vehicle:     null,
    tasks: [
      {
        id:           'task_oil_change',
        name:         "Changement d'huile",
        description:  "Fais un changement d'huile complet",
        reward:       60,
        difficulty:   2,
        timeRequired: 30,
        type:         'repair',
        xpReward:     12,
      },
      {
        id:           'task_tire_change',
        name:         'Changement de pneus',
        description:  'Monte quatre pneus neufs',
        reward:       80,
        difficulty:   2,
        timeRequired: 40,
        type:         'repair',
        xpReward:     15,
      },
      {
        id:           'task_engine_repair',
        name:         'Réparation moteur',
        description:  'Répare un moteur défectueux',
        reward:       150,
        difficulty:   5,
        timeRequired: 120,
        type:         'repair',
        xpReward:     40,
      },
      {
        id:           'task_mod_install',
        name:         'Installer modification',
        description:  'Installe une pièce de performance',
        reward:       200,
        difficulty:   6,
        timeRequired: 90,
        type:         'crafting',
        xpReward:     50,
      },
      {
        id:           'task_diagnostics',
        name:         'Diagnostic électronique',
        description:  'Branche le scanner OBD2 et interprète les codes',
        reward:       90,
        difficulty:   4,
        timeRequired: 30,
        type:         'investigation',
        xpReward:     20,
      },
    ],
    benefits: [
      { type: 'discount', value: '20% sur les modifications' },
      { type: 'vehicle',  value: 'Utilisation du véhicule de courtoisie' },
      { type: 'bonus',    value: 'Primes sur les grosses réparations' },
    ],
    risks: [
      { type: 'injury', probability: 0.08, severity: 4 },
    ],
  },

  {
    id:          'job_police',
    type:        'police_officer',
    name:        'Policier Sûreté du Québec',
    description: "Protège et sers la communauté. Patrouille les rues et réponds aux appels d'urgence.",
    salary:      35,
    salaryType:  'salary',
    minLevel:    10,
    workHours:   { start: 6, end: 18 },
    location:    new THREE.Vector3(-15, 0, 8),
    uniform:     'Uniforme SQ',
    vehicle:     'police',
    tasks: [
      {
        id:           'task_patrol',
        name:         'Patrouille de routine',
        description:  'Patrouille les rues assignées',
        reward:       100,
        difficulty:   3,
        timeRequired: 60,
        type:         'investigation',
        xpReward:     20,
      },
      {
        id:           'task_traffic_stop',
        name:         'Interception routière',
        description:  'Arrête un véhicule en infraction',
        reward:       80,
        difficulty:   4,
        timeRequired: 15,
        type:         'social',
        xpReward:     15,
      },
      {
        id:           'task_arrest',
        name:         'Arrestation',
        description:  'Arrête un suspect recherché',
        reward:       300,
        difficulty:   8,
        timeRequired: 30,
        type:         'combat',
        xpReward:     60,
      },
      {
        id:           'task_investigation',
        name:         'Enquête criminelle',
        description:  'Enquête sur une scène de crime',
        reward:       250,
        difficulty:   6,
        timeRequired: 120,
        type:         'investigation',
        xpReward:     50,
      },
      {
        id:           'task_witness_interview',
        name:         'Interrogation de témoins',
        description:  'Prends les dépositions de témoins',
        reward:       120,
        difficulty:   4,
        timeRequired: 45,
        type:         'social',
        xpReward:     25,
      },
    ],
    benefits: [
      { type: 'health_insurance', value: 'Couverture complète CNESST' },
      { type: 'dental',           value: 'Couverture dentaire familiale' },
      { type: 'retirement',       value: 'Pension après 25 ans de service' },
      { type: 'vehicle',          value: 'Véhicule de patrouille assigné' },
      { type: 'bonus',            value: 'Prime de risque 15%' },
    ],
    risks: [
      { type: 'injury',     probability: 0.25, severity: 7 },
      { type: 'death',      probability: 0.03, severity: 10 },
      { type: 'reputation', probability: 0.10, severity: 4 },
    ],
  },

  {
    id:          'job_taxi_driver',
    type:        'taxi_driver',
    name:        'Chauffeur de Taxi',
    description: 'Transporte des passagers à travers la ville. Connais chaque rue sur le bout des doigts.',
    salary:      20,
    salaryType:  'commission',
    minLevel:    2,
    workHours:   { start: 0, end: 24 },
    location:    new THREE.Vector3(10, 0, -20),
    uniform:     'Chemise blanche et casquette',
    vehicle:     'taxi',
    tasks: [
      {
        id:           'task_pickup',
        name:         'Chercher un client',
        description:  'Récupère un client et amène-le à destination',
        reward:       40,
        difficulty:   1,
        timeRequired: 20,
        type:         'delivery',
        xpReward:     8,
      },
      {
        id:           'task_airport_run',
        name:         "Course à l'aéroport",
        description:  "Amène un client à l'aéroport Pierre-Elliott-Trudeau",
        reward:       120,
        difficulty:   2,
        timeRequired: 60,
        type:         'delivery',
        xpReward:     20,
      },
      {
        id:           'task_night_shift',
        name:         'Quart de nuit',
        description:  'Travaille le quart de nuit — clientèle agitée',
        reward:       80,
        difficulty:   4,
        timeRequired: 30,
        type:         'social',
        xpReward:     15,
      },
    ],
    benefits: [
      { type: 'vehicle',  value: 'Taxi fourni' },
      { type: 'bonus',    value: 'Pourboires inclus' },
    ],
    risks: [
      { type: 'injury',  probability: 0.06, severity: 4 },
      { type: 'legal',   probability: 0.05, severity: 2 },
    ],
  },

  {
    id:          'job_bartender',
    type:        'bartender',
    name:        'Barman',
    description: "Prépare des cocktails et sers les clients dans un bar branché du centre-ville.",
    salary:      22,
    salaryType:  'hourly',
    minLevel:    2,
    workHours:   { start: 17, end: 3 },
    location:    new THREE.Vector3(30, 0, 15),
    uniform:     'Chemise noire et tablier',
    vehicle:     null,
    tasks: [
      {
        id:           'task_serve_drinks',
        name:         'Servir des verres',
        description:  'Prépare et sers des consommations',
        reward:       45,
        difficulty:   2,
        timeRequired: 20,
        type:         'social',
        xpReward:     10,
      },
      {
        id:           'task_cocktail',
        name:         'Créer un cocktail spécial',
        description:  "Élabore un cocktail maison de l'établissement",
        reward:       90,
        difficulty:   4,
        timeRequired: 15,
        type:         'crafting',
        xpReward:     20,
      },
      {
        id:           'task_manage_rowdy',
        name:         'Gérer un client difficile',
        description:  'Calme un client agité avant que ça dégénère',
        reward:       60,
        difficulty:   5,
        timeRequired: 10,
        type:         'social',
        xpReward:     15,
      },
    ],
    benefits: [
      { type: 'bonus',    value: 'Pourboires généreux' },
      { type: 'discount', value: 'Consommations staff à prix coûtant' },
    ],
    risks: [
      { type: 'injury',     probability: 0.08, severity: 3 },
      { type: 'reputation', probability: 0.05, severity: 2 },
    ],
  },

  // ── Illégaux ────────────────────────────────────────────────

  {
    id:          'job_drug_dealer',
    type:        'drug_dealer',
    name:        'Revendeur',
    description: 'Vends des substances... discrètement. Haut risque, haute récompense.',
    salary:      100,
    salaryType:  'illegal',
    minLevel:    5,
    workHours:   { start: 20, end: 4 },
    location:    new THREE.Vector3(-30, 0, -30),
    uniform:     'Vêtements discrets',
    vehicle:     null,
    tasks: [
      {
        id:           'task_sell_drugs',
        name:         'Vendre de la marchandise',
        description:  'Vends à tes clients habituels',
        reward:       500,
        difficulty:   4,
        timeRequired: 30,
        type:         'social',
        xpReward:     25,
      },
      {
        id:           'task_pickup_supply',
        name:         'Récupérer la livraison',
        description:  'Va chercher la marchandise au point de rendez-vous',
        reward:       1000,
        difficulty:   6,
        timeRequired: 45,
        type:         'delivery',
        xpReward:     40,
      },
      {
        id:           'task_escape_police',
        name:         'Échapper à la police',
        description:  'La police est sur tes traces, échappe-toi!',
        reward:       2000,
        difficulty:   9,
        timeRequired: 15,
        type:         'combat',
        xpReward:     80,
      },
      {
        id:           'task_launder_money',
        name:         'Blanchir de l\'argent',
        description:  'Fais passer les gains par un commerce de façade',
        reward:       1500,
        difficulty:   7,
        timeRequired: 60,
        type:         'investigation',
        xpReward:     50,
      },
    ],
    benefits: [
      { type: 'bonus', value: 'Contacts dans le milieu' },
    ],
    risks: [
      { type: 'legal',      probability: 0.40, severity: 8  },
      { type: 'death',      probability: 0.12, severity: 10 },
      { type: 'reputation', probability: 0.50, severity: 6  },
      { type: 'injury',     probability: 0.25, severity: 7  },
    ],
  },

  {
    id:          'job_hacker',
    type:        'hacker',
    name:        'Hacker',
    description: 'Pirate des systèmes informatiques pour le compte de clients douteux.',
    salary:      200,
    salaryType:  'illegal',
    minLevel:    15,
    workHours:   { start: 0, end: 24 },
    location:    new THREE.Vector3(0, 0, 0),
    uniform:     'Hoodie noir',
    vehicle:     null,
    tasks: [
      {
        id:           'task_hack_atm',
        name:         'Pirater un guichet',
        description:  "Détourne de l'argent d'un guichet automatique",
        reward:       2000,
        difficulty:   7,
        timeRequired: 60,
        type:         'investigation',
        xpReward:     60,
      },
      {
        id:           'task_data_breach',
        name:         'Vol de données',
        description:  "Vole des données sensibles d'une entreprise",
        reward:       5000,
        difficulty:   8,
        timeRequired: 120,
        type:         'investigation',
        xpReward:     100,
      },
      {
        id:           'task_crypto_mining',
        name:         'Miner de la crypto',
        description:  'Utilise des ordinateurs zombies pour miner',
        reward:       1500,
        difficulty:   5,
        timeRequired: 240,
        type:         'crafting',
        xpReward:     40,
      },
      {
        id:           'task_ransomware',
        name:         'Déployer un ransomware',
        description:  "Chiffre les fichiers d'une entreprise et demande une rançon",
        reward:       8000,
        difficulty:   9,
        timeRequired: 180,
        type:         'investigation',
        xpReward:     150,
      },
    ],
    benefits: [
      { type: 'bonus',    value: 'Accès au dark web' },
      { type: 'discount', value: 'Logiciels gratuits' },
    ],
    risks: [
      { type: 'legal',      probability: 0.25, severity: 9 },
      { type: 'reputation', probability: 0.30, severity: 5 },
    ],
  },

] as const;

// ═══════════════════════════════════════════════════════════════
//  INVOICE GENERATOR
// ═══════════════════════════════════════════════════════════════

export class InvoiceGenerator {
  /** Génère les factures mensuelles standard */
  static generateMonthlyInvoices(): Omit<Invoice, 'id'>[] {
    const today = new Date();
    const month = today.getMonth();
    const year  = today.getFullYear();

    const invoices: Omit<Invoice, 'id'>[] = [
      {
        date:        today,
        dueDate:     new Date(year, month, 15),
        amount:      1200,
        paid:        false,
        type:        'rent',
        description: 'Loyer mensuel — Appartement A-1-01',
      },
      {
        date:        today,
        dueDate:     new Date(year, month, 20),
        amount:      125 + Math.floor((month * 37 + 11) % 75), // déterministe
        paid:        false,
        type:        'electricity',
        description: 'Hydro-Québec — Consommation électrique',
      },
      {
        date:        today,
        dueDate:     new Date(year, month, 20),
        amount:      38.50,
        paid:        false,
        type:        'water',
        description: 'Ville de Montréal — Eau et égouts',
      },
      {
        date:        today,
        dueDate:     new Date(year, month, 25),
        amount:      89.99,
        paid:        false,
        type:        'internet',
        description: 'Bell Fibe — Internet 1 Gbps',
      },
      {
        date:        today,
        dueDate:     new Date(year, month, 25),
        amount:      75.00,
        paid:        false,
        type:        'phone',
        description: 'Rogers — Forfait mobile 20 Go',
      },
      {
        date:        today,
        dueDate:     new Date(year, month, 28),
        amount:      120.00,
        paid:        false,
        type:        'insurance',
        description: 'Assurance habitation — La Mutuelle',
      },
    ];

    // Taxes annuelles en janvier
    if (month === 0) {
      invoices.push({
        date:        today,
        dueDate:     new Date(year, 2, 1),
        amount:      2500,
        paid:        false,
        type:        'property_tax',
        description: 'Taxes municipales annuelles',
      });
    }

    return invoices;
  }

  /** Insère les factures dans le store */
  static applyToStore(): void {
    const store    = useEconomyStore.getState();
    const invoices = InvoiceGenerator.generateMonthlyInvoices();
    for (const inv of invoices) {
      store.addInvoice(inv);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  STOCK MARKET (Simulated Crypto)
// ═══════════════════════════════════════════════════════════════

export interface CryptoAsset {
  symbol:     CryptoSymbol;
  price:      number;
  change24h:  number; // %
  volatility: number;
}

export class StockMarket {
  private assets: Map<CryptoSymbol, CryptoAsset> = new Map([
    ['BTC', { symbol: 'BTC', price: 65_000, change24h: 0, volatility: 0.05 }],
    ['ETH', { symbol: 'ETH', price:  3_500, change24h: 0, volatility: 0.08 }],
    ['SOL', { symbol: 'SOL', price:    150, change24h: 0, volatility: 0.12 }],
  ]);

  // ── Simulation ──────────────────────────────────────────────

  /** Avance d'une step de simulation (appeler à intervalle régulier) */
  tick(): void {
    for (const [symbol, asset] of this.assets) {
      const oldPrice = asset.price;
      // Brownian motion biaisé légèrement haussier (trend: +0.02%)
      const drift  = 0.0002;
      const random = (Math.random() - 0.5) * 2 * asset.volatility;
      const newPrice = Math.max(1, oldPrice * (1 + drift + random));
      const change24h = ((newPrice - oldPrice) / oldPrice) * 100;

      this.assets.set(symbol, { ...asset, price: newPrice, change24h });
    }
  }

  // ── Queries ─────────────────────────────────────────────────

  getAsset(symbol: CryptoSymbol): CryptoAsset | null {
    return this.assets.get(symbol) ?? null;
  }

  getPrice(symbol: CryptoSymbol): number {
    return this.assets.get(symbol)?.price ?? 0;
  }

  getAllAssets(): CryptoAsset[] {
    return [...this.assets.values()];
  }

  // ── Trading ─────────────────────────────────────────────────

  buy(symbol: CryptoSymbol, tokenAmount: number): OperationResult {
    if (tokenAmount <= 0) return { success: false, reason: 'Quantité invalide' };

    const price = this.getPrice(symbol);
    const total = price * tokenAmount;

    const result = useEconomyStore
      .getState()
      .removeMoney(total, 'checking', `Achat ${tokenAmount} ${symbol} à ${price.toFixed(2)}$`);

    if (result.success) {
      useEconomyStore
        .getState()
        .addMoney(tokenAmount, 'crypto', `Achat ${symbol}`, 'investment');
    }

    return result;
  }

  sell(symbol: CryptoSymbol, tokenAmount: number): OperationResult {
    if (tokenAmount <= 0) return { success: false, reason: 'Quantité invalide' };

    const { accounts } = useEconomyStore.getState();
    if (accounts.crypto.balance < tokenAmount) {
      return { success: false, reason: 'Solde crypto insuffisant' };
    }

    const price = this.getPrice(symbol);
    const total = price * tokenAmount;

    // Deduct from crypto balance
    const deductResult = useEconomyStore
      .getState()
      .removeMoney(tokenAmount, 'crypto', `Vente ${symbol}`);

    if (!deductResult.success) return deductResult;

    // Credit CAD
    useEconomyStore
      .getState()
      .addMoney(total, 'checking', `Vente ${tokenAmount} ${symbol} à ${price.toFixed(2)}$`, 'investment');

    return { success: true, amount: total };
  }

  /** Calcule le P&L d'un portefeuille de tokens */
  portfolioValue(holdings: Partial<Record<CryptoSymbol, number>>): number {
    let total = 0;
    for (const [symbol, qty] of Object.entries(holdings)) {
      total += this.getPrice(symbol as CryptoSymbol) * (qty ?? 0);
    }
    return total;
  }
}