import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Compass, FileText, Lightbulb } from 'lucide-react';
import type { Grammar } from '../Grammars/types';
import { normalizeGrammar } from '../Grammars/utils.ts';
import { RecursiveDescentParser } from '../Parsers/recursiveDescent';
import type { RecursiveStep } from '../Parsers/recursiveDescent';
import { GrammarInput } from '../Components/Common/grammarInput';
import { ResultPanel } from '../Components/Common/resultPanel';
import { RecursiveSimulation } from '../Components/RecursiveDescent/recursiveSimulation';
import { RecursiveParseTreeView } from '../Components/RecursiveDescent/recursiveParseTreeView';

import { saveToHistory } from '../Components/utils/history.ts';


export function RecursivePage() {
  const [grammarText, setGrammarText] = useState(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
  
  const [inputString, setInputString] = useState('id + id * id');
  const [parsedGrammar, setParsedGrammar] = useState<Grammar | null>(null);
  const [parseResult, setParseResult] = useState<{ accepted: boolean; steps: RecursiveStep[]; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'grammar' | 'simulation'>('grammar');
  const [showTree, setShowTree] = useState(false);

  useEffect(() => {
          const handleLoad = (event: CustomEvent) => {
              const { grammar, inputString } = event.detail;
              setGrammarText(grammar);
              setInputString(inputString);
              setTimeout(() => handleAnalyze(), 100);
          };
          
          window.addEventListener('loadFromHistory', handleLoad as EventListener);
          return () => window.removeEventListener('loadFromHistory', handleLoad as EventListener);
      }, []);

  const parseGrammar = (text: string): Grammar | null => {
    const lines = text.trim().split('\n');
    const productions = [];
    
    for (const line of lines) {
      const [lhs, rhs] = line.split('→').map(s => s.trim());
      const alternatives = rhs.split('|').map(alt => alt.trim());
      
      for (const alt of alternatives) {
        const symbols = alt === 'ε' ? ['ε'] : alt.split(' ').filter(s => s.length > 0);
        productions.push({ lhs, rhs: symbols });
      }
    }
    
    if (productions.length === 0) return null;
    
    return normalizeGrammar({
      productions,
      start: productions[0].lhs,
      terminals: new Set(),
      nonTerminals: new Set()
    });
  };

  const handleAnalyze = () => {
    const grammar = parseGrammar(grammarText);
    if (!grammar) {
      alert('Error al parsear la gramática');
      return;
    }
    
    setParsedGrammar(grammar);
    setParseResult(null);
  };

  const handleParse = () => {
    if (!parsedGrammar) {
      alert('Primero analiza la gramática');
      return;
    }
    
    const parser = new RecursiveDescentParser(parsedGrammar);
    const result = parser.parse(inputString);
    setParseResult(result);
    setActiveTab('simulation');
    saveToHistory(grammarText, inputString, 'Des. Rec.', result.accepted);
  };

  const loadExample = (type: 'arithmetic' | 'simple') => {
    if (type === 'arithmetic') {
      setGrammarText(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
      setInputString('id + id * id');
    } else {
      setGrammarText(`S → A B\nA → a A | ε\nB → b B | ε`);
      setInputString('a a b b');
    }
    handleAnalyze();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <GrammarInput
        grammarText={grammarText}
        setGrammarText={setGrammarText}
        inputString={inputString}
        setInputString={setInputString}
        onAnalyze={handleAnalyze}
        onParse={handleParse}
        onLoadExample={loadExample}
        hasParser={!!parsedGrammar}
        parserName="Recursive Descent"
      />
      
      <ResultPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'grammar', label: 'Gramática', disabled: false },
          { id: 'simulation', label: 'Simulación', disabled: !parseResult }
        ]}
      >
        {activeTab === 'grammar' && parsedGrammar && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Información de la Gramática
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Terminales:</span> <span className="text-blue-300">{Array.from(parsedGrammar.terminals).join(', ')}</span></p>
                <p><span className="text-gray-500">No terminales:</span> <span className="text-yellow-300">{Array.from(parsedGrammar.nonTerminals).join(', ')}</span></p>
                <p><span className="text-gray-500">Símbolo inicial:</span> <span className="text-green-300">{parsedGrammar.start}</span></p>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Sobre Recursive Descent
              </h4>
              <p className="text-sm text-gray-300">
                El parser Recursive Descent utiliza backtracking para probar diferentes producciones.
                Cada no terminal tiene una función que intenta todas las producciones posibles.
                </p>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && parseResult && (
          <RecursiveSimulation
            steps={parseResult.steps}
            accepted={parseResult.accepted}
            error={parseResult.error}
          />
        )}

        {activeTab === 'grammar' && !parsedGrammar && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-blue-300 mb-4" />
            <p className="text-gray-400">Ingresa una gramática y presiona</p>
            <p className="text-blue-400 text-sm mt-2">"Analizar Gramática"</p>
          </div>
        )}
      </ResultPanel>

      <div className="lg:col-span-2">
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Arbol de parseo (Recursive)
            </h3>
            <button
              onClick={() => setShowTree(!showTree)}
              className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              {showTree ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showTree ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showTree && parseResult && parsedGrammar && (
            <div className="p-6">
              <RecursiveParseTreeView
                steps={parseResult.steps}
                startSymbol={parsedGrammar.start}
                terminals={parsedGrammar.terminals}
              />
            </div>
          )}

          {showTree && (!parseResult || !parsedGrammar) && (
            <div className="p-6 text-center text-gray-400">
              Ejecuta una simulacion para construir el arbol
            </div>
          )}
        </div>
      </div>
    </div>
  );
}