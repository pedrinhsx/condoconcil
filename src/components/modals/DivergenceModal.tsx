import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { X, AlertTriangle, Check, ArrowRight, FileText } from 'lucide-react';

interface DivergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export const DivergenceModal: React.FC<DivergenceModalProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
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
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-base">Tratamento de Divergência de Lançamento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-rose-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {/* System provision */}
            <div className="space-y-1">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                No Sistema (Previsto)
              </span>
              <div className="text-lg font-black text-slate-800 font-mono">
                {formatCurrency(sysAmount)}
              </div>
              <span className="text-2xs text-slate-600 font-medium block">
                Venc.: {formatDateBR(expense.dueDate)}
              </span>
              <span className="text-2xs text-slate-500 truncate block">
                {expense.supplier}
              </span>
            </div>

            {/* Bank CSV */}
            <div className="space-y-1 border-l border-slate-200 pl-3">
              <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider block">
                No Extrato CSV (Realizado)
              </span>
              <div className="text-lg font-black text-rose-700 font-mono">
                {formatCurrency(csvAmount)}
              </div>
              <span className="text-2xs text-slate-600 font-medium block">
                Débito: {formatDateBR(expense.discrepancyDetails?.csvDate || expense.dueDate)}
              </span>
              <span className="text-2xs text-slate-500 truncate block">
                {expense.discrepancyDetails?.csvSupplier || expense.supplier}
              </span>
            </div>
          </div>

          {/* Reason Alert */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            <span className="font-bold block mb-0.5">Motivo da Divergência:</span>
            <p className="text-rose-700">
              {expense.discrepancyDetails?.reason ||
                `Diferença de ${formatCurrency(diff)} entre o valor cadastrado e o extrato bancário.`}
            </p>
          </div>

          {/* Action Options */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              Como você deseja conciliar esta despesa?
            </label>

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
                <strong className="text-slate-900 block font-semibold">
                  Ajustar para o valor do extrato ({formatCurrency(csvAmount)})
                </strong>
                <span className="text-2xs text-slate-500">
                  Recomendado quando houve acréscimo de juros, taxa bancária de TED/boleto ou reajuste contratual.
                </span>
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
                <strong className="text-slate-900 block font-semibold">
                  Manter valor original do sistema ({formatCurrency(sysAmount)})
                </strong>
                <span className="text-2xs text-slate-500">
                  Mantém o valor da nota fiscal e marca como conciliado com anotação interna.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
              <input
                type="radio"
                name="divergenceAction"
                value="custom"
                checked={selectedAction === 'custom'}
                onChange={() => setSelectedAction('custom')}
                className="mt-0.5 text-sky-600"
              />
              <div className="flex-1">
                <strong className="text-slate-900 block font-semibold">
                  Digitar outro valor acordado
                </strong>
                {selectedAction === 'custom' && (
                  <input
                    type="text"
                    placeholder="Ex: 3220,00"
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs focus:outline-hidden focus:border-sky-500"
                  />
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
          >
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
