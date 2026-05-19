import { useRef, useState, useEffect } from 'react';
import { AlertTriangle, BookOpen, Calculator, Search, Type, Zap } from 'lucide-react';
import { VirtualKeyboard } from './virtualKeyboard';

interface GrammarInputProps {
    grammarText: string;
    setGrammarText: (text: string) => void;
    inputString: string;
    setInputString: (text: string) => void;
    onAnalyze: () => void;
    onParse: () => void;
    onLoadExample: (type: 'arithmetic' | 'simple') => void;
    hasParser: boolean;
    isLL1?: boolean;
    ll1Errors?: string[];
    parserName?: string;
}

export function GrammarInput({ 
    grammarText, 
    setGrammarText, 
    inputString, 
    setInputString, 
    onAnalyze, 
    onParse, 
    onLoadExample,
    hasParser,
    isLL1,
    ll1Errors,
    parserName = "Parser"
}: GrammarInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [grammarHeight, setGrammarHeight] = useState(500);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [grammarText]);

    // Función para insertar símbolo desde teclado virtual
    const handleInsertSymbol = (symbol: string) => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText = grammarText.substring(0, start) + symbol + grammarText.substring(end);
            setGrammarText(newText);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + symbol.length, start + symbol.length);
            }, 10);
        } else {
            setGrammarText(grammarText + symbol);
        }
    };

    const handleLoadExample = (type: 'arithmetic' | 'simple') => {
        if (type === 'arithmetic') {
            setGrammarText(`E → T E'
E' → + T E' | ε
T → F T'
T' → * F T' | ε
F → ( E ) | id`);
            setInputString('id + id * id');
        } else {
            setGrammarText(`S → A B
A → a A | ε
B → b B | ε`);
            setInputString('a a b b');
        }
        onLoadExample(type);
    };

    return (
        <div className="space-y-6">
            {/* Layout de dos columnas: 3/4 para gramática, 1/4 para teclado */}
            <div className="flex gap-4">
                {/* Columna izquierda - 3/4 del ancho */}
                <div className="w-3/4">
                    <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl h-full">
                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-3 border-b border-slate-700">
                            <h2 className="font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-300" />
                                Gramática Libre de Contexto
                                <span className="text-xs text-gray-400 ml-2">(Formato: A → α | β)</span>
                            </h2>
                        </div>
                        
                            <div className="p-6 text-gray-200">
                            <textarea
                                ref={textareaRef}
                                value={grammarText}
                                onChange={(e) => setGrammarText(e.target.value)}
                                style={{ height: grammarHeight, minHeight: '400px' }}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                                placeholder="E → T E'&#10;E' → + T E' | ε&#10;..."
                            />
                            
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => handleLoadExample('arithmetic')}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Calculator className="w-4 h-4" />
                                        Aritmética
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleLoadExample('simple')}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Type className="w-4 h-4" />
                                        Simple
                                    </span>
                                </button>
                            </div>
                            
                            <button
                                onClick={onAnalyze}
                                className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-white"
                            >
                                <Zap className="w-4 h-4" />
                                Analizar Gramática
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna derecha - 1/4 del ancho (Teclado Virtual) */}
                <div className="w-1/4">
                    <VirtualKeyboard 
                        onInsert={handleInsertSymbol} 
                        textareaRef={textareaRef}
                        isAlwaysOpen={true}
                    />
                </div>
            </div>

            {/* Tarjeta de Validación - Ahora ocupa todo el ancho */}
            <div className="w-full">
                <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                    <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 px-6 py-3 border-b border-slate-700">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Type className="w-5 h-5 text-emerald-300" />
                            Validación de Cadenas - {parserName}
                        </h2>
                    </div>
                    
                    <div className="p-6">
                            <div className="relative text-gray-200">
                            <input
                                type="text"
                                value={inputString}
                                onChange={(e) => setInputString(e.target.value)}
                                placeholder="Espacio entre tokens"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                            />
                        </div>
                        
                        <button
                            onClick={onParse}
                            className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-white"
                            disabled={!hasParser}
                        >
                            <Search className="w-4 h-4" />
                            Validar Cadena
                        </button>
                        
                        {!hasParser && (
                            <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
                                <p className="text-xs text-yellow-300 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Primero analiza la gramática
                                </p>
                            </div>
                        )}
                        
                        {isLL1 !== undefined && hasParser && !isLL1 && ll1Errors && ll1Errors.length > 0 && (
                            <div className="mt-3 p-2 bg-red-900/30 border border-red-500/50 rounded-lg">
                                <p className="text-xs text-red-300 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {ll1Errors[0]}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}