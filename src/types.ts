export type ExpenseStatus = 'pendente' | 'lancado' | 'conciliado' | 'divergencia';
export type ExpenseSource = 'fixa' | 'manual' | 'csv';

export interface Condominium {
  id: string;
  name: string;
  cnpj: string;
  bankName: string;
  bankAccount: string;
  managerName: string;
  totalUnits: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  monthlyBudget?: number;
}

export interface ExpenseDiscrepancy {
  csvAmount?: number;
  systemAmount?: number;
  csvDate?: string;
  systemDate?: string;
  csvSupplier?: string;
  differenceAmount?: number;
  reason?: string;
}

export interface Expense {
  id: string;
  condoId: string;
  categoryId: string;
  supplier: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  referenceMonth: string;
  status: ExpenseStatus;
  source: ExpenseSource;
  isRecurring: boolean;
  recurringTemplateId?: string;
  isManualLaunch?: boolean;
  manualLaunchedAt?: string;
  manualLaunchedBy?: string;
  reconciledAt?: string;
  reconciledWithCsvId?: string;
  discrepancyDetails?: ExpenseDiscrepancy;
  notes?: string;
  documentNumber?: string;
  createdAt: string;
}

export interface RecurringExpenseTemplate {
  id: string;
  condoId: string;
  categoryId: string;
  supplier: string;
  description: string;
  estimatedOrFixed: 'fixo' | 'estimado';
  amount: number;
  dueDay: number;
  frequency: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  startDate: string;
  endDate?: string;
  active: boolean;
  notes?: string;
}

export interface CsvTransaction {
  id: string;
  date: string;
  description: string;
  document?: string;
  amount: number;
  type: 'debito' | 'credito';
  condoId?: string;
  rawString?: string;
  matchedExpenseId?: string;
  matchStatus?: 'conciliado' | 'divergente' | 'nao_cadastrado' | 'pendente';
  discrepancyNote?: string;
}

export interface ReconciliationSummary {
  month: string;
  condoId: string;
  bankAccount: string;
  credits: number;
  debits: number;
  initialBalance: number;
  finalBalance: number;
  creditDifference: number;
  debitDifference: number;
  initialBalanceDifference: number;
  finalBalanceDifference: number;
  isFullyReconciled: boolean;
  lastUpdated: string;
  daysStatus: Record<number, 'conciliado' | 'divergencia' | 'pendente' | 'vazio'>;
}

export type NavItem =
  | 'dashboard'
  | 'conciliacao'
  | 'lancamentos'
  | 'recorrentes'
  | 'relatorios'
  | 'condominios'
  | 'categorias'
  | 'configuracoes';
