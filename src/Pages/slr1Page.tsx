import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Compass, Lightbulb, Pin, Target } from 'lucide-react';
import type { Grammar } from '../Grammars/types';
import { normalizeGrammar } from '../Grammars/utils';
import { SLR1Parser } from '../Parsers/slr1';
import type { SLR1ParseStep } from '../Parsers/slr1';
import { LR0ItemSet } from '../Parsers/lr0/lr0Items';
import { GrammarInput } from '../Components/Common/grammarInput';
import { ResultPanel } from '../Components/Common/resultPanel';
import { LR0StatesView } from '../Components/LR0/lr0StatesView';
import { SLR1TablesView } from '../Components/SLR1/slr1Table';
import { SLR1Simulation } from '../Components/SLR1/slr1Simulation';

import { LRAutomatonView } from '../Components/Common/LRAutomatonView';
import { LRClosureView } from '../Components/Common/LRClosureView';

import { saveToHistory } from '../Components/utils/history';

import { ExportToPDF } from '../Components/Common/exportToPdf';

type SLR1Tab = 'states' | 'tables' | 'simulation';

export function SLR1Page() {

      const tableRef = useRef<HTMLDivElement>(null);
  
  const [grammarText, setGrammarText] = useState(`E → T E2\nE2 → + T E2 | ε\nT → F T2\nT2 → * F T2 | ε\nF → ( E ) | id`);
  
  const [inputString, setInputString] = useState('id + id * id');
  const [parsedGrammar, setParsedGrammar] = useState<Grammar | null>(null);
  const [slr1Parser, setSlr1Parser] = useState<SLR1Parser | null>(null);
  const [itemSet, setItemSet] = useState<LR0ItemSet | null>(null);
  const [parseResult, setParseResult] = useState<{ accepted: boolean; steps: SLR1ParseStep[]; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<SLR1Tab>('states');

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

  const buildTransitionMap = (parser: SLR1Parser): Map<string, Map<string, number>> => {
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

  const buildPathToState = (parser: SLR1Parser, targetState: number | null): number[] | undefined => {
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
    const parser = new SLR1Parser(grammar);
    const items = new LR0ItemSet(grammar);
    setSlr1Parser(parser);
    setItemSet(items);
    setParseResult(null);
  };

  const handleParse = () => {
    if (!slr1Parser) {
      alert('Primero analiza la gramática');
      return;
    }
    
    try {
      const result = slr1Parser.parse(inputString);
      console.log('Resultado SLR(1):', result);
      setParseResult(result);
      setActiveTab('simulation');
      saveToHistory(grammarText, inputString, 'SLR(1)', result.accepted);
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
        hasParser={!!slr1Parser}
        parserName="SLR(1)"
      />
      
      <ResultPanel<SLR1Tab>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'states', label: 'Estados LR(0)', disabled: !slr1Parser },
          { id: 'tables', label: 'Tablas SLR(1)', disabled: !slr1Parser },
          { id: 'simulation', label: 'Simulación', disabled: !parseResult }
        ]}
      >
        {activeTab === 'states' && slr1Parser && itemSet && (
        <div className="space-y-6">
            {/* FOLLOW sets */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> FOLLOW sets (usados para reducciones)
            </h3>
            <div className="space-y-2">
                {Array.from(slr1Parser.getFollow().entries()).map(([nt, set]) => (
                <div key={nt} className="bg-slate-900 rounded p-2 font-mono text-sm">
                    <span className="text-yellow-400">FOLLOW({nt})</span>
                    <span className="text-gray-300"> = </span>
                    <span className="text-purple-300">{'{ ' + Array.from(set).join(', ') + ' }'}</span>
                </div>
                ))}
            </div>
        </div>
    
    {/* Estados LR(0) */}
    <LR0StatesView states={slr1Parser.getStates()} itemSet={itemSet} />
  </div>
)}

        {activeTab === 'tables' && slr1Parser && parsedGrammar && (
          <div className="animate-fadeIn">
            <div className='flex justify-end mb-3'>
              <ExportToPDF 
                tableRef={tableRef}
                title="Tabla SLR(1)"
                parserType="SLR(1)"
                grammar={grammarText}
                inputString={inputString}
              />
            </div>
            <div ref={tableRef}>
          <SLR1TablesView
            actionTable={slr1Parser.getActionTable()}
            gotoTable={slr1Parser.getGotoTable()}
            terminals={Array.from(parsedGrammar.terminals)}
            nonTerminals={Array.from(parsedGrammar.nonTerminals)}
            numStates={slr1Parser.getStates().length}
          />
          </div>
          </div>
        )}

        {activeTab === 'simulation' && parseResult && (
          <SLR1Simulation
            steps={parseResult.steps}
            accepted={parseResult.accepted}
            error={parseResult.error}
          />
        )}

        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Sobre SLR(1)
          </h4>
            <p className="text-sm text-gray-300">
                SLR(1) (Simple LR) es una mejora de LR(0) que utiliza los conjuntos FOLLOW para resolver conflictos.
                Es más poderoso que LR(0) pero mantiene un número manejable de estados.
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><Pin className="w-4 h-4" />Características:</span><br/>
                • Construcción basada en items LR(0)<br/>
                • Usa FOLLOW para decidir reducciones<br/>
                • Resuelve muchos conflictos shift/reduce<br/>
                • Más compacto que LR(1)
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Ventajas:</span> Maneja ε-producciones, más potente que LR(0)<br/>
            <span className="text-yellow-400 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Desventajas:</span> Aún puede tener conflictos que LR(1) resolvería
            </p>
        </div>

      </ResultPanel>

      <div className="lg:col-span-2">
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Autómata SLR(1)
            </h3>
            <button
              onClick={() => setShowAutomaton(!showAutomaton)}
              className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              {showAutomaton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showAutomaton ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showAutomaton && slr1Parser && (
            <div className="p-6 space-y-4">
              <LRAutomatonView
                states={slr1Parser.getStates()}
                transitions={buildTransitionMap(slr1Parser)}
                title="Autómata SLR(1)"
                type="slr1"
                currentState={selectedState ?? undefined}
                highlightPath={buildPathToState(slr1Parser, selectedState)}
              />

              <div className="mt-3">
                <label className="text-xs text-gray-300 mb-1 block">Ver estado específico:</label>
                <select
                  value={selectedState ?? ''}
                  onChange={(e) => setSelectedState(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-mono"
                >
                  <option value="">Todos los estados</option>
                  {slr1Parser.getStates().map((_, idx) => (
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
                    max={Math.max(0, slr1Parser.getStates().length - 1)}
                    value={selectedState ?? 0}
                    onChange={(e) => setSelectedState(parseInt(e.target.value))}
                    disabled={selectedState === null}
                    className="w-full accent-blue-500"
                  />
                  <button
                    onClick={() => setSelectedState(Math.min(slr1Parser.getStates().length - 1, (selectedState ?? 0) + 1))}
                    disabled={selectedState === null || (selectedState ?? 0) >= slr1Parser.getStates().length - 1}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs disabled:opacity-40"
                  >
                    ▶
                  </button>
                  <span className="text-xs text-gray-300 font-mono">I{selectedState ?? 0}</span>
                </div>
              </div>

              {selectedState !== null && slr1Parser.getStates()[selectedState] && (
                <LRClosureView
                  state={slr1Parser.getStates()[selectedState]}
                  stateIndex={selectedState}
                  itemToString={slr1Parser.getItemSet().itemToString.bind(slr1Parser.getItemSet())}
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