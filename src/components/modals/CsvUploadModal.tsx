import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { parseCsvFile } from '../../utils/csvParser';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { sampleCsvContentPJBankSep2026 } from '../../data/mockData';
import { X, Upload, FileSpreadsheet, Check, Sparkles, AlertCircle } from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { importCsvContent } = useApp();
  const [csvRawText, setCsvRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      updatePreview(text);
    };
    reader.readAsText(file, 'utf-8');
  };

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

  const handlePasteChange = (text: string) => {
    setCsvRawText(text);
    setFileName('colado_manualmente.csv');
    updatePreview(text);
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
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Importação de Relatório / Extrato CSV</h2>
              <p className="text-2xs text-slate-500">
                Suporta extratos bancários de condomínios (PJBank, Inter, Bradesco, Cora, etc.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* File Picker & Demo button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-sky-600 mb-1" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Clique para selecionar arquivo .CSV do computador'}
              </span>
              <span className="text-2xs text-slate-400 mt-0.5">
                Separador vírgula ou ponto-e-vírgula (;)
              </span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold shadow-xs transition w-full justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Carregar Demo PJBank</span>
              </button>
            </div>
          </div>

          {/* Paste Raw CSV */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Ou cole o conteúdo CSV diretamente:
              </label>
              {csvRawText && (
                <button
                  onClick={() => {
                    setCsvRawText('');
                    setPreviewData(null);
                    setFileName('');
                  }}
                  className="text-2xs text-rose-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={csvRawText}
              onChange={e => handlePasteChange(e.target.value)}
              placeholder="Data;Historico;Documento;Valor;Tipo&#10;05/09/2026;SERVCLEAN TERCEIRIZACAO;-14850.00;D..."
              className="w-full font-mono text-2xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:border-sky-500 bg-slate-50"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {previewData && (
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="text-xs">
                  Pré-visualização do Arquivo ({previewData.totalRows} movimentações identificadas)
                </span>
                <span className="text-2xs text-slate-500">
                  Separador: &ldquo;{previewData.detectedDelimiter}&rdquo; &bull; Débitos:{' '}
                  <strong className="text-red-600 font-mono">
                    {formatCurrency(previewData.debitsTotal)}
                  </strong>
                </span>
              </div>

              <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-lg bg-white">
                <table className="w-full text-left text-2xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Data</th>
                      <th className="py-2 px-2.5">Histórico / Descrição</th>
                      <th className="py-2 px-2.5">Doc</th>
                      <th className="py-2 px-2.5 text-right">Valor</th>
                      <th className="py-2 px-2.5 text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.transactions.slice(0, 8).map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="py-1.5 px-2.5 font-mono">{formatDateBR(tx.date)}</td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900 truncate max-w-[200px]">
                          {tx.description}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 font-mono">
                          {tx.document || '-'}
                        </td>
                        <td
                          className={`py-1.5 px-2.5 text-right font-mono font-bold ${
                            tx.type === 'debito' ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {tx.type === 'debito' ? '-' : '+'} {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-3xs font-bold uppercase ${
                              tx.type === 'debito'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.transactions.length > 8 && (
                <div className="text-center text-3xs text-slate-400">
                  ... e mais {previewData.transactions.length - 8} movimentações prontas para importar.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
          >
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
