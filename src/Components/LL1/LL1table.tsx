import type { LL1Table } from '../../Parsers/ll1.ts';
import { EPSILON } from '../../Grammars/types';

interface Props {
  table: LL1Table;
  terminals: string[];
  nonTerminals: string[];
}

export function LL1TableView({ table, terminals, nonTerminals }: Props) {
  const displayTerminals = [...terminals].filter(t => t !== '$');
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr className="bg-gradient-to-r from-slate-700/80 to-slate-800/80">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">NT \\ T</th>
            {displayTerminals.map(term => (
              <th key={term} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-100 border-b border-slate-700">
                {term}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nonTerminals.map(nt => (
            <tr key={nt} className="border-t border-slate-700/70 odd:bg-slate-900/60 even:bg-slate-900/30 hover:bg-slate-800/70 transition-colors">
              <td className="px-3 py-2 text-xs font-mono font-semibold text-yellow-300 bg-slate-900/70">{nt}</td>
              {displayTerminals.map(term => {
                const production = table[nt]?.[term];
                let display = '';
                if (production) {
                  if (production.length === 1 && production[0] === EPSILON) {
                    display = 'ε';
                  } else {
                    display = production.join(' ');
                  }
                } else {
                  display = '-';
                }
                
                return (
                  <td key={`${nt}-${term}`} className="px-3 py-2 text-xs font-mono text-slate-200">
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
  );
}