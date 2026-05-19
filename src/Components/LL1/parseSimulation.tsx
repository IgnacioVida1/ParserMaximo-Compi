import type { ParseStep } from '../../Parsers/ll1';
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Layers, RefreshCw, TextCursorInput, XCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface Props {
    steps: ParseStep[];
    accepted: boolean;
    error?: string;
}

export function LL1Simulation({ steps, accepted, error }: Props) {
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
            
            {/* Controles de simulación */}
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
            
            {/* Visualización del paso actual */}
            <div className="space-y-3">
                {/* Pila */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        Pila
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {step.stack.map((item, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-lg font-mono text-sm ${
                                item === '$' 
                                    ? 'bg-gray-700 text-gray-300' 
                                    : item.match(/[A-Z']/) 
                                        ? 'bg-yellow-500/20 text-yellow-300' 
                                        : 'bg-blue-500/20 text-blue-300'
                            }`}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                
                {/* Entrada restante */}
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
                
                {/* Acción */}
                <div className={`rounded-lg p-4 border ${
                    step.action.includes('Aceptar') 
                        ? 'bg-green-900/30 border-green-500' 
                        : step.action.includes('Error') 
                            ? 'bg-red-900/30 border-red-500'
                            : 'bg-purple-900/30 border-purple-500'
                }`}>
                    <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Acción
                    </div>
                    <div className="font-mono text-sm font-semibold">
                        {step.action}
                        {step.production && (
                            <span className="text-blue-400 ml-2">({step.production})</span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Tabla de todos los pasos (desplegable) */}
            <details className="mt-4" open>
                <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Ver historial completo ({totalSteps} pasos)
                </summary>
                <div className="mt-3 overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full bg-slate-900 rounded-lg overflow-hidden text-sm">
                        <thead className="sticky top-0 bg-slate-800">
                            <tr className="bg-gradient-to-r from-blue-600/40 to-purple-600/40">
                                <th className="px-3 py-2 text-left">Paso</th>
                                <th className="px-3 py-2 text-left">Pila</th>
                                <th className="px-3 py-2 text-left">Entrada</th>
                                <th className="px-3 py-2 text-left">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((s, idx) => (
                                <tr key={idx} className={`border-t border-slate-700 ${
                                    idx === currentStep ? 'bg-blue-900/30' : ''
                                }`}>
                                    <td className="px-3 py-2 font-mono text-gray-400">{s.step}</td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                        {s.stack.join(' ')}
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs text-cyan-300">
                                        {s.input}
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                        {s.action}
                                        {s.production && (
                                            <span className="text-blue-400 ml-1">({s.production})</span>
                                        )}
                                    </td>
                                /</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}