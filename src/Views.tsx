import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Expense, RecurringExpenseTemplate, NavItem } from './types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthShort,
  getRelativeDateLabel,
  getPrevMonth,
  getNextMonth,
} from './utils';
import {
  LayoutDashboard,
  Receipt,
  Scale,
  Repeat,
  Building2,
  Tags,
  BarChart3,
  Settings,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Upload,
} from 'lucide-react';

// ==========================================
// 1. HEADER COMPONENT
// ==========================================
export const Header: React.FC<{
  onOpenNewExpense: () => void;
  onOpenCsvModal: () => void;
}> = ({ onOpenNewExpense, onOpenCsvModal }) => {
  const {
    condominiums,
    selectedCondoId,
    setSelectedCondoId,
    selectedMonth,
    setSelectedMonth,
    reconcileCurrentMonth,
    reconciliationSummary,
    setCurrentTab,
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-8 py-3.5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <select
              value={selectedCondoId}
              onChange={e => setSelectedCondoId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🏢 Todos os Condomínios</option>
              {condominiums.map(condo => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{formatMonthShort(selectedMonth)}</span>
            </div>
            <button
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                reconciliationSummary.isFullyReconciled
                  ? 'bg-emerald-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span>
              {reconciliationSummary.isFullyReconciled
                ? 'Extrato 100% Conciliado'
                : 'Pendente de Conciliação'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => {
              reconcileCurrentMonth();
              setCurrentTab('conciliacao');
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Conciliar</span>
          </button>

          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// ==========================================
// 2. SIDEBAR COMPONENT
// ==========================================
export const Sidebar: React.FC<{ onOpenCsvModal?: () => void }> = () => {
  const { currentTab, setCurrentTab, expenses, selectedMonth, selectedCondoId, reconciliationSummary } = useApp();

  const pendingCount = expenses.filter(
    e => (!selectedCondoId || selectedCondoId === 'all' || e.condoId === selectedCondoId) &&
         e.referenceMonth === selectedMonth &&
         (e.status === 'pendente' || e.status === 'divergencia')
  ).length;

  const divergenceCount = expenses.filter(
    e => (!selectedCondoId || selectedCondoId === 'all' || e.condoId === selectedCondoId) &&
         e.referenceMonth === selectedMonth &&
         e.status === 'divergencia'
  ).length;

  const menuItems: { id: NavItem; label: string; icon: any; badge?: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'conciliacao',
      label: 'Conciliação',
      icon: Scale,
      badge: divergenceCount > 0 ? (
        <span className="px-1.5 py-0.5 text-3xs font-bold rounded-full bg-rose-500 text-white">
          {divergenceCount} div
        </span>
      ) : pendingCount > 0 ? (
        <span className="px-1.5 py-0.5 text-3xs font-bold rounded-full bg-amber-500 text-white">
          {pendingCount}
        </span>
      ) : (
        <span className="px-1.5 py-0.5 text-3xs font-bold rounded-full bg-emerald-500 text-white">
          OK
        </span>
      ),
    },
    {
      id: 'lancamentos',
      label: 'Lançamentos',
      icon: Receipt,
      badge: pendingCount > 0 ? (
        <span className="px-1.5 py-0.5 text-3xs font-bold rounded-full bg-slate-700 text-slate-300">
          {pendingCount}
        </span>
      ) : null,
    },
    { id: 'recorrentes', label: 'Despesas Fixas', icon: Repeat },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'condominios', label: 'Condomínios', icon: Building2 },
    { id: 'categorias', label: 'Categorias', icon: Tags },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-300 rounded-2xl flex flex-col overflow-hidden shadow-xl self-start sticky top-20">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-black text-white tracking-tight flex items-center gap-1">
            <span>CondoConcil</span>
            <span className="text-3xs uppercase px-1 py-0.2 rounded bg-sky-500/30 text-sky-300 font-bold">Pro</span>
          </div>
          <span className="text-3xs text-slate-400">Gestão Condominial</span>
        </div>
      </div>

      <nav className="p-2 space-y-0.5">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}
      </nav>

      <div className="p-3 m-2 mt-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-2xs">
        <div className="flex items-center gap-1.5 mb-1 font-bold text-slate-200">
          <span className={`w-1.5 h-1.5 rounded-full ${reconciliationSummary.isFullyReconciled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>Status do Mês</span>
        </div>
        <p className="text-slate-400 text-3xs leading-relaxed">
          {reconciliationSummary.isFullyReconciled
            ? 'Todos os lançamentos conferidos.'
            : `${divergenceCount > 0 ? `${divergenceCount} divergência(s)` : `${pendingCount} pendente(s)`}.`}
        </p>
        <button
          onClick={() => setCurrentTab('conciliacao')}
          className="mt-1.5 text-3xs font-bold text-sky-400 hover:underline flex items-center gap-0.5"
        >
          Conferir conciliação &rarr;
        </button>
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-2xs text-slate-400 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-3xs text-sky-400 border border-slate-700">
          MD
        </div>
        <div className="truncate">
          <div className="font-bold text-slate-200 truncate">Mariana Duarte</div>
          <div className="text-3xs text-slate-400">Administradora</div>
        </div>
      </div>
    </aside>
  );
};

// ==========================================
// 3. DASHBOARD VIEW
// ==========================================
export const DashboardView: React.FC<{
  onNavigateToConciliation: () => void;
  onNavigateToExpenses: () => void;
  onOpenExpenseDetail: (expense: Expense) => void;
  onOpenNewExpense: () => void;
}> = ({ onNavigateToConciliation, onNavigateToExpenses, onOpenExpenseDetail, onOpenNewExpense }) => {
  const { expenses, selectedCondoId, selectedMonth, selectedCondo, toggleManualLaunched } = useApp();

  const referenceDate = `${selectedMonth}-23`;
  const monthExpenses = expenses.filter(
    e => (!selectedCondoId || selectedCondoId === 'all' || e.condoId === selectedCondoId) &&
         e.referenceMonth === selectedMonth
  );

  const todayExpenses = monthExpenses.filter(e => {
    const rel = getRelativeDateLabel(e.dueDate, referenceDate);
    return rel.isToday;
  });

  const tomorrowExpenses = monthExpenses.filter(e => {
    const rel = getRelativeDateLabel(e.dueDate, referenceDate);
    return rel.isTomorrow;
  });

  const next7DaysExpenses = monthExpenses.filter(e => {
    const rel = getRelativeDateLabel(e.dueDate, referenceDate);
    return rel.isWithin7Days && !rel.isToday && !rel.isTomorrow;
  });

  const overdueExpenses = monthExpenses.filter(e => {
    const rel = getRelativeDateLabel(e.dueDate, referenceDate);
    return rel.isOverdue && e.status !== 'conciliado';
  });

  const launchedCount = monthExpenses.filter(e => e.status === 'lancado' || e.status === 'conciliado').length;
  const conciliatedCount = monthExpenses.filter(e => e.status === 'conciliado').length;
  const pendingConciliationCount = monthExpenses.filter(e => e.status === 'pendente' || e.status === 'divergencia').length;
  const totalAmount = monthExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Painel Geral de Acompanhamento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCondo ? selectedCondo.name : 'Todos os Condomínios'} &bull; {formatMonthShort(selectedMonth)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToConciliation}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Abrir Conciliação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">Hoje</span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{todayExpenses.length}</div>
          <span className="text-3xs text-slate-500">vencem hoje</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">Próximos 7 Dias</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{next7DaysExpenses.length + tomorrowExpenses.length}</div>
          <span className="text-3xs text-slate-500">a vencer logo</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-rose-500">Atrasados</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">{overdueExpenses.length}</div>
          <span className="text-3xs text-rose-600">sem conciliação</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">Já Realizados</span>
            <Check className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{launchedCount}</div>
          <span className="text-3xs text-slate-500">lançados</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-amber-600">Pendentes</span>
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">{pendingConciliationCount}</div>
          <span className="text-3xs text-amber-600">a conciliar</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-emerald-600">Conciliados</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">{conciliatedCount}</div>
          <span className="text-3xs text-emerald-600">100% batidos</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Próximos Lançamentos e Vencimentos</span>
          </h2>
          <button onClick={onNavigateToExpenses} className="text-xs font-bold text-sky-600 hover:underline">
            Ver todos ({monthExpenses.length}) &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">Hoje ({todayExpenses.length})</span>
              <span className="text-3xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">23/Set</span>
            </div>
            {todayExpenses.length === 0 ? (
              <p className="text-2xs text-slate-400 py-4 text-center">Nenhum lançamento previsto para hoje.</p>
            ) : (
              <div className="space-y-2">
                {todayExpenses.map(exp => (
                  <div key={exp.id} onClick={() => onOpenExpenseDetail(exp)} className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{exp.supplier}</span>
                      <span className="font-mono font-bold text-xs text-slate-900">{formatCurrency(exp.amount)}</span>
                    </div>
                    <div className="text-2xs text-slate-500 truncate mt-0.5">{exp.description}</div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                      <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${exp.status === 'conciliado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {exp.status === 'conciliado' ? 'Conciliado' : 'Pendente'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleManualLaunched(exp.id); }}
                        className="text-3xs text-sky-600 hover:underline font-bold"
                      >
                        {exp.status === 'lancado' ? 'Desfazer' : 'Marcar Lançado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">Amanhã ({tomorrowExpenses.length})</span>
              <span className="text-3xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">24/Set</span>
            </div>
            {tomorrowExpenses.length === 0 ? (
              <p className="text-2xs text-slate-400 py-4 text-center">Nenhum lançamento previsto para amanhã.</p>
            ) : (
              <div className="space-y-2">
                {tomorrowExpenses.map(exp => (
                  <div key={exp.id} onClick={() => onOpenExpenseDetail(exp)} className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{exp.supplier}</span>
                      <span className="font-mono font-bold text-xs text-slate-900">{formatCurrency(exp.amount)}</span>
                    </div>
                    <div className="text-2xs text-slate-500 truncate mt-0.5">{exp.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">Próximos 7 Dias ({next7DaysExpenses.length})</span>
              <span className="text-3xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">25 a 30/Set</span>
            </div>
            {next7DaysExpenses.length === 0 ? (
              <p className="text-2xs text-slate-400 py-4 text-center">Nenhum lançamento para a próxima semana.</p>
            ) : (
              <div className="space-y-2">
                {next7DaysExpenses.map(exp => (
                  <div key={exp.id} onClick={() => onOpenExpenseDetail(exp)} className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 cursor-pointer transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">{exp.supplier}</span>
                      <span className="font-mono font-bold text-xs text-slate-900">{formatCurrency(exp.amount)}</span>
                    </div>
                    <div className="text-2xs text-slate-500 flex justify-between mt-1">
                      <span>Vencimento:</span>
                      <strong>{formatDateBR(exp.dueDate)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. EXPENSES VIEW (LANÇAMENTOS)
// ==========================================
export const ExpensesView: React.FC<{
  onOpenNewExpense: () => void;
  onOpenEditExpense: (exp: Expense) => void;
  onOpenExpenseDetail: (exp: Expense) => void;
}> = ({ onOpenNewExpense, onOpenEditExpense, onOpenExpenseDetail }) => {
  const { expenses, selectedCondoId, selectedMonth, categories, toggleManualLaunched, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'lancado' | 'conciliado' | 'divergencia'>('all');

  const filtered = expenses.filter(e => {
    if (selectedCondoId && selectedCondoId !== 'all' && e.condoId !== selectedCondoId) return false;
    if (e.referenceMonth !== selectedMonth) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return e.supplier.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Lançamentos de Despesas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie e confira cada lançamento previsto ou realizado</p>
        </div>
        <button
          onClick={onOpenNewExpense}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por fornecedor ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {(['all', 'pendente', 'lancado', 'conciliado', 'divergencia'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition ${
                statusFilter === st ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'Todos' : st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-3xs border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Vencimento</th>
              <th className="py-3 px-4">Fornecedor / Descrição</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${
                      exp.status === 'conciliado' ? 'bg-emerald-100 text-emerald-800' :
                      exp.status === 'divergencia' ? 'bg-rose-100 text-rose-800' :
                      exp.status === 'lancado' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{formatDateBR(exp.dueDate)}</td>
                  <td className="py-3 px-4 cursor-pointer" onClick={() => onOpenExpenseDetail(exp)}>
                    <div className="font-bold text-slate-900 hover:text-sky-600">{exp.supplier}</div>
                    <div className="text-2xs text-slate-400 truncate max-w-xs">{exp.description}</div>
                  </td>
                  <td className="py-3 px-4 text-2xs font-semibold text-slate-600">{cat?.name || 'Geral'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(exp.amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => toggleManualLaunched(exp.id)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                        title={exp.status === 'lancado' ? 'Desfazer' : 'Marcar Lançado'}
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button onClick={() => onOpenEditExpense(exp)} className="p-1 hover:bg-slate-200 rounded text-slate-600">
                        <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                      </button>
                      <button onClick={() => deleteExpense(exp.id)} className="p-1 hover:bg-rose-100 rounded text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 5. RECURRING EXPENSES VIEW
// ==========================================
export const RecurringExpensesView: React.FC<{
  onOpenNewRecurring: () => void;
  onOpenEditRecurring: (tpl: RecurringExpenseTemplate) => void;
}> = ({ onOpenNewRecurring, onOpenEditRecurring }) => {
  const { recurringTemplates, selectedCondoId, selectedMonth, generateRecurringExpensesForMonth, deleteRecurringTemplate, toggleRecurringActive } = useApp();

  const filtered = recurringTemplates.filter(
    t => !selectedCondoId || selectedCondoId === 'all' || t.condoId === selectedCondoId
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Despesas Fixas e Recorrentes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Cadastre contratos que se repetem todo mês e gere os lançamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateRecurringExpensesForMonth(selectedMonth)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Gerar para {formatMonthShort(selectedMonth)}</span>
          </button>
          <button
            onClick={onOpenNewRecurring}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Despesa Fixa</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tpl => (
          <div key={tpl.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xs uppercase font-bold text-sky-600 tracking-wider">Vence dia {tpl.dueDay}</span>
                <h3 className="font-bold text-sm text-slate-900">{tpl.supplier}</h3>
              </div>
              <span className="font-mono font-black text-sm text-slate-900">{formatCurrency(tpl.amount)}</span>
            </div>
            <p className="text-2xs text-slate-500 leading-relaxed line-clamp-2">{tpl.description}</p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className={`px-2 py-0.5 rounded-full text-3xs font-bold ${tpl.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {tpl.active ? 'Ativa' : 'Inativa'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRecurringActive(tpl.id)} className="text-2xs text-slate-500 hover:underline">
                  {tpl.active ? 'Pausar' : 'Ativar'}
                </button>
                <button onClick={() => onOpenEditRecurring(tpl)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteRecurringTemplate(tpl.id)} className="p-1 hover:bg-rose-100 rounded text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 6. REPORTS VIEW
// ==========================================
export const ReportsView: React.FC = () => {
  const { expenses, selectedCondoId, selectedMonth, categories } = useApp();

  const filtered = expenses.filter(
    e => (!selectedCondoId || selectedCondoId === 'all' || e.condoId === selectedCondoId) &&
         e.referenceMonth === selectedMonth
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const conciliatedTotal = filtered.filter(e => e.status === 'conciliado').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Relatório Mensal de Despesas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Demonstrativo financeiro para prestação de contas aos condôminos</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-3xs uppercase font-bold text-slate-400">Total de Despesas</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(total)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-3xs uppercase font-bold text-emerald-600">Total Conciliado com Banco</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatCurrency(conciliatedTotal)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-3xs uppercase font-bold text-sky-600">Taxa de Conciliação</span>
          <div className="text-2xl font-black text-sky-700 font-mono mt-1">
            {total > 0 ? `${((conciliatedTotal / total) * 100).toFixed(1)}%` : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. CONDOS & CATEGORIES & SETTINGS
// ==========================================
export const CondosView: React.FC = () => {
  const { condominiums } = useApp();
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Condomínios Administrados</h1>
        <p className="text-xs text-slate-500 mt-0.5">Gerencie os edifícios e contas bancárias associadas</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {condominiums.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
            <p className="text-2xs text-slate-500">CNPJ: {c.cnpj}</p>
            <div className="p-2.5 bg-slate-50 rounded-lg text-2xs text-slate-700 border border-slate-200">
              <div><strong>Banco:</strong> {c.bankName}</div>
              <div><strong>Conta:</strong> {c.bankAccount}</div>
              <div><strong>Síndico/Adm:</strong> {c.managerName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CategoriesView: React.FC = () => {
  const { categories } = useApp();
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Categorias de Despesas</h1>
        <p className="text-xs text-slate-500 mt-0.5">Plano de contas e centros de custos dos condomínios</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
            <p className="text-2xs text-slate-500 mt-1">{c.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { resetToDemoData } = useApp();
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Configurações & Demonstração</h1>
        <p className="text-xs text-slate-500 mt-0.5">Restauração de cenários e parâmetros do sistema</p>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Restaurar Cenário de Demonstração</h3>
        <p className="text-xs text-slate-600">
          Recarrega o cenário de Agosto/2026 (100% conciliado) e Setembro/2026 (com divergência e extrato bancário PJBank).
        </p>
        <button
          onClick={resetToDemoData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Cenário Demo</span>
        </button>
      </div>
    </div>
  );
};
