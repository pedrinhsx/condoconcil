import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CsvTransaction } from '../../types';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { X, PlusCircle, Check } from 'lucide-react';

interface CreateFromCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvItem: CsvTransaction | null;
}

export const CreateFromCsvModal: React.FC<CreateFromCsvModalProps> = ({
  isOpen,
  onClose,
  csvItem,
}) => {
  const { categories, createExpenseFromCsv } = useApp();
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || 'cat-outros');

  if (!isOpen || !csvItem) return null;

  const handleConfirm = () => {
    createExpenseFromCsv(csvItem, selectedCategoryId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-base">Cadastrar Despesa Identificada no CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-indigo-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Este débito foi encontrado no extrato bancário CSV, mas ainda não constava na planilha de lançamentos do condomínio:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div>
              <span className="text-2xs text-slate-400 uppercase font-semibold">Histórico CSV:</span>
              <div className="font-bold text-slate-900">{csvItem.description}</div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-600">
                Data do Débito: <strong>{formatDateBR(csvItem.date)}</strong>
              </span>
              <span className="font-mono font-bold text-red-600 text-sm">
                - {formatCurrency(csvItem.amount)}
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Classificar nesta Categoria:
            </label>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 font-medium"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
