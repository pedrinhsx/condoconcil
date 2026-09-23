import {
  Condominium,
  Category,
  Expense,
  RecurringExpenseTemplate,
  CsvTransaction,
  ReconciliationSummary,
  ExpenseStatus,
} from './types';

// ==========================================
// 1. FORMATTERS & HELPERS
// ==========================================
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumberBR(value: number, decimals = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatMonthShort(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_SHORT[idx]}/${year}`;
}

export function formatMonthFull(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const idx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES[idx]} de ${year}`;
}

export function getPrevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getRelativeDateLabel(
  dueDateStr: string,
  referenceDateStr: string = '2026-09-23'
): {
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isOverdue: boolean;
  isWithin7Days: boolean;
  daysDiff: number;
} {
  const due = new Date(dueDateStr + 'T00:00:00');
  const ref = new Date(referenceDateStr + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Hoje', isToday: true, isTomorrow: false, isOverdue: false, isWithin7Days: true, daysDiff: 0 };
  } else if (diffDays === 1) {
    return { label: 'Amanhã', isToday: false, isTomorrow: true, isOverdue: false, isWithin7Days: true, daysDiff: 1 };
  } else if (diffDays > 1 && diffDays <= 7) {
    return { label: `Em ${diffDays} dias`, isToday: false, isTomorrow: false, isOverdue: false, isWithin7Days: true, daysDiff: diffDays };
  } else if (diffDays > 7) {
    return { label: `Em ${diffDays} dias`, isToday: false, isTomorrow: false, isOverdue: false, isWithin7Days: false, daysDiff: diffDays };
  } else {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? 'Atrasado há 1 dia' : `Atrasado há ${overdueDays} dias`,
      isToday: false,
      isTomorrow: false,
      isOverdue: true,
      isWithin7Days: false,
      daysDiff: diffDays,
    };
  }
}

// ==========================================
// 2. CSV PARSER
// ==========================================
export interface ParsedCsvResult {
  transactions: CsvTransaction[];
  totalRows: number;
  creditsTotal: number;
  debitsTotal: number;
  detectedDelimiter: string;
  errors: string[];
}

export function parseBrazilianNumber(val: string): number {
  if (!val) return 0;
  let clean = val.trim().replace(/[R$\s]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function normalizeDate(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const brMatch = trimmed.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }
  return '';
}

export function parseCsvFile(csvContent: string): ParsedCsvResult {
  const result: ParsedCsvResult = {
    transactions: [],
    totalRows: 0,
    creditsTotal: 0,
    debitsTotal: 0,
    detectedDelimiter: ';',
    errors: [],
  };

  if (!csvContent || !csvContent.trim()) {
    result.errors.push('O arquivo CSV está vazio.');
    return result;
  }

  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return result;

  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  let delimiter = ';';
  if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
  else if (commaCount > semicolonCount) delimiter = ',';
  result.detectedDelimiter = delimiter;

  let headerIndex = -1;
  let colDate = -1, colDesc = -1, colAmount = -1, colDoc = -1, colType = -1;

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cols = splitCsvRow(lines[i], delimiter).map(c => c.toLowerCase().trim());
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      if (/data|dt|date|movimento|lancamento/.test(col)) colDate = c;
      if (/historico|descricao|detalhe|favorecido|fornecedor|memo|description/.test(col)) colDesc = c;
      if (/valor|quantia|amount|total/.test(col)) colAmount = c;
      if (/documento|doc|num|identificador/.test(col)) colDoc = c;
      if (/tipo|natureza|d\/c|deb\/cred/.test(col)) colType = c;
    }
    if (colDate !== -1 && (colDesc !== -1 || colAmount !== -1)) {
      headerIndex = i;
      break;
    }
  }

  const startIndex = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) continue;
    const cols = splitCsvRow(rawLine, delimiter);
    if (cols.length < 2) continue;

    let dateVal = colDate !== -1 ? cols[colDate] : cols[0];
    let descVal = colDesc !== -1 ? cols[colDesc] : cols[1];
    let amountVal = colAmount !== -1 ? cols[colAmount] : (cols[3] || cols[2]);
    let docVal = colDoc !== -1 ? cols[colDoc] : (cols.length > 4 ? cols[2] : '');
    let typeVal = colType !== -1 ? cols[colType] : '';

    const normalizedDate = normalizeDate(dateVal);
    if (!normalizedDate) continue;

    const parsedNum = parseBrazilianNumber(amountVal);
    if (parsedNum === 0 && !amountVal.includes('0')) continue;

    const isNegative = parsedNum < 0 || /d|debito|saida/i.test(typeVal) || amountVal.includes('-');
    const absoluteAmount = Math.abs(parsedNum);
    const type: 'debito' | 'credito' = isNegative ? 'debito' : 'credito';

    if (type === 'debito') result.debitsTotal += absoluteAmount;
    else result.creditsTotal += absoluteAmount;

    result.transactions.push({
      id: `csv-${i}-${Date.now().toString(36)}`,
      date: normalizedDate,
      description: descVal || 'Transação sem histórico',
      document: docVal,
      amount: absoluteAmount,
      type,
      rawString: rawLine,
    });
  }

  result.totalRows = result.transactions.length;
  return result;
}

function splitCsvRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"' || char === "'") inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

// ==========================================
// 3. RECONCILIATION ENGINE
// ==========================================
function simplifyString(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').trim();
}

function stringSimilarity(s1: string, s2: string): number {
  const words1 = simplifyString(s1).split(/\s+/).filter(w => w.length > 2);
  const words2 = simplifyString(s2).split(/\s+/).filter(w => w.length > 2);
  if (words1.length === 0 || words2.length === 0) return 0;
  let matches = 0;
  for (const w1 of words1) {
    if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) matches++;
  }
  return matches / Math.max(words1.length, words2.length);
}

export function runReconciliation(
  expenses: Expense[],
  csvTransactions: CsvTransaction[],
  targetCondoId?: string,
  targetMonth?: string
): {
  updatedExpenses: Expense[];
  updatedCsvTransactions: CsvTransaction[];
  matchedCount: number;
  divergenceCount: number;
  pendingCount: number;
} {
  const expensesCopy: Expense[] = expenses.map(e => ({ ...e }));
  const csvCopy: CsvTransaction[] = csvTransactions.map(c => ({ ...c }));

  const debits = csvCopy.filter(tx => tx.type === 'debito');
  const matchedCsvIds = new Set<string>();

  expensesCopy.forEach(exp => {
    if (targetCondoId && targetCondoId !== 'all' && exp.condoId !== targetCondoId) return;
    if (targetMonth && exp.referenceMonth !== targetMonth) return;
    if (exp.status === 'conciliado' && !exp.reconciledWithCsvId) return;

    let bestMatch: CsvTransaction | null = null;
    let bestScore = 0;

    for (const tx of debits) {
      if (matchedCsvIds.has(tx.id)) continue;
      const amountDiff = Math.abs(exp.amount - tx.amount);
      const isExactAmount = amountDiff < 0.01;
      const sim = stringSimilarity(exp.supplier + ' ' + exp.description, tx.description);

      const expDay = parseInt(exp.dueDate.split('-')[2] || '0', 10);
      const txDay = parseInt(tx.date.split('-')[2] || '0', 10);
      const dateDiff = Math.abs(expDay - txDay);

      if (isExactAmount && (sim > 0.15 || dateDiff <= 4)) {
        const score = 100 + sim * 50 - dateDiff;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = tx;
        }
      }
    }

    if (bestMatch) {
      matchedCsvIds.add(bestMatch.id);
      exp.status = 'conciliado';
      exp.paymentDate = bestMatch.date;
      exp.reconciledAt = new Date().toISOString();
      exp.reconciledWithCsvId = bestMatch.id;
      delete exp.discrepancyDetails;

      bestMatch.matchedExpenseId = exp.id;
      bestMatch.matchStatus = 'conciliado';
    }
  });

  // Divergence check
  expensesCopy.forEach(exp => {
    if (targetCondoId && targetCondoId !== 'all' && exp.condoId !== targetCondoId) return;
    if (targetMonth && exp.referenceMonth !== targetMonth) return;
    if (exp.status === 'conciliado') return;

    for (const tx of debits) {
      if (matchedCsvIds.has(tx.id)) continue;
      const sim = stringSimilarity(exp.supplier + ' ' + exp.description, tx.description);
      const expDay = parseInt(exp.dueDate.split('-')[2] || '0', 10);
      const txDay = parseInt(tx.date.split('-')[2] || '0', 10);
      const dateDiff = Math.abs(expDay - txDay);

      if (sim >= 0.35 && dateDiff <= 6) {
        matchedCsvIds.add(tx.id);
        exp.status = 'divergencia';
        exp.discrepancyDetails = {
          csvAmount: tx.amount,
          systemAmount: exp.amount,
          csvDate: tx.date,
          systemDate: exp.dueDate,
          csvSupplier: tx.description,
          differenceAmount: Math.abs(tx.amount - exp.amount),
          reason: `Valor no sistema (R$ ${formatNumberBR(exp.amount)}) difere do débito bancário (R$ ${formatNumberBR(tx.amount)}).`,
        };
        tx.matchedExpenseId = exp.id;
        tx.matchStatus = 'divergente';
        break;
      }
    }
  });

  debits.forEach(tx => {
    if (!matchedCsvIds.has(tx.id)) {
      tx.matchStatus = 'nao_cadastrado';
    }
  });

  const monthExpenses = expensesCopy.filter(
    e => (!targetCondoId || targetCondoId === 'all' || e.condoId === targetCondoId) &&
         (!targetMonth || e.referenceMonth === targetMonth)
  );

  return {
    updatedExpenses: expensesCopy,
    updatedCsvTransactions: csvCopy,
    matchedCount: monthExpenses.filter(e => e.status === 'conciliado').length,
    divergenceCount: monthExpenses.filter(e => e.status === 'divergencia').length,
    pendingCount: monthExpenses.filter(e => e.status === 'pendente').length,
  };
}

export function buildReconciliationSummary(
  expenses: Expense[],
  csvTransactions: CsvTransaction[],
  condoId: string,
  month: string
): ReconciliationSummary {
  const filteredExpenses = expenses.filter(
    e => (!condoId || condoId === 'all' || e.condoId === condoId) && e.referenceMonth === month
  );

  const initialBalance = 125430.22;
  let credits = 0;
  let debits = 0;

  csvTransactions.forEach(tx => {
    if (tx.date.startsWith(month)) {
      if (tx.type === 'credito') credits += tx.amount;
      else debits += tx.amount;
    }
  });

  if (debits === 0) {
    debits = filteredExpenses
      .filter(e => e.status === 'conciliado' || e.status === 'lancado')
      .reduce((sum, e) => sum + e.amount, 0);
  }
  if (credits === 0) credits = 48500.0;

  const finalBalance = initialBalance + credits - debits;

  const daysStatus: Record<number, 'conciliado' | 'divergencia' | 'pendente' | 'vazio'> = {};
  for (let day = 1; day <= 31; day++) {
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${month}-${dayStr}`;

    const dayExpenses = filteredExpenses.filter(
      e => (e.paymentDate === fullDate || (!e.paymentDate && e.dueDate === fullDate))
    );

    if (dayExpenses.length === 0) {
      daysStatus[day] = 'vazio';
    } else if (dayExpenses.some(e => e.status === 'divergencia')) {
      daysStatus[day] = 'divergencia';
    } else if (dayExpenses.some(e => e.status === 'pendente')) {
      daysStatus[day] = 'pendente';
    } else {
      daysStatus[day] = 'conciliado';
    }
  }

  const hasDivergences = filteredExpenses.some(e => e.status === 'divergencia');
  const hasPending = filteredExpenses.some(e => e.status === 'pendente');
  const isFullyReconciled = !hasDivergences && !hasPending && filteredExpenses.length > 0;

  return {
    month,
    condoId,
    bankAccount: 'Conta Digital PJBank - Ag. 0001 / C/C 45892-1',
    credits,
    debits,
    initialBalance,
    finalBalance,
    creditDifference: 0,
    debitDifference: hasDivergences ? 45.5 : 0,
    initialBalanceDifference: 0,
    finalBalanceDifference: hasDivergences ? -45.5 : 0,
    isFullyReconciled,
    lastUpdated: new Date().toISOString(),
    daysStatus,
  };
}

// ==========================================
// 4. MOCK DATA & DEFAULT SCENARIOS
// ==========================================
export const initialCondominiums: Condominium[] = [
  {
    id: 'condo-1',
    name: 'Edifício Residencial Splendor',
    cnpj: '12.345.678/0001-90',
    bankName: 'PJBank Pagamentos S.A.',
    bankAccount: 'Ag. 0001 / Conta 45892-1',
    managerName: 'Mariana Duarte',
    totalUnits: 64,
    color: '#0284c7',
  },
  {
    id: 'condo-2',
    name: 'Condomínio Solar das Palmeiras',
    cnpj: '98.765.432/0001-10',
    bankName: 'Banco Inter S.A.',
    bankAccount: 'Ag. 0001 / Conta 91823-4',
    managerName: 'Carlos Eduardo Silva',
    totalUnits: 48,
    color: '#059669',
  },
  {
    id: 'condo-3',
    name: 'Edifício Bella Vista Corporate',
    cnpj: '45.123.890/0001-55',
    bankName: 'Bradesco Empresas',
    bankAccount: 'Ag. 2341 / Conta 55412-0',
    managerName: 'Renata Albuquerque',
    totalUnits: 80,
    color: '#d97706',
  },
];

export const initialCategories: Category[] = [
  { id: 'cat-agua', name: 'Água e Esgoto', icon: 'Droplets', color: '#0284c7', description: 'Consumo de água tratada e saneamento básico', monthlyBudget: 4500 },
  { id: 'cat-energia', name: 'Energia Elétrica', icon: 'Zap', color: '#eab308', description: 'Faturas das concessionárias para áreas comuns', monthlyBudget: 6200 },
  { id: 'cat-gas', name: 'Gás Canalizado', icon: 'Flame', color: '#f97316', description: 'Abastecimento de gás central do condomínio', monthlyBudget: 2800 },
  { id: 'cat-internet', name: 'Internet e Telefonia', icon: 'Wifi', color: '#6366f1', description: 'Links dedicados de fibra ótica para portaria remota', monthlyBudget: 450 },
  { id: 'cat-manutencao', name: 'Manutenção Predial', icon: 'Wrench', color: '#64748b', description: 'Reparos elétricos, hidráulicos e civis', monthlyBudget: 3500 },
  { id: 'cat-limpeza', name: 'Limpeza e Conservação', icon: 'Sparkles', color: '#10b981', description: 'Serviços terceirizados de limpeza e higienização', monthlyBudget: 14850 },
  { id: 'cat-seguranca', name: 'Segurança e Portaria', icon: 'ShieldCheck', color: '#8b5cf6', description: 'Contrato de vigilância e monitoramento 24h', monthlyBudget: 12500 },
  { id: 'cat-elevadores', name: 'Manutenção de Elevadores', icon: 'ArrowUpDown', color: '#06b6d4', description: 'Contrato mensal de assistência técnica preventiva', monthlyBudget: 2400 },
  { id: 'cat-contabilidade', name: 'Administração e Assessoria', icon: 'FileText', color: '#3b82f6', description: 'Honorários de contabilidade e gestão condominial', monthlyBudget: 3200 },
  { id: 'cat-jardinagem', name: 'Jardinagem e Paisagismo', icon: 'Trees', color: '#84cc16', description: 'Poda e manutenção de jardins externos', monthlyBudget: 1200 },
  { id: 'cat-seguro', name: 'Seguro Predial Obrigatório', icon: 'Umbrella', color: '#ec4899', description: 'Apólice de seguro contra incêndio e danos', monthlyBudget: 1100 },
  { id: 'cat-outros', name: 'Outras Despesas Operacionais', icon: 'MoreHorizontal', color: '#94a3b8', description: 'Despesas diversas e pequenos materiais', monthlyBudget: 1500 },
];

export const initialRecurringTemplates: RecurringExpenseTemplate[] = [
  { id: 'rec-1', condoId: 'condo-1', categoryId: 'cat-limpeza', supplier: 'SERVCLEAN TERCEIRIZACAO LTDA', description: 'Prestação de serviços de limpeza e conservação predial', estimatedOrFixed: 'fixo', amount: 14850.0, dueDay: 5, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-2', condoId: 'condo-1', categoryId: 'cat-seguranca', supplier: 'SEGMAX VIGILANCIA ELETRONICA', description: 'Monitoramento de alarmes, CFTV e portaria remota', estimatedOrFixed: 'fixo', amount: 12500.0, dueDay: 5, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-3', condoId: 'condo-1', categoryId: 'cat-elevadores', supplier: 'OTIS ELEVADORES DO BRASIL', description: 'Manutenção preventiva e conservação de 2 elevadores', estimatedOrFixed: 'fixo', amount: 2400.0, dueDay: 10, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-4', condoId: 'condo-1', categoryId: 'cat-contabilidade', supplier: 'DELTA ADM CONDOMINIAL LTDA', description: 'Honorários de administração e gestão contábil', estimatedOrFixed: 'fixo', amount: 3200.0, dueDay: 10, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-5', condoId: 'condo-1', categoryId: 'cat-energia', supplier: 'ENEL DISTRIBUICAO SP', description: 'Fatura de consumo elétrico das áreas comuns', estimatedOrFixed: 'estimado', amount: 5840.46, dueDay: 15, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-6', condoId: 'condo-1', categoryId: 'cat-agua', supplier: 'SABESP S.A.', description: 'Fornecimento de água e tratamento de esgoto', estimatedOrFixed: 'estimado', amount: 4210.8, dueDay: 20, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-7', condoId: 'condo-1', categoryId: 'cat-gas', supplier: 'COMGAS CIA DE GAS DE SP', description: 'Consumo de gás encanado central', estimatedOrFixed: 'estimado', amount: 2340.0, dueDay: 22, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-8', condoId: 'condo-1', categoryId: 'cat-internet', supplier: 'VIVO EMPRESAS TELEFONICA', description: 'Link de fibra ótica de 500Mbps para portaria', estimatedOrFixed: 'fixo', amount: 449.9, dueDay: 23, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-9', condoId: 'condo-1', categoryId: 'cat-jardinagem', supplier: 'VERDE VIDA JARDINAGEM EIRELI', description: 'Manutenção quinzenal de jardins e canteiros', estimatedOrFixed: 'fixo', amount: 1200.0, dueDay: 25, frequency: 'mensal', startDate: '2026-01-01', active: true },
  { id: 'rec-10', condoId: 'condo-1', categoryId: 'cat-seguro', supplier: 'PORTO SEGURO CIA DE SEGUROS', description: 'Parcela 08/12 - Apólice Compreensiva Condomínio', estimatedOrFixed: 'fixo', amount: 1100.0, dueDay: 28, frequency: 'mensal', startDate: '2026-01-01', active: true },
];

export const initialExpensesAug2026: Expense[] = [
  { id: 'exp-aug-1', condoId: 'condo-1', categoryId: 'cat-limpeza', supplier: 'SERVCLEAN TERCEIRIZACAO LTDA', description: 'Prestação de serviços de limpeza predial', amount: 14850.0, dueDate: '2026-08-05', paymentDate: '2026-08-05', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-1', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-1', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-2', condoId: 'condo-1', categoryId: 'cat-seguranca', supplier: 'SEGMAX VIGILANCIA ELETRONICA', description: 'Monitoramento e portaria remota', amount: 12500.0, dueDate: '2026-08-05', paymentDate: '2026-08-05', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-2', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-2', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-3', condoId: 'condo-1', categoryId: 'cat-elevadores', supplier: 'OTIS ELEVADORES DO BRASIL', description: 'Manutenção preventiva dos elevadores', amount: 2400.0, dueDate: '2026-08-10', paymentDate: '2026-08-10', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-3', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-3', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-4', condoId: 'condo-1', categoryId: 'cat-contabilidade', supplier: 'DELTA ADM CONDOMINIAL LTDA', description: 'Honorários de administração e contabilidade', amount: 3200.0, dueDate: '2026-08-10', paymentDate: '2026-08-10', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-4', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-4', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-5', condoId: 'condo-1', categoryId: 'cat-energia', supplier: 'ENEL DISTRIBUICAO SP', description: 'Fatura de energia elétrica das áreas comuns', amount: 5840.46, dueDate: '2026-08-15', paymentDate: '2026-08-15', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-5', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-5', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-6', condoId: 'condo-1', categoryId: 'cat-agua', supplier: 'SABESP S.A.', description: 'Fornecimento de água e tratamento de esgoto', amount: 4210.8, dueDate: '2026-08-20', paymentDate: '2026-08-20', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-6', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-6', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-7', condoId: 'condo-1', categoryId: 'cat-gas', supplier: 'COMGAS CIA DE GAS DE SP', description: 'Consumo de gás central', amount: 2340.0, dueDate: '2026-08-22', paymentDate: '2026-08-22', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-7', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-7', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-8', condoId: 'condo-1', categoryId: 'cat-internet', supplier: 'VIVO EMPRESAS TELEFONICA', description: 'Internet fibra portaria', amount: 449.9, dueDate: '2026-08-23', paymentDate: '2026-08-23', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-8', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-8', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-9', condoId: 'condo-1', categoryId: 'cat-jardinagem', supplier: 'VERDE VIDA JARDINAGEM EIRELI', description: 'Jardinagem e paisagismo', amount: 1200.0, dueDate: '2026-08-25', paymentDate: '2026-08-25', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-9', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-9', createdAt: '2026-08-01T08:00:00Z' },
  { id: 'exp-aug-10', condoId: 'condo-1', categoryId: 'cat-seguro', supplier: 'PORTO SEGURO CIA DE SEGUROS', description: 'Seguro predial 07/12', amount: 1100.0, dueDate: '2026-08-28', paymentDate: '2026-08-28', referenceMonth: '2026-08', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-10', reconciledAt: '2026-08-31T10:00:00Z', reconciledWithCsvId: 'csv-aug-10', createdAt: '2026-08-01T08:00:00Z' },
];

export const initialExpensesSep2026: Expense[] = [
  { id: 'exp-sep-1', condoId: 'condo-1', categoryId: 'cat-limpeza', supplier: 'SERVCLEAN TERCEIRIZACAO LTDA', description: 'Prestação de serviços de limpeza predial', amount: 14850.0, dueDate: '2026-09-05', paymentDate: '2026-09-05', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-1', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-1', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-2', condoId: 'condo-1', categoryId: 'cat-seguranca', supplier: 'SEGMAX VIGILANCIA ELETRONICA', description: 'Monitoramento CFTV e portaria remota', amount: 12500.0, dueDate: '2026-09-05', paymentDate: '2026-09-05', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-2', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-2', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-3', condoId: 'condo-1', categoryId: 'cat-elevadores', supplier: 'OTIS ELEVADORES DO BRASIL', description: 'Manutenção preventiva de elevadores', amount: 2400.0, dueDate: '2026-09-10', paymentDate: '2026-09-10', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-3', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-3', createdAt: '2026-09-01T08:00:00Z' },
  {
    id: 'exp-sep-4',
    condoId: 'condo-1',
    categoryId: 'cat-contabilidade',
    supplier: 'DELTA ADM CONDOMINIAL LTDA',
    description: 'Honorários de assessoria condominial e folha',
    amount: 3200.0,
    dueDate: '2026-09-10',
    referenceMonth: '2026-09',
    status: 'divergencia',
    source: 'fixa',
    isRecurring: true,
    recurringTemplateId: 'rec-4',
    discrepancyDetails: {
      csvAmount: 3245.5,
      systemAmount: 3200.0,
      csvDate: '2026-09-10',
      systemDate: '2026-09-10',
      csvSupplier: 'DELTA ADM CONDOMINIAL LTDA',
      differenceAmount: 45.5,
      reason: 'Valor no sistema (R$ 3.200,00) difere do extrato bancário PJBank (R$ 3.245,50) devido à tarifa de emissão de boletos.',
    },
    createdAt: '2026-09-01T08:00:00Z',
  },
  { id: 'exp-sep-5', condoId: 'condo-1', categoryId: 'cat-energia', supplier: 'ENEL DISTRIBUICAO SP', description: 'Fatura de energia elétrica das áreas comuns', amount: 5690.19, dueDate: '2026-09-15', paymentDate: '2026-09-15', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-5', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-5', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-6', condoId: 'condo-1', categoryId: 'cat-agua', supplier: 'SABESP S.A.', description: 'Fornecimento de água e tratamento de esgoto', amount: 4182.0, dueDate: '2026-09-20', paymentDate: '2026-09-20', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-6', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-6', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-7', condoId: 'condo-1', categoryId: 'cat-gas', supplier: 'COMGAS CIA DE GAS DE SP', description: 'Consumo de gás central', amount: 2340.0, dueDate: '2026-09-22', paymentDate: '2026-09-22', referenceMonth: '2026-09', status: 'conciliado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-7', reconciledAt: '2026-09-23T08:00:00Z', reconciledWithCsvId: 'csv-sep-7', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-8', condoId: 'condo-1', categoryId: 'cat-internet', supplier: 'VIVO EMPRESAS TELEFONICA', description: 'Link de fibra ótica de 500Mbps portaria', amount: 449.9, dueDate: '2026-09-23', referenceMonth: '2026-09', status: 'lancado', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-8', isManualLaunch: true, manualLaunchedAt: '2026-09-23T07:30:00Z', manualLaunchedBy: 'Mariana Duarte', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-9', condoId: 'condo-1', categoryId: 'cat-manutencao', supplier: 'HIDROVALE DESENTUPIDORA', description: 'Desentupimento e limpeza emergencial da prumada 2', amount: 890.0, dueDate: '2026-09-24', referenceMonth: '2026-09', status: 'pendente', source: 'manual', isRecurring: false, createdAt: '2026-09-21T14:20:00Z' },
  { id: 'exp-sep-10', condoId: 'condo-1', categoryId: 'cat-jardinagem', supplier: 'VERDE VIDA JARDINAGEM EIRELI', description: 'Manutenção quinzenal de jardins e canteiros', amount: 1200.0, dueDate: '2026-09-25', referenceMonth: '2026-09', status: 'pendente', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-9', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-11', condoId: 'condo-1', categoryId: 'cat-seguro', supplier: 'PORTO SEGURO CIA DE SEGUROS', description: 'Parcela 08/12 - Apólice Compreensiva Condomínio', amount: 1100.0, dueDate: '2026-09-28', referenceMonth: '2026-09', status: 'pendente', source: 'fixa', isRecurring: true, recurringTemplateId: 'rec-10', createdAt: '2026-09-01T08:00:00Z' },
  { id: 'exp-sep-12', condoId: 'condo-1', categoryId: 'cat-outros', supplier: 'KALUNGA COMERCIO IND. GRAFICA', description: 'Suprimentos de escritório para administração', amount: 140.4, dueDate: '2026-09-28', referenceMonth: '2026-09', status: 'pendente', source: 'manual', isRecurring: false, createdAt: '2026-09-22T09:15:00Z' },
];

export const sampleCsvContentPJBankSep2026 = `Data;Historico;Documento;Valor;Tipo
01/09/2026;SALDO ANTERIOR;000000;125430,22;C
02/09/2026;RECEBIMENTO BOLETOS TAXA CONDOMINIAL;001452;18450,00;C
05/09/2026;SERVCLEAN TERCEIRIZACAO LTDA;045812;-14850,00;D
05/09/2026;SEGMAX VIGILANCIA ELETRONICA;011293;-12500,00;D
10/09/2026;RECEBIMENTO BOLETOS TAXA CONDOMINIAL;001453;22100,00;C
10/09/2026;OTIS ELEVADORES DO BRASIL;089123;-2400,00;D
10/09/2026;DELTA ADM CONDOMINIAL LTDA;000491;-3245,50;D
15/09/2026;RECEBIMENTO BOLETOS TAXA CONDOMINIAL;001454;7950,00;C
15/09/2026;ENEL DISTRIBUICAO SP;098124;-5690,19;D
20/09/2026;SABESP S.A.;034812;-4182,00;D
22/09/2026;COMGAS CIA DE GAS DE SP;051284;-2340,00;D
23/09/2026;DEBITO TARIFA MANUTENCAO CONTA PJBANK;990123;-59,90;D`;
