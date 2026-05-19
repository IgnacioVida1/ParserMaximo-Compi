import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Compass, Lightbulb, Pin, BookOpen } from 'lucide-react';
import type { Grammar } from '../Grammars/types';
import { normalizeGrammar } from '../Grammars/utils';
import { LALR1Parser } from '../Parsers/lalr1/lalr1';
import type { LALR1ParseStep } from '../Parsers/lalr1/lalr1';
import { LALR1ItemSet } from '../Parsers/lalr1/lalr1Items';
import { GrammarInput } from '../Components/Common/grammarInput';
import { ResultPanel } from '../Components/Common/resultPanel';
import { LALR1StatesView } from '../Components/LALR1/lalr1StatesView';
import { LALR1TablesView } from '../Components/LALR1/lalr1Table';
import { LALR1Simulation } from '../Components/LALR1/lalr1Simulation';

import { LRAutomatonView } from '../Components/Common/LRAutomatonView';
import { LRClosureView } from '../Components/Common/LRClosureView';

import { saveToHistory } from '../Components/utils/history';

import { ExportToPDF } from '../Components/Common/exportToPdf';


type LALR1Tab = 'states' | 'tables' | 'simulation';

export function LALR1Page() {

          const tableRef = useRef<HTMLDivElement>(null);
  
  const [grammarText, setGrammarText] = useState(`E → T E2\nE2 → + T E2 | ε\nT → F T2\nT2 → * F T2 | ε\nF → ( E ) | id`);
  
  const [inputString, setInputString] = useState('id + id * id');
  const [parsedGrammar, setParsedGrammar] = useState<Grammar | null>(null);
  const [lalr1Parser, setLalr1Parser] = useState<LALR1Parser | null>(null);
  const [itemSet, setItemSet] = useState<LALR1ItemSet | null>(null);
  const [parseResult, setParseResult] = useState<{ accepted: boolean; steps: LALR1ParseStep[]; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<LALR1Tab>('states');

  const [showAutomaton, setShowAutomaton] = useState(false);
  const [selectedState, setSelectedState] = useState<number | null>(null);

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

  const buildTransitionMap = (parser: LALR1Parser): Map<string, Map<string, number>> => {
          const transitions = new Map<string, Map<string, number>>();
          const actionTable = parser.getActionTable();
          const gotoTable = parser.getGotoTable();
          
          for (let i = 0; i < parser.getStates().length; i++) {
              const stateTransitions = new Map<string, number>();
              
              // Agregar shifts de action table
              const actionRow = actionTable.get(i);
              if (actionRow) {
                  for (const [symbol, action] of actionRow) {
                      if (action.type === 'shift' && action.value !== undefined) {
                          stateTransitions.set(symbol, action.value);
                      }
                  }
              }
              
              // Agregar gotos
              const gotoRow = gotoTable.get(i);
              if (gotoRow) {
                  for (const [symbol, target] of gotoRow) {
                      stateTransitions.set(symbol, target);
                  }
              }
              
              transitions.set(`${i}`, stateTransitions);
          }
          
          return transitions;
      };

  const buildPathToState = (parser: LALR1Parser, targetState: number | null): number[] | undefined => {
    if (targetState === null) return undefined;
    const transitions = buildTransitionMap(parser);
    const start = '0';
    const target = String(targetState);

    const queue: string[] = [start];
    const parent = new Map<string, string | null>();
    parent.set(start, null);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      if (current === target) break;

      const edges = transitions.get(current);
      if (!edges) continue;

      for (const [, next] of edges) {
        const nextKey = String(next);
        if (!parent.has(nextKey)) {
          parent.set(nextKey, current);
          queue.push(nextKey);
        }
      }
    }

    if (!parent.has(target)) return undefined;

    const path: number[] = [];
    let current: string | null = target;
    while (current !== null) {
      path.push(parseInt(current));
      current = parent.get(current) ?? null;
    }

    return path.reverse();
  };

  const parseGrammar = (text: string): Grammar | null => {
    const lines = text.trim().split('\n');
    const productions = [];
    
    for (const line of lines) {
      if (!line.includes('→')) continue;
      
      const [lhs, rhs] = line.split('→').map(s => s.trim());
      if (!lhs || !rhs) continue;
      
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
    const parser = new LALR1Parser(grammar);
    const items = new LALR1ItemSet(grammar);
    setLalr1Parser(parser);
    setItemSet(items);
    setParseResult(null);
  };

  const handleParse = () => {
    if (!lalr1Parser) {
      alert('Primero analiza la gramática');
      return;
    }
    
    try {
      const result = lalr1Parser.parse(inputString);
      console.log('Resultado LALR(1):', result);
      setParseResult(result);
      setActiveTab('simulation');
      saveToHistory(grammarText, inputString, 'LALR(1)', result.accepted);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al validar la cadena');
    }
  };

  const loadExample = (type: 'arithmetic' | 'simple') => {
    if (type === 'arithmetic') {
      setGrammarText(`E → T E2\nE2 → + T E2 | ε\nT → F T2\nT2 → * F T2 | ε\nF → ( E ) | id`);
      setInputString('id + id * id');
    } else {
      setGrammarText(`S → A B\nA → a A | ε\nB → b B | ε`);
      setInputString('a a b b');
    }
    setTimeout(() => handleAnalyze(), 100);
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
        hasParser={!!lalr1Parser}
        parserName="LALR(1)"
      />
      
      <ResultPanel<LALR1Tab>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'states', label: 'Estados LALR(1)', disabled: !lalr1Parser },
          { id: 'tables', label: 'Tablas LALR(1)', disabled: !lalr1Parser },
          { id: 'simulation', label: 'Simulación', disabled: !parseResult }
        ]}
      >
        {activeTab === 'states' && lalr1Parser && itemSet && (
          <LALR1StatesView
            states={lalr1Parser.getStates()}
            itemSet={itemSet}
          />
        )}

        {activeTab === 'tables' && lalr1Parser && parsedGrammar && (
          <div className="animate-fadeIn">
            <div className='flex justify-end mb-3'>
              <ExportToPDF 
                tableRef={tableRef}
                title="Tabla LALR(1)"
                parserType="LALR(1)"
                grammar={grammarText}
                inputString={inputString}
              />
            </div>
            <div ref={tableRef}>
          <LALR1TablesView
            actionTable={lalr1Parser.getActionTable()}
            gotoTable={lalr1Parser.getGotoTable()}
            terminals={Array.from(parsedGrammar.terminals)}
            nonTerminals={Array.from(parsedGrammar.nonTerminals)}
            numStates={lalr1Parser.getStates().length}
          />
          </div>
          </div>
        )}

        {activeTab === 'simulation' && parseResult && (
          <LALR1Simulation
            steps={parseResult.steps}
            accepted={parseResult.accepted}
            error={parseResult.error}
          />
        )}

        <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Sobre LALR(1)
          </h4>
            <p className="text-sm text-gray-300">
                LALR(1) (Look-Ahead LR) es una versión optimizada de LR(1) que fusiona estados con el mismo núcleo.
                Es el parser más utilizado en la práctica (Yacc, Bison, GNU Bison).
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><Pin className="w-4 h-4" />Características:</span><br/>
                • Combina estados LR(1) con el mismo núcleo<br/>
                • Mismo poder que LR(1) en la práctica<br/>
                • Muchos menos estados que LR(1)<br/>
                • Tablas más compactas
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Ventajas:</span> Mismo poder que LR(1) con tamaño de tabla similar a SLR(1)<br/>
            <span className="text-yellow-400 inline-flex items-center gap-1"><Pin className="w-4 h-4" />Uso real:</span> La mayoría de los generadores de parsers (Yacc, Bison, CUP)
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-blue-400 inline-flex items-center gap-1"><BookOpen className="w-4 h-4" />Dato curioso:</span> LALR(1) es el estándar de facto para compiladores de lenguajes de programación
            </p>
        </div>

      </ResultPanel>

      <div className="lg:col-span-2">
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Autómata LALR(1)
            </h3>
            <button
              onClick={() => setShowAutomaton(!showAutomaton)}
              className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              {showAutomaton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showAutomaton ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showAutomaton && lalr1Parser && (
            <div className="p-6 space-y-4">
              <LRAutomatonView
                states={lalr1Parser.getStates()}
                transitions={buildTransitionMap(lalr1Parser)}
                title="Autómata LALR(1)"
                type="lalr1"
                currentState={selectedState ?? undefined}
                highlightPath={buildPathToState(lalr1Parser, selectedState)}
              />

              <div className="mt-3">
                <label className="text-xs text-gray-300 mb-1 block">Ver estado específico:</label>
                <select
                  value={selectedState ?? ''}
                  onChange={(e) => setSelectedState(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-mono"
                >
                  <option value="">Todos los estados</option>
                  {lalr1Parser.getStates().map((_, idx) => (
                    <option key={idx} value={idx}>I{idx}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3">
                <label className="text-xs text-gray-300 mb-1 block">Deslizar estados:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedState(null)}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setSelectedState(Math.max(0, (selectedState ?? 0) - 1))}
                    disabled={selectedState === null || (selectedState ?? 0) <= 0}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs disabled:opacity-40"
                  >
                    ◀
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, lalr1Parser.getStates().length - 1)}
                    value={selectedState ?? 0}
                    onChange={(e) => setSelectedState(parseInt(e.target.value))}
                    disabled={selectedState === null}
                    className="w-full accent-blue-500"
                  />
                  <button
                    onClick={() => setSelectedState(Math.min(lalr1Parser.getStates().length - 1, (selectedState ?? 0) + 1))}
                    disabled={selectedState === null || (selectedState ?? 0) >= lalr1Parser.getStates().length - 1}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs disabled:opacity-40"
                  >
                    ▶
                  </button>
                  <span className="text-xs text-gray-300 font-mono">I{selectedState ?? 0}</span>
                </div>
              </div>

              {selectedState !== null && lalr1Parser.getStates()[selectedState] && (
                <LRClosureView
                  state={lalr1Parser.getStates()[selectedState]}
                  stateIndex={selectedState}
                  itemToString={lalr1Parser.getItemSet().itemToString.bind(lalr1Parser.getItemSet())}
                  isCurrent={true}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}