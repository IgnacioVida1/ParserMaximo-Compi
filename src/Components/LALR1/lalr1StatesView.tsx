import type { LALR1Item } from '../../Parsers/lalr1/lalr1Items';
import { useState } from 'react';
import { AlertTriangle, Lightbulb } from 'lucide-react';

interface Props {
  states: LALR1Item[][];
  itemSet: any;
}

export function LALR1StatesView({ states, itemSet }: Props) {
  const [selectedState, setSelectedState] = useState<number>(0);
  
  if (!states || states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/60 border border-slate-700 rounded-lg px-4">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <p className="text-gray-300">No hay estados generados</p>
        <p className="text-blue-400 text-sm mt-2">Verifica la gramática</p>
      </div>
    );
  }
  
  const validStateIndex = selectedState < states.length ? selectedState : 0;
  
  return (
    <div className="space-y-4 text-gray-400">
      <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3 mb-4">
        <p className="text-sm text-orange-300 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span>
            LALR(1) combina estados LR(1) con el mismo núcleo. Total: <span className="font-bold">{states.length}</span> estados
          </span>
        </p>
      </div>
      
      <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-2 bg-slate-800 rounded-lg">
        {states.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedState(idx)}
            className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
              validStateIndex === idx
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600 hover:text-white'
            }`}
          >
            I{idx}
          </button>
        ))}
      </div>
      
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-orange-400 mb-3">Estado I{validStateIndex}</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {states[validStateIndex] && states[validStateIndex].length > 0 ? (
            states[validStateIndex].map((item, idx) => (
              <div key={idx} className="font-mono text-sm p-2 bg-slate-800 rounded border border-slate-700">
                {itemSet.itemToString(item)}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">Estado vacío</div>
          )}
        </div>
      </div>
    </div>
  );
}