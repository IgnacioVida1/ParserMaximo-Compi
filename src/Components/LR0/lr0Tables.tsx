import type { LR0Action } from "../../Parsers/lr0/lr0";

interface Props {
    actionTable: Map<number, Map<string, LR0Action>>;
    gotoTable: Map<number, Map<string, number>>;
    terminals: string[];
    nonTerminals: string[];
    numStates: number;
};

export function LR0TablesView({ actionTable, gotoTable, terminals, nonTerminals, numStates }: Props) {
  const displayTerminals = [...terminals, '$'];
  
  if (numStates === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/60 border border-slate-700 rounded-lg px-4">
        <span className="text-6xl mb-4">⚠️</span>
        <p className="text-gray-300">No hay tablas generadas</p>
        <p className="text-blue-400 text-sm mt-2">Verifica que la gramática sea válida para LR(0)</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ACTION Table */}
      <div>
        <h3 className="text-lg font-semibold text-blue-400 mb-3">Tabla ACTION</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600/30 to-purple-600/30">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">Estado</th>
                {displayTerminals.map(term => (
                  <th key={term} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">{term}</th>
                ))}
               </tr>
            </thead>
            <tbody>
              {Array.from({ length: numStates }).map((_, state) => (
                <tr key={state} className="border-t border-slate-700/70 odd:bg-slate-900/60 even:bg-slate-900/30 hover:bg-slate-800/70 transition-colors">
                  <td className="px-3 py-2 text-xs font-mono font-semibold text-yellow-300 bg-slate-900/70">{state}</td>
                  {displayTerminals.map(term => {
                    const action = actionTable.get(state)?.get(term);
                    let display = '';
                    if (action) {
                      if (action.type === 'shift') display = `s${action.value}`;
                      else if (action.type === 'reduce') display = `r${action.value}`;
                      else if (action.type === 'accept') display = 'acc';
                    } else {
                      display = '-';
                    }
                    return (
                      <td key={`${state}-${term}`} className="px-3 py-2 text-xs font-mono text-slate-200">
                        {display !== '-' ? (
                          <span className="text-green-400">{display}</span>
                        ) : (
                          <span className="text-gray-400">{display}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* GOTO Table */}
      <div>
        <h3 className="text-lg font-semibold text-green-400 mb-3">Tabla GOTO</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-green-600/30 to-teal-600/30">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">Estado</th>
                {nonTerminals.map(nt => (
                  <th key={nt} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">{nt}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numStates }).map((_, state) => (
                <tr key={state} className="border-t border-slate-700/70 odd:bg-slate-900/60 even:bg-slate-900/30 hover:bg-slate-800/70 transition-colors">
                  <td className="px-3 py-2 text-xs font-mono font-semibold text-yellow-300 bg-slate-900/70">{state}</td>
                  {nonTerminals.map(nt => {
                    const goto = gotoTable.get(state)?.get(nt);
                    return (
                      <td key={`${state}-${nt}`} className="px-3 py-2 text-xs font-mono text-slate-200">
                        {goto !== undefined ? (
                          <span className="text-purple-400">{goto}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};