import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { Expense, RecurringExpenseTemplate, CsvTransaction } from './types';
import {
  Header,
  Sidebar,
  DashboardView,
  ExpensesView,
  RecurringExpensesView,
  ReportsView,
  CondosView,
  CategoriesView,
  SettingsView,
} from './Views';
import { ConciliationView } from './ConciliationView';
import {
  CsvUploadModal,
  ExpenseModal,
  RecurringModal,
  DivergenceModal,
  ExpenseDetailModal,
  CreateFromCsvModal,
} from './Modals';

const MainAppContent: React.FC = () => {
  const { currentTab, setCurrentTab, toast, hideToast } = useApp();

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringExpenseTemplate | null>(null);

  const [isDivergenceModalOpen, setIsDivergenceModalOpen] = useState(false);
  const [expenseForDivergence, setExpenseForDivergence] = useState<Expense | null>(null);

  const [isExpenseDetailModalOpen, setIsExpenseDetailModalOpen] = useState(false);
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<Expense | null>(null);

  const [isCreateFromCsvModalOpen, setIsCreateFromCsvModalOpen] = useState(false);
  const [selectedCsvItem, setSelectedCsvItem] = useState<CsvTransaction | null>(null);

  const handleOpenNewExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleOpenNewRecurring = () => {
    setRecurringToEdit(null);
    setIsRecurringModalOpen(true);
  };

  const handleOpenEditRecurring = (tpl: RecurringExpenseTemplate) => {
    setRecurringToEdit(tpl);
    setIsRecurringModalOpen(true);
  };

  const handleOpenDivergence = (expense: Expense) => {
    setExpenseForDivergence(expense);
    setIsDivergenceModalOpen(true);
  };

  const handleOpenExpenseDetail = (expense: Expense) => {
    setSelectedExpenseDetail(expense);
    setIsExpenseDetailModalOpen(true);
  };

  const handleOpenCreateFromCsv = (csvItem: CsvTransaction) => {
    setSelectedCsvItem(csvItem);
    setIsCreateFromCsvModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
      <Header
        onOpenNewExpense={handleOpenNewExpense}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-3 sm:p-4 md:p-6 gap-5">
        <Sidebar onOpenCsvModal={() => setIsCsvModalOpen(true)} />

        <main className="flex-1 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToConciliation={() => setCurrentTab('conciliacao')}
              onNavigateToExpenses={() => setCurrentTab('lancamentos')}
              onOpenExpenseDetail={handleOpenExpenseDetail}
              onOpenNewExpense={handleOpenNewExpense}
            />
          )}

          {currentTab === 'conciliacao' && (
            <ConciliationView
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onOpenResolveDivergence={handleOpenDivergence}
              onOpenCreateFromCsv={handleOpenCreateFromCsv}
              onOpenExpenseDetail={handleOpenExpenseDetail}
            />
          )}

          {currentTab === 'lancamentos' && (
            <ExpensesView
              onOpenNewExpense={handleOpenNewExpense}
              onOpenEditExpense={handleOpenEditExpense}
              onOpenExpenseDetail={handleOpenExpenseDetail}
            />
          )}

          {currentTab === 'recorrentes' && (
            <RecurringExpensesView
              onOpenNewRecurring={handleOpenNewRecurring}
              onOpenEditRecurring={handleOpenEditRecurring}
            />
          )}

          {currentTab === 'relatorios' && <ReportsView />}
          {currentTab === 'condominios' && <CondosView />}
          {currentTab === 'categorias' && <CategoriesView />}
          {currentTab === 'configuracoes' && <SettingsView />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-rose-600'
                : toast.type === 'success'
                ? 'bg-emerald-600'
                : 'bg-slate-800'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={hideToast} className="p-0.5 hover:opacity-80">
              &times;
            </button>
          </div>
        </div>
      )}

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => setCurrentTab('conciliacao')}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        templateToEdit={recurringToEdit}
      />

      <DivergenceModal
        isOpen={isDivergenceModalOpen}
        onClose={() => setIsDivergenceModalOpen(false)}
        expense={expenseForDivergence}
      />

      <ExpenseDetailModal
        isOpen={isExpenseDetailModalOpen}
        onClose={() => setIsExpenseDetailModalOpen(false)}
        expense={selectedExpenseDetail}
        onEdit={handleOpenEditExpense}
      />

      <CreateFromCsvModal
        isOpen={isCreateFromCsvModalOpen}
        onClose={() => setIsCreateFromCsvModalOpen(false)}
        csvItem={selectedCsvItem}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
