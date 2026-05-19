import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, FileText } from 'lucide-react';

interface LRClosureViewProps {
    state: any[];
    stateIndex: number;
    itemToString: (item: any) => string;
    isCurrent?: boolean;
}

export function LRClosureView({ state, stateIndex, itemToString, isCurrent = false }: LRClosureViewProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        const text = state.map(item => itemToString(item)).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Clasificar items basado en la posición del punto
    const isShiftItem = (item: any): boolean => {
        const str = itemToString(item);
        // Buscar punto y verificar si no está al final
        const dotIndex = str.indexOf('.');
        if (dotIndex === -1) return false;
        // Si el punto está antes del final y no es producción ε
        return dotIndex !== str.length - 1 && !str.includes('→ .');
    };

    const isReduceItem = (item: any): boolean => {
        const str = itemToString(item);
        // Punto al final o producción ε
        return str.endsWith('.') || str.includes('→ .');
    };

    const shiftItems = state.filter(item => isShiftItem(item));
    const reduceItems = state.filter(item => isReduceItem(item));
    const otherItems = state.filter(item => !isShiftItem(item) && !isReduceItem(item));

    return (
        <div className={`bg-slate-900 rounded-lg border text-gray-200 transition-all ${
            isCurrent ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700'
        }`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-mono font-bold text-yellow-400">I{stateIndex}</span>
                    <span className="text-xs text-gray-300">
                        {state.length} items | 
                        {shiftItems.length} shift | 
                        {reduceItems.length} reduce
                    </span>
                    {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                            Estado actual
                        </span>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                    title="Copiar items"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </button>
            </button>
            
            {isExpanded && (
                <div className="px-4 pb-3 space-y-2 border-t text-gray-300 border-slate-700 pt-2">
                    {shiftItems.length > 0 && (
                        <div>
                            <div className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                                <span>⤷ Shift items (punto no al final)</span>
                            </div>
                            <div className="space-y-1 ml-4">
                                {shiftItems.map((item, idx) => (
                                    <div key={idx} className="font-mono text-sm text-gray-300">
                                        {itemToString(item)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {reduceItems.length > 0 && (
                        <div>
                            <div className="text-xs text-green-400 mb-1 flex items-center gap-1">
                                <span>⤶ Reduce items (punto al final)</span>
                            </div>
                            <div className="space-y-1 ml-4">
                                {reduceItems.map((item, idx) => (
                                    <div key={idx} className="font-mono text-sm text-gray-300">
                                        {itemToString(item)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {otherItems.length > 0 && (
                        <div>
                            <div className="text-xs text-gray-300 mb-1 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                Otros items
                            </div>
                            <div className="space-y-1 ml-4">
                                {otherItems.map((item, idx) => (
                                    <div key={idx} className="font-mono text-sm text-gray-300">
                                        {itemToString(item)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}