import { useState } from 'react';
import { BarChart3, Coins, Flame, RefreshCcw, Scale, Target, Zap } from 'lucide-react';
import { LL1Page } from './Pages/ll1Page'
import { RecursivePage } from './Pages/recursivePage';
import { LR0Page } from './Pages/lr0Page';
import { SLR1Page } from './Pages/slr1Page';
import { LR1Page } from './Pages/lr1Page';
import { LALR1Page } from './Pages/lalr1Page';
import { ComparativePage } from './Pages/comparative';
import { Header } from './Components/Common/header';

import { HistoryModal } from './Components/Common/historyModal';

type ParserType = 'll1' | 'recursive' | 'lr0' | 'slr1' | 'lr1' | 'lalr1' | 'com';

function App() {
  const [selectedParser, setSelectedParser] = useState<ParserType>('lalr1');
  
  const handleHistoryLoad = (grammar: string, inputString: string) => {
    // Disparar evento para que la página actual cargue
    window.dispatchEvent(new CustomEvent('loadFromHistory', { 
        detail: { grammar, inputString }
    }));
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        <Header 
          title="Ultimate Parser App"
          subtitle="Análisis sintáctico - LL(1), Recursive Descent, LR(0), SLR(1), LR(1) y LALR(1)"
        />

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <button onClick={() => setSelectedParser('ll1')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'll1' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              LL(1)
            </span>
          </button>
          <button onClick={() => setSelectedParser('recursive')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'recursive' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Recursive
            </span>
          </button>
          <button onClick={() => setSelectedParser('lr0')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'lr0' ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <Zap className="w-4 h-4" />
              LR(0)
            </span>
          </button>
          <button onClick={() => setSelectedParser('slr1')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'slr1' ? 'bg-orange-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <Target className="w-4 h-4" />
              SLR(1)
            </span>
          </button>
          <button onClick={() => setSelectedParser('lr1')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'lr1' ? 'bg-pink-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <Flame className="w-4 h-4" />
              LR(1)
            </span>
          </button>
          <button onClick={() => setSelectedParser('lalr1')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'lalr1' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <Coins className="w-4 h-4" />
              LALR(1)
            </span>
          </button>
          <button onClick={() => setSelectedParser('com')} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-white ${selectedParser === 'com' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
            <span className="inline-flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Comparacion
            </span>
          </button>
        </div>

        {selectedParser === 'll1' && <LL1Page />}
        {selectedParser === 'recursive' && <RecursivePage />}
        {selectedParser === 'lr0' && <LR0Page />}
        {selectedParser === 'slr1' && <SLR1Page />}
        {selectedParser === 'lr1' && <LR1Page />}
        {selectedParser === 'lalr1' && <LALR1Page />}
        {selectedParser === 'com' && <ComparativePage />}
      </div>

      <HistoryModal onLoad={handleHistoryLoad} currentParser={selectedParser} />
    </div>
  );
}

export default App;