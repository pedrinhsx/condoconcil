import React, { useState } from 'react';
import { useApp } from './AppContext';
import {
  formatCurrency,
  formatDateBR,
  formatMonthShort,
  getPrevMonth,
  getNextMonth,
  formatNumberBR,
} from './utils';
import {
  Check,
  X,
  RefreshCw,
  Printer,
  Upload,
  Download,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  PlusCircle,
  FileText,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Expense, CsvTransaction } from './types';

interface ConciliationViewProps {
  onOpenCsvModal: () => void;
  onOpenResolveDivergence: (expense: Expense) => void;
  onOpenCreateFromCsv: (csvItem: CsvTransaction) => void;
  onOpenExpenseDetail: (expense: Expense) => void;
}

export const ConciliationView: React.FC<ConciliationViewProps> = ({
  onOpenCsvModal,
  onOpenResolveDivergence,
  onOpenCreateFromCsv,
  onOpenExpenseDetail,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    selectedCondo,
    selectedCondoId,
    expenses,
    csvTransactions,
    reconciliationSummary,
    reconcileCurrentMonth,
    toggleManualLaunched,
    loadDemoCsv,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'todos' | 'conciliados' | 'pendentes' | 'divergencias' | 'csv_nao_cadastrado'>('todos');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  const monthExpenses = expenses.filter(
    e => (!selectedCondoId || selectedCondoId === 'all' || e.condoId === selectedCondoId) &&
         e.referenceMonth === selectedMonth
  );

  const monthCsvDebits = csvTransactions.filter(
    tx => tx.type === 'debito' && tx.date.startsWith(selectedMonth)
  );

  const matchedExpenses = monthExpenses.filter(e => e.status === 'conciliado');
  const divergenceExpenses = monthExpenses.filter(e => e.status === 'divergencia');
  const pendingExpenses = monthExpenses.filter(e => e.status === 'pendente' || e.status === 'lancado');
  const unlinkedCsvDebits = monthCsvDebits.filter(
    tx => !monthExpenses.some(e => e.reconciledWithCsvId === tx.id || e.discrepancyDetails?.csvSupplier === tx.description)
  );

  const handlePrevMonth = () => setSelectedMonth(getPrevMonth(selectedMonth));
  const handleNextMonth = () => setSelectedMonth(getNextMonth(selectedMonth));

  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Conciliação Bancária</h1>
            <span className="text-3xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Conferência 3 Vias
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedCondo ? selectedCondo.name : 'Todos os Condomínios'} &bull; {selectedCondo?.bankAccount || 'Conta Digital PJBank'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {csvTransactions.length === 0 && (
            <button
              onClick={loadDemoCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Extrato PJBank Demo</span>
            </button>
          )}

          <button
            onClick={onOpenCsvModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => reconcileCurrentMonth()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Conciliar Agora</span>
          </button>
        </div>
      </div>

      {/* 31-Day Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Acompanhamento Diário &bull; {formatMonthShort(selectedMonth)}
            </span>
            {selectedDayFilter !== null && (
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="text-3xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full hover:bg-rose-100"
              >
                Filtrando Dia {selectedDayFilter} (Limpar)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-3xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Conciliado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Divergência
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Sem lançamento
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
          {daysArray.map(day => {
            const status = reconciliationSummary.daysStatus[day] || 'vazio';
            const isSelected = selectedDayFilter === day;

            let bgClass = 'bg-slate-100 text-slate-400 border-slate-200';
            if (status === 'conciliado') bgClass = 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/20';
            else if (status === 'divergencia') bgClass = 'bg-rose-600 text-white border-rose-600 animate-pulse';
            else if (status === 'pendente') bgClass = 'bg-amber-500 text-white border-amber-500';

            return (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(isSelected ? null : day)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-2xs transition shrink-0 border ${bgClass} ${
                  isSelected ? 'ring-3 ring-sky-500 ring-offset-2 scale-110' : 'hover:opacity-80'
                }`}
                title={`Dia ${day}: ${status}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Financial Balances Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs uppercase font-extrabold text-slate-400 block mb-1">Saldo Anterior</span>
          <div className="text-lg font-black text-slate-800 font-mono">{formatCurrency(reconciliationSummary.initialBalance)}</div>
          <span className="text-3xs text-slate-500">Posição bancária inicial</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs uppercase font-extrabold text-emerald-600 block mb-1">Entradas (Créditos)</span>
          <div className="text-lg font-black text-emerald-700 font-mono">+{formatCurrency(reconciliationSummary.credits)}</div>
          <span className="text-3xs text-emerald-600">Taxas e receitas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs uppercase font-extrabold text-red-600 block mb-1">Saídas (Débitos)</span>
          <div className="text-lg font-black text-red-700 font-mono">-{formatCurrency(reconciliationSummary.debits)}</div>
          <span className="text-3xs text-red-600">Despesas condominiais</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs uppercase font-extrabold text-sky-700 block mb-1">Saldo Atual</span>
          <div className="text-lg font-black text-sky-900 font-mono">{formatCurrency(reconciliationSummary.finalBalance)}</div>
          <span className="text-3xs text-slate-500">Saldo apurado no extrato</span>
        </div>
      </div>

      {/* 3-Way Reconciliation Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeFilter === 'todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Todos ({monthExpenses.length})
            </button>
            <button
              onClick={() => setActiveFilter('conciliados')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeFilter === 'conciliados' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Conciliados ({matchedExpenses.length})
            </button>
            <button
              onClick={() => setActiveFilter('divergencias')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeFilter === 'divergencias' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Divergências ({divergenceExpenses.length})
            </button>
            <button
              onClick={() => setActiveFilter('pendentes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeFilter === 'pendentes' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Pendentes ({pendingExpenses.length})
            </button>
            {unlinkedCsvDebits.length > 0 && (
              <button
                onClick={() => setActiveFilter('csv_nao_cadastrado')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${activeFilter === 'csv_nao_cadastrado' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                No CSV e Não Cadastradas ({unlinkedCsvDebits.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar lançamento..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="w-full bg-transparent focus:outline-hidden text-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 uppercase font-bold text-3xs border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">O que deveria ter sido lançado</th>
                <th className="py-3 px-3">O que realmente foi lançado</th>
                <th className="py-3 px-3">O que apareceu no extrato CSV</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Divergence banner if any */}
              {divergenceExpenses.map(exp => (
                <tr key={`div-${exp.id}`} className="bg-rose-50/40 hover:bg-rose-50/80 transition">
                  <td className="py-3 px-3 align-top">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Divergência
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-900">{exp.supplier}</div>
                    <div className="text-3xs text-slate-500">{exp.description}</div>
                    <div className="font-mono text-slate-700 font-bold mt-0.5">Previsto: {formatCurrency(exp.amount)}</div>
                    <div className="text-3xs text-slate-400">Vencimento: {formatDateBR(exp.dueDate)}</div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="text-slate-800 font-bold">{formatCurrency(exp.amount)}</div>
                    <div className="text-3xs text-rose-700 font-semibold mt-0.5">
                      Diferença: {formatCurrency(exp.discrepancyDetails?.differenceAmount || 0)}
                    </div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-rose-800 font-mono">
                      Débito: {formatCurrency(exp.discrepancyDetails?.csvAmount || exp.amount)}
                    </div>
                    <div className="text-3xs text-slate-600">{exp.discrepancyDetails?.csvSupplier || exp.supplier}</div>
                    <div className="text-3xs text-slate-400">Data Débito: {formatDateBR(exp.discrepancyDetails?.csvDate || exp.dueDate)}</div>
                  </td>
                  <td className="py-3 px-3 align-top text-center">
                    <button
                      onClick={() => onOpenResolveDivergence(exp)}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold shadow-xs transition"
                    >
                      Resolver
                    </button>
                  </td>
                </tr>
              ))}

              {/* Matched expenses */}
              {matchedExpenses.map(exp => (
                <tr key={`mat-${exp.id}`} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 align-top">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conciliado
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-900">{exp.supplier}</div>
                    <div className="text-3xs text-slate-500 truncate max-w-xs">{exp.description}</div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-800 font-mono">{formatCurrency(exp.amount)}</div>
                    <div className="text-3xs text-slate-400">Venc.: {formatDateBR(exp.dueDate)}</div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-emerald-700 font-mono">{formatCurrency(exp.amount)}</div>
                    <div className="text-3xs text-slate-400">Pago em: {formatDateBR(exp.paymentDate || exp.dueDate)}</div>
                  </td>
                  <td className="py-3 px-3 align-top text-center">
                    <button
                      onClick={() => onOpenExpenseDetail(exp)}
                      className="text-2xs text-sky-600 hover:underline font-bold"
                    >
                      Ver Ficha
                    </button>
                  </td>
                </tr>
              ))}

              {/* Pending / Manual launched */}
              {pendingExpenses.map(exp => (
                <tr key={`pend-${exp.id}`} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 align-top">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold ${
                      exp.status === 'lancado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {exp.status === 'lancado' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {exp.status === 'lancado' ? 'Lançado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-900">{exp.supplier}</div>
                    <div className="text-3xs text-slate-500 truncate max-w-xs">{exp.description}</div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-slate-800 font-mono">{formatCurrency(exp.amount)}</div>
                    <div className="text-3xs text-slate-400">Venc.: {formatDateBR(exp.dueDate)}</div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <span className="text-3xs text-slate-400 italic">Ainda não debitado no CSV</span>
                  </td>
                  <td className="py-3 px-3 align-top text-center">
                    <button
                      onClick={() => toggleManualLaunched(exp.id)}
                      className="px-2.5 py-1 text-2xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                    >
                      {exp.status === 'lancado' ? 'Desfazer' : 'Marcar Lançado'}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Unlinked CSV debits */}
              {unlinkedCsvDebits.map(tx => (
                <tr key={`csv-${tx.id}`} className="bg-indigo-50/30 hover:bg-indigo-50/60 transition">
                  <td className="py-3 px-3 align-top">
                    <span className="inline-block px-2 py-0.5 rounded-full text-3xs font-extrabold bg-indigo-100 text-indigo-800">
                      Novo no CSV
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <span className="text-3xs text-slate-400 italic">Não constava no sistema</span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <span className="text-3xs text-slate-400 italic">-</span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-bold text-red-600 font-mono">-{formatCurrency(tx.amount)}</div>
                    <div className="text-3xs text-slate-800 font-semibold">{tx.description}</div>
                    <div className="text-3xs text-slate-400">{formatDateBR(tx.date)}</div>
                  </td>
                  <td className="py-3 px-3 align-top text-center">
                    <button
                      onClick={() => onOpenCreateFromCsv(tx)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-2xs font-bold shadow-xs transition"
                    >
                      Cadastrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
