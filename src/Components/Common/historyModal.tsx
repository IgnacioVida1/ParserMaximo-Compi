import { useState, useEffect, useRef } from 'react';
import { Check, ClipboardList, Copy, FileText, History, Save, Trash2, X } from 'lucide-react';
import { loadHistory, deleteFromHistory, clearHistory } from '../utils/history';
import type { HistoryItem } from '../utils/history';

interface HistoryModalProps {
    onLoad: (grammar: string, inputString: string) => void;
    currentParser: string;
}

export function HistoryModal({ onLoad, currentParser }: HistoryModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const refreshHistory = () => {
        setHistory(loadHistory());
    };

    useEffect(() => {
        if (isOpen) {
            refreshHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleUpdate = () => refreshHistory();
        window.addEventListener('historyUpdated', handleUpdate);
        return () => window.removeEventListener('historyUpdated', handleUpdate);
    }, []);

    const handleDelete = (id: string) => {
        deleteFromHistory(id);
        refreshHistory();
    };

    const handleClearAll = () => {
        if (confirm('¿Eliminar todo el historial?')) {
            clearHistory();
            refreshHistory();
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        return `Hace ${days} d`;
    };

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-4 right-4 z-30 p-3 rounded-full shadow-lg transition-all hover:scale-110 ${
                    isOpen 
                        ? 'opacity-0 pointer-events-none' 
                        : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title="Historial"
            >
                <History className="w-5 h-5 text-blue-400" />
                {history.length > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {history.length > 9 ? '9+' : history.length}
                    </span>
                )}
            </button>

            {/* Modal */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[85vh] overflow-hidden shadow-2xl mx-4 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - fijo */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Historial de Análisis</h2>
                                <span className="text-xs text-gray-300">({history.length} items)</span>
                            </div>
                            <div className="flex gap-2">
                                {history.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                        title="Eliminar todo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-200" />
                                </button>
                            </div>
                        </div>

                        {/* Lista de historial - scrollable */}
                        <div 
                            ref={modalContentRef}
                            className="flex-1 overflow-y-auto p-4 space-y-3"
                            style={{ maxHeight: 'calc(85vh - 120px)' }}
                        >
                            {history.length === 0 ? (
                                        <div className="text-center py-12 text-gray-300">
                                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay análisis guardados</p>
                                    <p className="text-xs mt-1">Al validar una cadena se guardará automáticamente</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-500 transition-all p-4 cursor-pointer hover:bg-slate-800/50"
                                        onClick={() => {
                                            onLoad(item.grammar, item.inputString);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Contenido principal */}
                                            <div className="flex-1 min-w-0">
                                                {/* Tags */}
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                        item.accepted 
                                                            ? 'bg-green-500/20 text-green-400' 
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {item.accepted ? '✓ Aceptada' : '✗ Rechazada'}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                                        {item.parserType}
                                                    </span>
                                                    <span className="text-xs text-gray-300">
                                                        {formatDate(item.timestamp)}
                                                    </span>
                                                </div>
                                                
                                                {/* Cadena de entrada */}
                                                <div className="font-mono text-sm text-cyan-400 truncate mb-2 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-cyan-400" />
                                                    {item.inputString || '(sin cadena)'}
                                                </div>
                                                
                                                {/* Gramática */}
                                                <div className="bg-slate-800/50 rounded-lg p-2 font-mono text-xs text-gray-300 max-h-24 overflow-y-auto">
                                                    {item.grammar.split('\n').map((line, idx) => (
                                                        <div key={idx} className="truncate">
                                                            {line}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Botones de acción */}
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(item.grammar, item.id); }}
                                                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Copiar gramática"
                                                >
                                                    {copied === item.id ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer - fijo */}
                        <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50 text-xs text-gray-300 flex justify-between flex-shrink-0">
                            <span className="inline-flex items-center gap-2">
                                <Save className="w-3.5 h-3.5" />
                                Los análisis se guardan automáticamente
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5" />
                                Haz clic en un item para cargarlo
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}