import type { LALR1ParseStep } from '../../Parsers/lalr1/lalr1';
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Layers, RefreshCw, TextCursorInput, Type, XCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface Props {
  steps: LALR1ParseStep[];
  accepted: boolean;
  error?: string;
}

export function LALR1Simulation({ steps, accepted, error }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  
  if (steps.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No hay pasos de simulación
      </div>
    );
  }
  
  const step = steps[currentStep];
  const totalSteps = steps.length;
  
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const resetSimulation = () => {
    setCurrentStep(0);
  };
  
  return (
    <div className="space-y-4 text-gray-400">
      {/* Resultado */}
      <div className={`p-4 rounded-xl border-2 ${
        accepted 
          ? 'bg-green-900/20 border-green-500' 
          : error 
            ? 'bg-red-900/20 border-red-500' 
            : 'bg-slate-700 border-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          {accepted ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : error ? (
            <XCircle className="w-6 h-6 text-red-400" />
          ) : null}
          <div>
            <h3 className="font-bold text-lg">
              {accepted ? '✅ Cadena ACEPTADA' : error ? '❌ Cadena RECHAZADA' : '⏳ Sin análisis'}
            </h3>
            {error && <p className="text-sm text-red-300 mt-1">{error}</p>}
          </div>
        </div>
      </div>
      
      {/* Controles */}
      <div className="flex items-center justify-between gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
        <div className="text-sm text-gray-300">
          Paso {currentStep + 1} de {totalSteps}
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetSimulation}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-white"
            title="Reiniciar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Estado actual */}
      <div className="space-y-3">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            Pila de estados
          </div>
          <div className="flex flex-wrap gap-2">
            {step.stack.map((state, idx) => (
              <span key={idx} className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-lg font-mono text-sm">
                {state}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
            <Type className="w-3.5 h-3.5" />
            Pila de símbolos
          </div>
          <div className="flex flex-wrap gap-2">
            {step.symbols.length > 0 ? (
              step.symbols.map((sym, idx) => (
                <span key={idx} className={`px-3 py-1 rounded-lg font-mono text-sm ${
                  sym.match(/[A-Z]/) ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  {sym}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">vacía</span>
            )}
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
            <TextCursorInput className="w-3.5 h-3.5" />
            Entrada restante
          </div>
          <div className="font-mono text-lg">
            {step.input.split(' ').map((token, idx) => (
              <span key={idx} className="inline-block px-2 py-1 mx-1 bg-slate-800 rounded">
                {token}
              </span>
            ))}
          </div>
        </div>
        
        <div className={`rounded-lg p-4 border ${
          step.action.includes('Aceptar') 
            ? 'bg-green-900/30 border-green-500' 
            : step.action.includes('Error') 
              ? 'bg-red-900/30 border-red-500'
              : 'bg-orange-900/30 border-orange-500'
        }`}>
          <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Acción
          </div>
          <div className="font-mono text-sm font-semibold">
            {step.action}
            {step.nextState !== undefined && (
              <span className="text-cyan-400 ml-2">→ Nuevo estado: {step.nextState}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabla de pasos */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-orange-400 hover:text-orange-300 inline-flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Ver todos los pasos ({totalSteps})
        </summary>
        <div className="mt-3 overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="min-w-full bg-slate-900 rounded-lg overflow-hidden text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-gradient-to-r from-orange-600/40 to-yellow-600/40">
                <th className="px-3 py-2 text-left">Paso</th>
                <th className="px-3 py-2 text-left">Pila</th>
                <th className="px-3 py-2 text-left">Símbolos</th>
                <th className="px-3 py-2 text-left">Entrada</th>
                <th className="px-3 py-2 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, idx) => (
                <tr key={idx} className={`border-t border-slate-700 ${
                  idx === currentStep ? 'bg-orange-900/30' : ''
                }`}>
                  <td className="px-3 py-2 font-mono text-gray-400">{s.step}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.stack.join(', ')}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.symbols.join(' ')}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.input}</td>
                  <td className="px-3 py-2 text-xs">{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}