import { useState, useRef, useEffect } from 'react';
import { BarChart3, ChevronDown, ChevronRight, Compass, FileText, Lightbulb, Target } from 'lucide-react';
import type { Grammar, FirstFollow } from '../Grammars/types';
import { GrammarInput } from '../Components/Common/grammarInput';
import { ResultPanel } from '../Components/Common/resultPanel';
import { computeFirst } from '../Grammars/first';
import { computeFollow } from '../Grammars/follow';
import { normalizeGrammar } from '../Grammars/utils';
import { LL1Parser } from '../Parsers/ll1.ts';
import type { ParseStep } from '../Parsers/ll1.ts';
import { LL1Simulation } from '../Components/LL1/parseSimulation';
import { LL1TableView } from '../Components/LL1/LL1table.tsx';
import { LL1ParseTreeView } from '../Components/LL1/parseTreeView.tsx';

import { saveToHistory } from '../Components/utils/history.ts';

import { ExportToPDF } from '../Components/Common/exportToPdf.tsx';

type LL1Tab = 'grammar' | 'table' | 'simulation';

export function LL1Page() {

  const tableRef = useRef<HTMLDivElement>(null);

  const [grammarText, setGrammarText] = useState(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
  const [inputString, setInputString] = useState('id + id * id');
  const [firstFollow, setFirstFollow] = useState<FirstFollow | null>(null);
  const [parsedGrammar, setParsedGrammar] = useState<Grammar | null>(null);
  const [ll1Parser, setLl1Parser] = useState<LL1Parser | null>(null);
  const [parseResult, setParseResult] = useState<{ accepted: boolean; steps: ParseStep[]; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<LL1Tab>('grammar');
  const [showTree, setShowTree] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [grammarText]);

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
      const alternatives = rhs.split('|').map(s => s.trim());

      for (const alt of alternatives) {
        const symbols = alt === 'ε' ? ['ε'] : alt.split(' ').filter(s => s.length > 0);
        productions.push({ lhs, rhs: symbols });
      }
    }

    if (productions.length === 0) { return null };

    const grammar = normalizeGrammar({
      productions,
      start: productions[0].lhs,
      terminals: new Set(),
      nonTerminals: new Set()
    });

    return grammar;
  };

  const handleAnalyze = () => {
    const grammar = parseGrammar(grammarText);
    if (!grammar) {
      alert('Error al parsear la gramática');
      return;
    }
    
    setParsedGrammar(grammar);
    const first = computeFirst(grammar);
    const follow = computeFollow(grammar, first);
    setFirstFollow({ first, follow });

    const parser = new LL1Parser(grammar, {first, follow});
    setLl1Parser(parser);

    if (!parser.isLL1()) {
      console.warn('La gramática no es LL(1):', parser.getErrors());
    }
  };

  const handleParse = () => {
    if (!ll1Parser) { 
      alert('Primero calcula FIRST y FOLLOW');
      return;
    }

    const result = ll1Parser.parse(inputString);
    setParseResult(result);
    setActiveTab('simulation');

    saveToHistory(grammarText, inputString, 'LL(1)', result.accepted);
  };

  const loadExample = (type: 'arithmetic' | 'simple') => {
    if (type === 'arithmetic') {
      setGrammarText(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
      setInputString('id + id * id');
    } else {
      setGrammarText(`S → A B\nA → a A | ε\nB → b B | ε`);
      setInputString('a a b b');
    }
  };

  return (
    <>
      <div className='grid ld:grid-cols-2 gap-6'>
        <GrammarInput
            grammarText={grammarText}
            setGrammarText={setGrammarText}
            inputString={inputString}
            setInputString={setInputString}
            onAnalyze={handleAnalyze}
            onParse={handleParse}
            onLoadExample={loadExample}
            hasParser={!!ll1Parser}
            isLL1={ll1Parser?.isLL1()}
        />
        <ResultPanel<LL1Tab>
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={[
                {id: 'grammar', label: 'FIRST & FOLLOW', disabled: false},
                {id: 'table', label: 'Tabla LL(1)', disabled: !ll1Parser},
                {id: 'simulation', label: 'Simulación', disabled: !parseResult}
            ]}
        >
        {activeTab === 'grammar' && firstFollow && parsedGrammar && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> FIRST
              </h3>
              <div className="space-y-2">
                {Array.from(firstFollow.first.entries()).map(([nt, set]) => (
                  <div key={nt} className="bg-slate-900 rounded-lg p-3 font-mono text-sm border border-slate-700">
                    <span className="text-yellow-400 font-bold">{nt}</span>
                    <span className="text-gray-300 mx-2">=</span>
                    <span className="text-green-300">{'{ ' + Array.from(set).join(', ') + ' }'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> FOLLOW
              </h3>
              <div className="space-y-2">
                {Array.from(firstFollow.follow.entries()).map(([nt, set]) => (
                  <div key={nt} className="bg-slate-900 rounded-lg p-3 font-mono text-sm border border-slate-700">
                    <span className="text-yellow-400 font-bold">{nt}</span>
                    <span className="text-gray-300 mx-2">=</span>
                    <span className="text-purple-300">{'{ ' + Array.from(set).join(', ') + ' }'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Información de la Gramática
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-300">Terminales:</span> <span className="text-blue-300">{Array.from(parsedGrammar.terminals).join(', ')}</span></p>
                <p><span className="text-gray-300">No terminales:</span> <span className="text-yellow-300">{Array.from(parsedGrammar.nonTerminals).join(', ')}</span></p>
                <p><span className="text-gray-300">Símbolo inicial:</span> <span className="text-green-300">{parsedGrammar.start}</span></p>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Sobre LL(1)
              </h4>
              <p className="text-sm text-gray-300">
                El parser LL(1) es un parser predictivo que utiliza una tabla generada a partir de FIRST y FOLLOW.
                No necesita backtracking, lo que lo hace más eficiente que Recursive Descent.
              </p>
              <p className="text-sm text-gray-300 mt-2">
                <span className="text-yellow-400">Para que una gramática sea LL(1):</span><br/>
                • No debe ser ambigua<br/>
                • No debe tener recursión izquierda<br/>
                • Debe estar factorizada
              </p>
            </div>
          </div>
        )}

        {activeTab === 'table' && ll1Parser && parsedGrammar && (
          <div className ="animate-fadeIn">
            <div className="flex justify-end mb-3">
              <ExportToPDF 
                tableRef={tableRef}
                title="Tabla LL(1)"
                parserType="LL(1)"
                grammar={grammarText}
                inputString={inputString}
            />
            </div>
            <div ref={tableRef}>
            <LL1TableView
              table={ll1Parser.getTable()}
              terminals={Array.from(parsedGrammar.terminals)}
              nonTerminals={Array.from(parsedGrammar.nonTerminals)}
            />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && parseResult && (
          <div className="animate-fadeIn">
          <LL1Simulation
            steps={parseResult.steps}
            accepted={parseResult.accepted}
            error={parseResult.error}
          /></div>
        )}

        {activeTab === 'grammar' && !firstFollow && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-blue-300 mb-4" />
            <p className="text-gray-400">Ingresa una gramática y presiona</p>
            <p className="text-blue-400 text-sm mt-2">"Calcular FIRST & FOLLOW"</p>
          </div>
        )}
      </ResultPanel>
    </div>

    <div className="mt-6">
      <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
            <Compass className="w-4 h-4" /> Arbol de parseo LL(1)
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
            <LL1ParseTreeView
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
    </>
  );
}