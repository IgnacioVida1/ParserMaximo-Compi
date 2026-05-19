import type { ReactNode } from 'react';

interface Tab<T extends string = string> {
  id: T;
  label: string;
  disabled: boolean;
}

interface ResultPanelProps<T extends string = string> {
  activeTab: T;
  onTabChange: (tab: T) => void;
  tabs: Tab<T>[];
  children: ReactNode;
}

export function ResultPanel<T extends string = string>({ activeTab, onTabChange, tabs, children }: ResultPanelProps<T>) {
  return (
    <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      <div className="border-b border-slate-700">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-white/70 hover:text-white'
              } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={tab.disabled}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-h-[600px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}