import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Condominium,
  Category,
  Expense,
  RecurringExpenseTemplate,
  CsvTransaction,
  ReconciliationSummary,
  ExpenseStatus,
  NavItem,
} from './types';
import {
  initialCondominiums,
  initialCategories,
  initialRecurringTemplates,
  initialExpensesAug2026,
  initialExpensesSep2026,
  sampleCsvContentPJBankSep2026,
  parseCsvFile,
  runReconciliation,
  buildReconciliationSummary,
} from './utils';

export interface AppContextType {
  currentTab: NavItem;
  setCurrentTab: (tab: NavItem) => void;

  condominiums: Condominium[];
  selectedCondoId: string;
  setSelectedCondoId: (id: string) => void;
  selectedCondo?: Condominium;
  addCondominium: (condo: Omit<Condominium, 'id'>) => void;
  updateCondominium: (id: string, condo: Partial<Condominium>) => void;

  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;

  recurringTemplates: RecurringExpenseTemplate[];
  addRecurringTemplate: (tpl: Omit<RecurringExpenseTemplate, 'id'>) => void;
  updateRecurringTemplate: (id: string, tpl: Partial<RecurringExpenseTemplate>) => void;
  deleteRecurringTemplate: (id: string) => void;
  toggleRecurringActive: (id: string) => void;

  expenses: Expense[];
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleManualLaunched: (id: string) => void;
  generateRecurringExpensesForMonth: (month: string, targetCondoId?: string) => number;

  csvTransactions: CsvTransaction[];
  importCsvContent: (csvText: string) => { total: number; credits: number; debits: number; error?: string };
  clearCsvTransactions: () => void;
  loadDemoCsv: () => void;
  createExpenseFromCsv: (csvItem: CsvTransaction, categoryId: string) => void;

  reconciliationSummary: ReconciliationSummary;
  reconcileCurrentMonth: () => { matchedCount: number; divergenceCount: number; pendingCount: number };
  resolveDivergence: (expenseId: string, action: 'accept_csv' | 'keep_system' | 'custom', customAmount?: number) => void;

  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY_PREFIX = 'condoconcil_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');

  const [condominiums, setCondominiums] = useState<Condominium[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'condos');
    return saved ? JSON.parse(saved) : initialCondominiums;
  });

  const [selectedCondoId, setSelectedCondoId] = useState<string>('condo-1');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [recurringTemplates, setRecurringTemplates] = useState<RecurringExpenseTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'recurring');
    return saved ? JSON.parse(saved) : initialRecurringTemplates;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : [...initialExpensesAug2026, ...initialExpensesSep2026];
  });

  const [csvTransactions, setCsvTransactions] = useState<CsvTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'csv');
    if (saved) return JSON.parse(saved);
    const parsed = parseCsvFile(sampleCsvContentPJBankSep2026);
    return parsed.transactions;
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const hideToast = () => setToast(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'condos', JSON.stringify(condominiums));
  }, [condominiums]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'recurring', JSON.stringify(recurringTemplates));
  }, [recurringTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'csv', JSON.stringify(csvTransactions));
  }, [csvTransactions]);

  const selectedCondo = condominiums.find(c => c.id === selectedCondoId);

  const addCondominium = (condo: Omit<Condominium, 'id'>) => {
    const newCondo: Condominium = { ...condo, id: `condo-${Date.now()}` };
    setCondominiums(prev => [...prev, newCondo]);
    showToast(`Condomínio "${newCondo.name}" cadastrado com sucesso!`, 'success');
  };

  const updateCondominium = (id: string, patch: Partial<Condominium>) => {
    setCondominiums(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    showToast('Dados do condomínio atualizados!', 'success');
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCat]);
    showToast(`Categoria "${newCat.name}" criada com sucesso!`, 'success');
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    showToast('Categoria atualizada!', 'success');
  };

  const addRecurringTemplate = (tpl: Omit<RecurringExpenseTemplate, 'id'>) => {
    const newTpl: RecurringExpenseTemplate = { ...tpl, id: `rec-${Date.now()}` };
    setRecurringTemplates(prev => [...prev, newTpl]);
    showToast(`Despesa fixa "${newTpl.description}" adicionada!`, 'success');
  };

  const updateRecurringTemplate = (id: string, patch: Partial<RecurringExpenseTemplate>) => {
    setRecurringTemplates(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    showToast('Despesa fixa atualizada!', 'success');
  };

  const deleteRecurringTemplate = (id: string) => {
    setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    showToast('Despesa fixa removida.', 'info');
  };

  const toggleRecurringActive = (id: string) => {
    setRecurringTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast(`Lançamento "${newExp.description}" criado!`, 'success');
  };

  const updateExpense = (id: string, patch: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
    showToast('Lançamento atualizado!', 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Lançamento excluído com sucesso.', 'info');
  };

  const toggleManualLaunched = (id: string) => {
    setExpenses(prev =>
      prev.map(exp => {
        if (exp.id !== id) return exp;
        const willBeLaunched = exp.status !== 'lancado' && exp.status !== 'conciliado';
        if (willBeLaunched) {
          return {
            ...exp,
            status: 'lancado',
            isManualLaunch: true,
            manualLaunchedAt: new Date().toISOString(),
            manualLaunchedBy: 'Mariana Duarte',
          };
        } else {
          return {
            ...exp,
            status: 'pendente',
            isManualLaunch: false,
            manualLaunchedAt: undefined,
            manualLaunchedBy: undefined,
          };
        }
      })
    );
    showToast('Status do lançamento alterado.', 'info');
  };

  const generateRecurringExpensesForMonth = (month: string, targetCondoId?: string) => {
    const condoId = targetCondoId || selectedCondoId;
    const applicableTemplates = recurringTemplates.filter(
      t => t.active && (!condoId || condoId === 'all' || t.condoId === condoId)
    );

    let generatedCount = 0;
    const newExpenses: Expense[] = [];

    applicableTemplates.forEach(tpl => {
      const alreadyExists = expenses.some(
        e => e.recurringTemplateId === tpl.id && e.referenceMonth === month
      );
      if (!alreadyExists) {
        const dayStr = String(tpl.dueDay).padStart(2, '0');
        const dueDate = `${month}-${dayStr}`;
        newExpenses.push({
          id: `exp-gen-${tpl.id}-${month}`,
          condoId: tpl.condoId,
          categoryId: tpl.categoryId,
          supplier: tpl.supplier,
          description: tpl.description,
          amount: tpl.amount,
          dueDate,
          referenceMonth: month,
          status: 'pendente',
          source: 'fixa',
          isRecurring: true,
          recurringTemplateId: tpl.id,
          createdAt: new Date().toISOString(),
        });
        generatedCount++;
      }
    });

    if (newExpenses.length > 0) {
      setExpenses(prev => [...newExpenses, ...prev]);
      showToast(`${generatedCount} despesas fixas geradas para ${month}!`, 'success');
    } else {
      showToast(`Todas as despesas fixas de ${month} já foram geradas previamente.`, 'info');
    }
    return generatedCount;
  };

  const importCsvContent = (csvText: string) => {
    const parsed = parseCsvFile(csvText);
    if (parsed.errors.length > 0) {
      showToast(`Erro ao importar CSV: ${parsed.errors[0]}`, 'error');
      return { total: 0, credits: 0, debits: 0, error: parsed.errors[0] };
    }
    setCsvTransactions(parsed.transactions);
    showToast(`Extrato CSV importado com sucesso! ${parsed.totalRows} movimentações identificadas.`, 'success');
    return {
      total: parsed.totalRows,
      credits: parsed.creditsTotal,
      debits: parsed.debitsTotal,
    };
  };

  const clearCsvTransactions = () => {
    setCsvTransactions([]);
    showToast('Movimentações do extrato CSV limpas.', 'info');
  };

  const loadDemoCsv = () => {
    const parsed = parseCsvFile(sampleCsvContentPJBankSep2026);
    setCsvTransactions(parsed.transactions);
    showToast('Extrato exemplo do PJBank (Setembro/2026) carregado!', 'success');
  };

  const createExpenseFromCsv = (csvItem: CsvTransaction, categoryId: string) => {
    const condoId = selectedCondoId === 'all' ? condominiums[0]?.id || 'condo-1' : selectedCondoId;
    const refMonth = csvItem.date.substring(0, 7);

    const newExpense: Expense = {
      id: `exp-from-csv-${Date.now()}`,
      condoId,
      categoryId,
      supplier: csvItem.description,
      description: `Débito CSV: ${csvItem.description}`,
      amount: csvItem.amount,
      dueDate: csvItem.date,
      paymentDate: csvItem.date,
      referenceMonth: refMonth,
      status: 'conciliado',
      source: 'csv',
      isRecurring: false,
      reconciledAt: new Date().toISOString(),
      reconciledWithCsvId: csvItem.id,
      documentNumber: csvItem.document,
      createdAt: new Date().toISOString(),
    };

    setExpenses(prev => [newExpense, ...prev]);
    setCsvTransactions(prev =>
      prev.map(tx =>
        tx.id === csvItem.id
          ? { ...tx, matchedExpenseId: newExpense.id, matchStatus: 'conciliado' }
          : tx
      )
    );
    showToast(`Despesa criada e conciliada automaticamente com o débito bancário!`, 'success');
  };

  const reconcileCurrentMonth = () => {
    const result = runReconciliation(
      expenses,
      csvTransactions,
      selectedCondoId,
      selectedMonth
    );
    setExpenses(result.updatedExpenses);
    setCsvTransactions(result.updatedCsvTransactions);

    if (result.divergenceCount > 0) {
      showToast(
        `Conciliação finalizada: ${result.matchedCount} conciliados, ${result.divergenceCount} com divergência!`,
        'info'
      );
    } else {
      showToast(
        `Conciliação concluída: ${result.matchedCount} lançamentos conferidos 100%!`,
        'success'
      );
    }
    return {
      matchedCount: result.matchedCount,
      divergenceCount: result.divergenceCount,
      pendingCount: result.pendingCount,
    };
  };

  const resolveDivergence = (
    expenseId: string,
    action: 'accept_csv' | 'keep_system' | 'custom',
    customAmount?: number
  ) => {
    setExpenses(prev =>
      prev.map(exp => {
        if (exp.id !== expenseId) return exp;
        const csvAmt = exp.discrepancyDetails?.csvAmount || exp.amount;
        let finalAmount = exp.amount;
        let note = '';

        if (action === 'accept_csv') {
          finalAmount = csvAmt;
          note = `Valor ajustado para ${csvAmt} para coincidir com extrato bancário.`;
        } else if (action === 'keep_system') {
          note = `Mantido valor cadastrado de ${exp.amount}. Extrato constava ${csvAmt}.`;
        } else if (action === 'custom' && customAmount) {
          finalAmount = customAmount;
          note = `Ajustado manualmente para ${customAmount}.`;
        }

        return {
          ...exp,
          amount: finalAmount,
          status: 'conciliado',
          notes: exp.notes ? `${exp.notes} | ${note}` : note,
          paymentDate: exp.discrepancyDetails?.csvDate || exp.dueDate,
          reconciledAt: new Date().toISOString(),
          discrepancyDetails: undefined,
        };
      })
    );
    showToast('Divergência resolvida e lançamento conciliado!', 'success');
  };

  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'condos');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'categories');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'recurring');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'expenses');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'csv');

    setCondominiums(initialCondominiums);
    setCategories(initialCategories);
    setRecurringTemplates(initialRecurringTemplates);
    setSelectedCondoId('condo-1');
    setSelectedMonth('2026-09');
    setExpenses([...initialExpensesAug2026, ...initialExpensesSep2026]);
    const parsed = parseCsvFile(sampleCsvContentPJBankSep2026);
    setCsvTransactions(parsed.transactions);
    showToast('Dados restaurados para o padrão de demonstração!', 'success');
  };

  const reconciliationSummary = buildReconciliationSummary(
    expenses,
    csvTransactions,
    selectedCondoId,
    selectedMonth
  );

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        condominiums,
        selectedCondoId,
        setSelectedCondoId,
        selectedCondo,
        addCondominium,
        updateCondominium,
        categories,
        addCategory,
        updateCategory,
        recurringTemplates,
        addRecurringTemplate,
        updateRecurringTemplate,
        deleteRecurringTemplate,
        toggleRecurringActive,
        expenses,
        selectedMonth,
        setSelectedMonth,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleManualLaunched,
        generateRecurringExpensesForMonth,
        csvTransactions,
        importCsvContent,
        clearCsvTransactions,
        loadDemoCsv,
        createExpenseFromCsv,
        reconciliationSummary,
        reconcileCurrentMonth,
        resolveDivergence,
        toast,
        showToast,
        hideToast,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
