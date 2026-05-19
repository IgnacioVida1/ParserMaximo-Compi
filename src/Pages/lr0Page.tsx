import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Compass, Lightbulb, Pin, Wrench } from 'lucide-react';
import type { Grammar } from '../Grammars/types';
import { normalizeGrammar } from '../Grammars/utils';
import { LR0Parser } from '../Parsers/lr0/lr0';
import type { LR0ParseStep } from '../Parsers/lr0/lr0';
import { LR0ItemSet } from '../Parsers/lr0/lr0Items';
import { GrammarInput } from '../Components/Common/grammarInput';
import { ResultPanel } from '../Components/Common/resultPanel';
import { LR0StatesView } from '../Components/LR0/lr0StatesView';
import { LR0TablesView } from '../Components/LR0/lr0Tables';
import { LR0Simulation } from '../Components/LR0/lr0Simulation';

import { LRAutomatonView } from '../Components/Common/LRAutomatonView';
import { LRClosureView } from '../Components/Common/LRClosureView';

import { saveToHistory } from '../Components/utils/history';

import { ExportToPDF } from '../Components/Common/exportToPdf';

type LR0Tab = 'states' | 'tables' | 'simulation';

export function LR0Page() {

    const tableRef = useRef<HTMLDivElement>(null);


  const [grammarText, setGrammarText] = useState(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
  const [inputString, setInputString] = useState('id + id * id');
  const [parsedGrammar, setParsedGrammar] = useState<Grammar | null>(null);
  const [lr0Parser, setLr0Parser] = useState<LR0Parser | null>(null);
  const [itemSet, setItemSet] = useState<LR0ItemSet | null>(null);
  const [parseResult, setParseResult] = useState<{ accepted: boolean; steps: LR0ParseStep[]; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<LR0Tab>('states');

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

  const buildTransitionMap = (parser: LR0Parser): Map<string, Map<string, number>> => {
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

  const buildPathToState = (parser: LR0Parser, targetState: number | null): number[] | undefined => {
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

      if (!line.includes('→')) {
        console.warn(`Línea inválida: ${line}`);
        continue;
      }

      const [lhs, rhs] = line.split('→').map(s => s.trim());
      if (!lhs || !rhs) {
        console.warn(`Formato inválido en: ${line}`);
        continue;
      }
      const alternatives = rhs.split('|').map(alt => alt.trim());
      
      for (const alt of alternatives) {
        const symbols = alt === 'ε' ? ['ε'] : alt.split(' ').filter(s => s.length > 0);
        productions.push({ lhs, rhs: symbols });
      }
    }
    
    if (productions.length === 0) return null;
    
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
    const parser = new LR0Parser(grammar);
    const items = new LR0ItemSet(grammar);
    setLr0Parser(parser);
    setItemSet(items);
    setParseResult(null);
  };

  const handleParse = () => {
    if (!lr0Parser) {
      alert('Primero analiza la gramática');
      return;
    }
    
    try {
      const result = lr0Parser.parse(inputString);
      console.log('Resultado parse:', result);
      setParseResult(result);
      setActiveTab('simulation');
      saveToHistory(grammarText, inputString, 'LR(0)', result.accepted);
    } catch (error) {
      console.error('Error al parsear cadena:', error);
      alert('Error al validar la cadena');
    }
  };

  const loadExample = (type: 'arithmetic' | 'simple') => {
    if (type === 'arithmetic') {
      setGrammarText(`E → T E'\nE' → + T E' | ε\nT → F T'\nT' → * F T' | ε\nF → ( E ) | id`);
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
        hasParser={!!lr0Parser}
        parserName="LR(0)"
      />
      
      <ResultPanel<LR0Tab>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'states', label: 'Estados LR(0)', disabled: !lr0Parser },
          { id: 'tables', label: 'Tablas LR(0)', disabled: !lr0Parser },
          { id: 'simulation', label: 'Simulación', disabled: !parseResult },
        ]}
      >
        {activeTab === 'states' && lr0Parser && itemSet && (
          <div className="animate-fadeIn">
            <LR0StatesView
              states={lr0Parser.getStates()}
              itemSet={itemSet}
            />
          </div>
        )}

        {activeTab === 'tables' && lr0Parser && parsedGrammar && (
          <div className="animate-fadeIn">
            <div className='flex justify-end mb-3'>
              <ExportToPDF
                tableRef={tableRef}
                title="Tabla LR(0)"
                parserType="LR(0)"
                grammar={grammarText}
                inputString={inputString}
              />
            </div>
            <div ref={tableRef}>
            <LR0TablesView
              actionTable={lr0Parser.getActionTable()}
              gotoTable={lr0Parser.getGotoTable()}
              terminals={Array.from(parsedGrammar.terminals)}
              nonTerminals={Array.from(parsedGrammar.nonTerminals)}
              numStates={lr0Parser.getStates().length}
            />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && parseResult && (
          <div className="animate-fadeIn">
            <LR0Simulation
              steps={parseResult.steps}
              accepted={parseResult.accepted}
              error={parseResult.error}
            />
          </div>
        )}

        {activeTab === 'states' && !lr0Parser && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="w-12 h-12 text-blue-300 mb-4" />
            <p className="text-gray-400">Ingresa una gramática y presiona</p>
            <p className="text-blue-400 text-sm mt-2">"Analizar Gramática"</p>
          </div>
        )}

        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Sobre LR(0)
          </h4>
            <p className="text-sm text-gray-300">
                El parser LR(0) es un parser ascendente que utiliza un autómata de estados finitos con items LR(0).
                Toma decisiones de parseo basándose únicamente en el estado actual, sin lookahead.
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><Pin className="w-4 h-4" />Características:</span><br/>
                • Lee la entrada de izquierda a derecha<br/>
                • Produce una derivación por la derecha (inversa)<br/>
                • Utiliza 0 símbolos de lookahead<br/>
                • Tablas ACTION y GOTO
            </p>
            <p className="text-sm text-gray-300 mt-2">
            <span className="text-yellow-400 inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Limitaciones:</span><br/>
                • No puede manejar ε-producciones fácilmente<br/>
                • Conflicto shift/reduce en muchos casos<br/>
                • Uso principalmente educativo
            </p>
        </div>
      </ResultPanel>

      <div className="lg:col-span-2">
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Autómata LR(0)
            </h3>
            <button
              onClick={() => setShowAutomaton(!showAutomaton)}
              className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              {showAutomaton ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {showAutomaton ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showAutomaton && lr0Parser && (
            <div className="p-6 space-y-4">
              <LRAutomatonView
                states={lr0Parser.getStates()}
                transitions={buildTransitionMap(lr0Parser)}
                title="Autómata LR(0)"
                type="lr0"
                currentState={selectedState ?? undefined}
                highlightPath={buildPathToState(lr0Parser, selectedState)}
              />

              <div className="mt-3">
                <label className="text-xs text-gray-300 mb-1 block">Ver estado específico:</label>
                <select
                  value={selectedState ?? ''}
                  onChange={(e) => setSelectedState(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-mono"
                >
                  <option value="">Todos los estados</option>
                  {lr0Parser.getStates().map((_, idx) => (
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
                    max={Math.max(0, lr0Parser.getStates().length - 1)}
                    value={selectedState ?? 0}
                    onChange={(e) => setSelectedState(parseInt(e.target.value))}
                    disabled={selectedState === null}
                    className="w-full accent-blue-500"
                  />
                  <button
                    onClick={() => setSelectedState(Math.min(lr0Parser.getStates().length - 1, (selectedState ?? 0) + 1))}
                    disabled={selectedState === null || (selectedState ?? 0) >= lr0Parser.getStates().length - 1}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs disabled:opacity-40"
                  >
                    ▶
                  </button>
                  <span className="text-xs text-gray-300 font-mono">I{selectedState ?? 0}</span>
                </div>
              </div>

              {selectedState !== null && lr0Parser.getStates()[selectedState] && (
                <LRClosureView
                  state={lr0Parser.getStates()[selectedState]}
                  stateIndex={selectedState}
                  itemToString={lr0Parser.getItemSet().itemToString.bind(lr0Parser.getItemSet())}
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