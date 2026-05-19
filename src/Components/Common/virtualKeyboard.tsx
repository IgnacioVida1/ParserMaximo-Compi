import { useState } from 'react';
import { BookOpen, Check, Copy, Keyboard, Plus, Ruler, Type, Wrench } from 'lucide-react';

interface VirtualKeyboardProps {
    onInsert: (symbol: string) => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    isAlwaysOpen?: boolean; // Nueva prop para controlar si está siempre abierto
}

export function VirtualKeyboard({ onInsert, textareaRef, isAlwaysOpen = false }: VirtualKeyboardProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const symbols = [
        // Símbolos gramaticales
        { label: 'ε', value: 'ε', description: 'Epsilon (vacío)', category: 'grammar' },
        { label: '→', value: ' → ', description: 'Flecha producción', category: 'grammar' },
        { label: '|', value: ' | ', description: 'Alternativa', category: 'grammar' },
        { label: '•', value: '•', description: 'Punto (item)', category: 'grammar' },
        { label: '$', value: '$', description: 'Fin de entrada', category: 'grammar' },
        
        // Operadores
        { label: '+', value: '+', description: 'Suma', category: 'operators' },
        { label: '-', value: '-', description: 'Resta', category: 'operators' },
        { label: '*', value: '*', description: 'Multiplicación', category: 'operators' },
        { label: '/', value: '/', description: 'División', category: 'operators' },
        { label: '=', value: '=', description: 'Igual', category: 'operators' },
        
        // Paréntesis y estructura
        { label: '(', value: '(', description: 'Paréntesis izquierdo', category: 'structure' },
        { label: ')', value: ')', description: 'Paréntesis derecho', category: 'structure' },
        { label: '[', value: '[', description: 'Corchete izquierdo', category: 'structure' },
        { label: ']', value: ']', description: 'Corchete derecho', category: 'structure' },
        { label: '{', value: '{', description: 'Llave izquierda', category: 'structure' },
        { label: '}', value: '}', description: 'Llave derecha', category: 'structure' },
        
        // Palabras clave comunes
        { label: 'id', value: 'id', description: 'Identificador', category: 'keywords' },
        { label: 'num', value: 'num', description: 'Número', category: 'keywords' },
        { label: 'if', value: 'if', description: 'If', category: 'keywords' },
        { label: 'else', value: 'else', description: 'Else', category: 'keywords' },
        { label: 'while', value: 'while', description: 'While', category: 'keywords' },
        { label: 'return', value: 'return', description: 'Return', category: 'keywords' },
        
        // Símbolos adicionales
        { label: ';', value: ';', description: 'Punto y coma', category: 'additional' },
        { label: ',', value: ',', description: 'Coma', category: 'additional' },
        { label: ':', value: ':', description: 'Dos puntos', category: 'additional' },
    ];

    const categories = {
        grammar: { label: 'Gramaticales', icon: BookOpen, color: 'border-purple-500 bg-purple-500/10' },
        operators: { label: 'Operadores', icon: Wrench, color: 'border-blue-500 bg-blue-500/10' },
        structure: { label: 'Estructura', icon: Ruler, color: 'border-green-500 bg-green-500/10' },
        keywords: { label: 'Palabras clave', icon: Type, color: 'border-yellow-500 bg-yellow-500/10' },
        additional: { label: 'Adicionales', icon: Plus, color: 'border-gray-500 bg-gray-500/10' },
    };

    const handleInsert = (symbol: string) => {
        onInsert(symbol);
        
        setCopied(symbol);
        setTimeout(() => setCopied(null), 1000);
    };

    const insertAtCursor = (symbol: string) => {
        if (textareaRef?.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const newText = text.substring(0, start) + symbol + text.substring(end);
            textarea.value = newText;
            
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + symbol.length, start + symbol.length);
            }, 10);
        }
    };

    const handleSymbolClick = (symbol: string) => {
        if (textareaRef?.current) {
            insertAtCursor(symbol);
        } else {
            handleInsert(symbol);
        }
    };

    return (
        <div className="h-full text-gray-400">
            <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-3 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        Teclado virtual
                    </h3>
                    <p className="text-xs text-gray-400">
                        Haz clic para insertar símbolos
                    </p>
                </div>

                {/* Contenido - Scrollable */}
                <div className="p-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '400px' }}>
                    {Object.entries(categories).map(([catKey, catInfo]) => {
                        const catSymbols = symbols.filter(s => s.category === catKey);
                        if (catSymbols.length === 0) return null;
                        
                        return (
                            <div key={catKey} className="space-y-2 mb-4">
                                <div className={`text-xs font-medium px-2 py-1 rounded ${catInfo.color} inline-flex items-center gap-1`}>
                                    <catInfo.icon className="w-3.5 h-3.5" />
                                    {catInfo.label}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {catSymbols.map((symbol) => (
                                        <button
                                            key={symbol.label}
                                            onClick={() => handleSymbolClick(symbol.value)}
                                            className="group relative px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all text-center text-white"
                                            title={symbol.description}
                                        >
                                            <span className="font-mono text-sm">
                                                {symbol.label}
                                            </span>
                                            {copied === symbol.value && (
                                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap z-10">
                                                    ✓ Insertado
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}