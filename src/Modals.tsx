import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Expense, RecurringExpenseTemplate, CsvTransaction } from './types';
import { formatCurrency, formatDateBR, parseCsvFile, sampleCsvContentPJBankSep2026 } from './utils';
import {
  X,
  Receipt,
  Upload,
  FileSpreadsheet,
  Check,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Repeat,
  PlusCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Shield,
} from 'lucide-react';

// ==========================================
// 1. CSV UPLOAD MODAL
// ==========================================
export const CsvUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const { importCsvContent } = useApp();
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const updatePreview = (text: string) => {
    setErrorMsg('');
    const parsed = parseCsvFile(text);
    if (parsed.errors.length > 0) {
      setErrorMsg(parsed.errors[0]);
      setPreviewData(null);
    } else {
      setPreviewData(parsed);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvRawText(text);
      updatePreview(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleLoadDemo = () => {
    setCsvRawText(sampleCsvContentPJBankSep2026);
    setFileName('Extrato_PJBank_Setembro_2026.csv');
    updatePreview(sampleCsvContentPJBankSep2026);
  };

  const handleConfirmImport = () => {
    if (!csvRawText.trim()) return;
    const res = importCsvContent(csvRawText);
    if (!res.error) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Importação de Relatório / Extrato CSV</h2>
              <p className="text-2xs text-slate-500">PJBank, Inter, Bradesco ou outros</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-sky-600 mb-1" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Clique para selecionar arquivo .CSV do computador'}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5">Separador vírgula ou ponto-e-vírgula (;)</span>
              <input type="file" accept=".csv,text/csv,text/plain" onChange={handleFileChange} className="hidden" />
            </label>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold shadow-xs transition w-full sm:w-auto shrink-0 justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Carregar Demo PJBank</span>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Ou cole o conteúdo CSV diretamente:</label>
              {csvRawText && (
                <button onClick={() => { setCsvRawText(''); setPreviewData(null); setFileName(''); }} className="text-2xs text-rose-600 hover:underline">
                  Limpar
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvRawText}
              onChange={e => { setCsvRawText(e.target.value); setFileName('colado.csv'); updatePreview(e.target.value); }}
              placeholder="Data;Historico;Documento;Valor;Tipo&#10;05/09/2026;SERVCLEAN TERCEIRIZACAO;-14850.00;D..."
              className="w-full font-mono text-2xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-slate-50"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {previewData && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="text-xs">{previewData.totalRows} movimentações identificadas</span>
                <span className="text-2xs text-slate-500">
                  Débitos: <strong className="text-red-600 font-mono">{formatCurrency(previewData.debitsTotal)}</strong>
                </span>
              </div>
              <div className="overflow-x-auto max-h-44 border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-2xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Data</th>
                      <th className="py-2 px-2.5">Histórico</th>
                      <th className="py-2 px-2.5 text-right">Valor</th>
                      <th className="py-2 px-2.5 text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.transactions.slice(0, 6).map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="py-1.5 px-2.5 font-mono">{formatDateBR(tx.date)}</td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900 truncate max-w-[200px]">{tx.description}</td>
                        <td className={`py-1.5 px-2.5 text-right font-mono font-bold ${tx.type === 'debito' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.type === 'debito' ? '-' : '+'} {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-3xs font-bold uppercase ${tx.type === 'debito' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {tx.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!previewData || previewData.totalRows === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Importar CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. EXPENSE MODAL (CREATE / EDIT)
// ==========================================
export const ExpenseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}> = ({ isOpen, onClose, expenseToEdit }) => {
  const { condominiums, categories, selectedCondoId, selectedMonth, addExpense, updateExpense } = useApp();

  const [condoId, setCondoId] = useState(selectedCondoId === 'all' ? condominiums[0]?.id || 'condo-1' : selectedCondoId);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-outros');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState(`${selectedMonth}-10`);
  const [status, setStatus] = useState<'pendente' | 'lancado' | 'conciliado'>('pendente');
  const [isRecurring, setIsRecurring] = useState(false);
  const [documentNumber, setDocumentNumber] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setCondoId(expenseToEdit.condoId);
      setCategoryId(expenseToEdit.categoryId);
      setSupplier(expenseToEdit.supplier);
      setDescription(expenseToEdit.description);
      setAmount(String(expenseToEdit.amount));
      setDueDate(expenseToEdit.dueDate);
      setStatus(expenseToEdit.status === 'divergencia' ? 'pendente' : expenseToEdit.status);
      setIsRecurring(expenseToEdit.isRecurring);
      setDocumentNumber(expenseToEdit.documentNumber || '');
    } else {
      setCondoId(selectedCondoId === 'all' ? condominiums[0]?.id || 'condo-1' : selectedCondoId);
      setCategoryId(categories[0]?.id || 'cat-outros');
      setSupplier('');
      setDescription('');
      setAmount('');
      setDueDate(`${selectedMonth}-10`);
      setStatus('pendente');
      setIsRecurring(false);
      setDocumentNumber('');
    }
  }, [expenseToEdit, isOpen, selectedCondoId, selectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;
    const refMonth = dueDate.substring(0, 7);

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        condoId,
        categoryId,
        supplier,
        description,
        amount: numAmount,
        dueDate,
        referenceMonth: refMonth,
        status,
        isRecurring,
        documentNumber: documentNumber || undefined,
      });
    } else {
      addExpense({
        condoId,
        categoryId,
        supplier,
        description,
        amount: numAmount,
        dueDate,
        referenceMonth: refMonth,
        status,
        source: isRecurring ? 'fixa' : 'manual',
        isRecurring,
        isManualLaunch: status === 'lancado',
        manualLaunchedAt: status === 'lancado' ? new Date().toISOString() : undefined,
        manualLaunchedBy: status === 'lancado' ? 'Mariana Duarte' : undefined,
        documentNumber: documentNumber || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-base">{expenseToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Condomínio *</label>
            <select
              value={condoId}
              onChange={e => setCondoId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
            >
              {condominiums.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fornecedor *</label>
              <input
                type="text"
                required
                placeholder="Ex: Enel, Atlas..."
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descrição do Lançamento *</label>
            <input
              type="text"
              required
              placeholder="Ex: Fatura mensal de energia"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Valor (R$) *</label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Data de Vencimento *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="lancado">✔️ Lançado Manualmente</option>
                <option value="conciliado">✅ Conciliado (Bateu)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nº Documento / NF</label>
              <input
                type="text"
                placeholder="NF-12345 / Boleto"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecModal"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="isRecModal" className="text-slate-700 font-medium cursor-pointer">
              Esta é uma despesa fixa que se repete mensalmente
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs">
              {expenseToEdit ? 'Atualizar Lançamento' : 'Criar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. RECURRING TEMPLATE MODAL
// ==========================================
export const RecurringModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: RecurringExpenseTemplate | null;
}> = ({ isOpen, onClose, templateToEdit }) => {
  const { condominiums, categories, selectedCondoId, addRecurringTemplate, updateRecurringTemplate } = useApp();

  const [condoId, setCondoId] = useState(selectedCondoId === 'all' ? condominiums[0]?.id || 'condo-1' : selectedCondoId);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-outros');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [estimatedOrFixed, setEstimatedOrFixed] = useState<'fixo' | 'estimado'>('fixo');
  const [dueDay, setDueDay] = useState<number>(10);
  const [frequency, setFrequency] = useState<'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [startDate, setStartDate] = useState('2026-01-01');

  useEffect(() => {
    if (templateToEdit) {
      setCondoId(templateToEdit.condoId);
      setCategoryId(templateToEdit.categoryId);
      setSupplier(templateToEdit.supplier);
      setDescription(templateToEdit.description);
      setAmount(String(templateToEdit.amount));
      setEstimatedOrFixed(templateToEdit.estimatedOrFixed);
      setDueDay(templateToEdit.dueDay);
      setFrequency(templateToEdit.frequency);
      setStartDate(templateToEdit.startDate);
    } else {
      setCondoId(selectedCondoId === 'all' ? condominiums[0]?.id || 'condo-1' : selectedCondoId);
      setCategoryId(categories[0]?.id || 'cat-outros');
      setSupplier('');
      setDescription('');
      setAmount('');
      setEstimatedOrFixed('fixo');
      setDueDay(10);
      setFrequency('mensal');
      setStartDate('2026-01-01');
    }
  }, [templateToEdit, isOpen, selectedCondoId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (templateToEdit) {
      updateRecurringTemplate(templateToEdit.id, {
        condoId,
        categoryId,
        supplier,
        description,
        amount: numAmount,
        estimatedOrFixed,
        dueDay: Number(dueDay),
        frequency,
        startDate,
      });
    } else {
      addRecurringTemplate({
        condoId,
        categoryId,
        supplier,
        description,
        amount: numAmount,
        estimatedOrFixed,
        dueDay: Number(dueDay),
        frequency,
        startDate,
        active: true,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Repeat className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-base">{templateToEdit ? 'Editar Despesa Recorrente' : 'Nova Despesa Fixa'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Condomínio *</label>
            <select
              value={condoId}
              onChange={e => setCondoId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
            >
              {condominiums.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fornecedor / Prestador *</label>
              <input
                type="text"
                required
                placeholder="Ex: Otis, Servclean..."
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descrição do Contrato *</label>
            <input
              type="text"
              required
              placeholder="Ex: Manutenção preventiva mensal de 2 elevadores"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Valor Base (R$) *</label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tipo de Valor</label>
              <select
                value={estimatedOrFixed}
                onChange={e => setEstimatedOrFixed(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-medium"
              >
                <option value="fixo">Valor Fixo</option>
                <option value="estimado">Valor Estimado</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Dia do Vencimento *</label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={dueDay}
                onChange={e => setDueDay(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs">
              {templateToEdit ? 'Atualizar Despesa Fixa' : 'Cadastrar Despesa Fixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 4. DIVERGENCE MODAL
// ==========================================
export const DivergenceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}> = ({ isOpen, onClose, expense }) => {
  const { resolveDivergence } = useApp();
  const [selectedAction, setSelectedAction] = useState<'accept_csv' | 'keep_system' | 'custom'>('accept_csv');
  const [customValue, setCustomValue] = useState<string>('');

  if (!isOpen || !expense) return null;

  const csvAmount = expense.discrepancyDetails?.csvAmount || expense.amount;
  const sysAmount = expense.amount;
  const diff = Math.abs(csvAmount - sysAmount);

  const handleConfirm = () => {
    let customNum: number | undefined;
    if (selectedAction === 'custom') {
      customNum = parseFloat(customValue.replace(',', '.'));
      if (isNaN(customNum)) return;
    }
    resolveDivergence(expense.id, selectedAction, customNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-base">Tratamento de Divergência de Lançamento</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-rose-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">No Sistema (Previsto)</span>
              <div className="text-lg font-black text-slate-800 font-mono">{formatCurrency(sysAmount)}</div>
              <span className="text-2xs text-slate-600 font-medium block">Venc.: {formatDateBR(expense.dueDate)}</span>
              <span className="text-2xs text-slate-500 truncate block">{expense.supplier}</span>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-3">
              <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider block">No Extrato CSV</span>
              <div className="text-lg font-black text-rose-700 font-mono">{formatCurrency(csvAmount)}</div>
              <span className="text-2xs text-slate-600 font-medium block">
                Débito: {formatDateBR(expense.discrepancyDetails?.csvDate || expense.dueDate)}
              </span>
              <span className="text-2xs text-slate-500 truncate block">{expense.discrepancyDetails?.csvSupplier || expense.supplier}</span>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <span className="font-bold block mb-0.5">Motivo:</span>
            <p className="text-rose-700">
              {expense.discrepancyDetails?.reason || `Diferença de ${formatCurrency(diff)} entre sistema e banco.`}
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">Como conciliar?</label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="radio"
                name="divergenceAction"
                value="accept_csv"
                checked={selectedAction === 'accept_csv'}
                onChange={() => setSelectedAction('accept_csv')}
                className="mt-0.5 text-sky-600"
              />
              <div>
                <strong className="text-slate-900 block font-semibold">Ajustar para valor do extrato ({formatCurrency(csvAmount)})</strong>
                <span className="text-2xs text-slate-500">Recomendado para juros, taxas bancárias ou reajuste contratual.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="radio"
                name="divergenceAction"
                value="keep_system"
                checked={selectedAction === 'keep_system'}
                onChange={() => setSelectedAction('keep_system')}
                className="mt-0.5 text-sky-600"
              />
              <div>
                <strong className="text-slate-900 block font-semibold">Manter valor do sistema ({formatCurrency(sysAmount)})</strong>
                <span className="text-2xs text-slate-500">Mantém valor da NF original com anotação no histórico.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Salvar e Conciliar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. EXPENSE DETAIL MODAL
// ==========================================
export const ExpenseDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onEdit: (exp: Expense) => void;
}> = ({ isOpen, onClose, expense, onEdit }) => {
  const { toggleManualLaunched, categories, condominiums } = useApp();

  if (!isOpen || !expense) return null;

  const isConciliated = expense.status === 'conciliado';
  const isDivergence = expense.status === 'divergencia';
  const isLaunched = expense.status === 'lancado';
  const isPending = expense.status === 'pendente';

  const category = categories.find(c => c.id === expense.categoryId);
  const condo = condominiums.find(c => c.id === expense.condoId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-base">Ficha Detalhada da Despesa</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">Valor Total</span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">{formatCurrency(expense.amount)}</div>
            </div>
            <div>
              {isConciliated && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Conciliado com CSV
                </span>
              )}
              {isDivergence && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Divergência
                </span>
              )}
              {isLaunched && !isConciliated && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <Check className="w-4 h-4 text-blue-600" /> Lançado Manualmente
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600" /> Pendente de Lançamento
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Condomínio</span>
              <span className="font-semibold text-slate-900">{condo?.name || 'Condomínio'}</span>
            </div>
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Categoria</span>
              <span className="font-semibold text-slate-900">{category?.name || 'Geral'}</span>
            </div>
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Fornecedor</span>
              <span className="font-semibold text-slate-900">{expense.supplier}</span>
            </div>
            <div>
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Vencimento</span>
              <span className="font-semibold text-slate-900">{formatDateBR(expense.dueDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Descrição</span>
            <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium">{expense.description}</p>
          </div>

          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1 text-2xs text-sky-950">
            <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-sky-800">
              <Shield className="w-3.5 h-3.5 text-sky-600" /> Histórico & Auditoria
            </span>
            <div>&bull; <strong>Origem:</strong> {expense.isRecurring ? 'Despesa Fixa Recorrente' : expense.source === 'csv' ? 'Extrato CSV' : 'Lançamento Manual'}</div>
            {expense.isManualLaunch && (
              <div>&bull; <strong>Lançado manualmente por:</strong> {expense.manualLaunchedBy || 'Administrador'}</div>
            )}
            {expense.reconciledAt && (
              <div>&bull; <strong>Conciliado automaticamente em:</strong> {formatDateBR(expense.reconciledAt.split('T')[0])}</div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { onClose(); onEdit(expense); }}
            className="px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 border border-sky-200 rounded-lg font-semibold"
          >
            Editar Dados
          </button>
          <div className="flex items-center gap-2">
            {!isConciliated && (
              <button
                type="button"
                onClick={() => { toggleManualLaunched(expense.id); onClose(); }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  isLaunched ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isLaunched ? <><RotateCcw className="w-3.5 h-3.5" /> Desfazer</> : <><Check className="w-3.5 h-3.5" /> Marcar Lançado</>}
              </button>
            )}
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. CREATE FROM CSV MODAL
// ==========================================
export const CreateFromCsvModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  csvItem: CsvTransaction | null;
}> = ({ isOpen, onClose, csvItem }) => {
  const { categories, createExpenseFromCsv } = useApp();
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || 'cat-outros');

  if (!isOpen || !csvItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-base">Cadastrar Despesa Identificada no CSV</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-indigo-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600">Este débito foi encontrado no extrato bancário CSV, mas ainda não constava no sistema:</p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div>
              <span className="text-2xs text-slate-400 uppercase font-semibold">Histórico CSV:</span>
              <div className="font-bold text-slate-900">{csvItem.description}</div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-600">Data: <strong>{formatDateBR(csvItem.date)}</strong></span>
              <span className="font-mono font-bold text-red-600 text-sm">- {formatCurrency(csvItem.amount)}</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Classificar nesta Categoria:</label>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 font-medium"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { createExpenseFromCsv(csvItem, selectedCategoryId); onClose(); }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Criar e Conciliar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
