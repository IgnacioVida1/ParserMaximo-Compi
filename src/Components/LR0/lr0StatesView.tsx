import type { LR0Item } from "../../Parsers/lr0/lr0Items";
import { useState } from "react";

interface Props {
    states: LR0Item[][];
    itemSet: any;
};

export function LR0StatesView({ states, itemSet }: Props) {
  const [selectedState, setSelectedState] = useState<number>(0);

  if (!states || states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/60 border border-slate-700 rounded-lg px-4">
        <span className="text-6xl mb-4">⚠️</span>
        <p className="text-gray-300">No hay estados generados</p>
        <p className="text-blue-400 text-sm mt-2">Verifica la gramática</p>
      </div>
    );
  }

  const validStateIndex = selectedState < states.length ? selectedState : 0;

  return (
    <div className="space-y-4 text-gray-400">
      <div className="flex gap-2 flex-wrap">
        {states.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedState(idx)}
            className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
              validStateIndex === idx
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600 hover:text-white'
            }`}
          >
            I{idx}
          </button>
        ))}
      </div>
      
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">Estado I{validStateIndex}</h3>
        <div className="space-y-2">
          {states[validStateIndex] && states[validStateIndex].length > 0 ? (
            states[validStateIndex].map((item, idx) => (
              <div key={idx} className="font-mono text-sm p-2 bg-slate-800 rounded">
                {itemSet && itemSet.itemToString ? itemSet.itemToString(item) : `${item.lhs} → ${item.rhs.join(' ')} •`}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">Estado vacío</div>
          )}
        </div>
      </div>
    </div>
  );
};