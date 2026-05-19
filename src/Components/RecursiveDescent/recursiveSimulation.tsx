import type { RecursiveStep } from '../../Parsers/recursiveDescent';
import { CheckCircle, ChevronLeft, ChevronRight, ClipboardList, RefreshCw, TextCursorInput, Wrench, XCircle, Zap } from 'lucide-react';
import { useState } from 'react';

interface Props {
    steps: RecursiveStep[];
    accepted: boolean;
    error?: string;
}

export function RecursiveSimulation({ steps, accepted, error }: Props) {
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
            
            {/* Paso actual */}
            <div className="space-y-3">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5" />
                        Función / No Terminal
                    </div>
                    <div className="font-mono text-lg font-bold text-purple-400">
                        {step.function}
                    </div>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                        <TextCursorInput className="w-3.5 h-3.5" />
                        Entrada restante
                    </div>
                    <div className="font-mono text-base break-all">
                        {step.input || '(vacío)'}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                        Posición del cursor: {step.position}
                    </div>
                </div>
                
                {step.production && (
                    <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/50">
                        <div className="text-xs text-blue-300 mb-1 flex items-center gap-2">
                            <ClipboardList className="w-3.5 h-3.5" />
                            Producción intentada
                        </div>
                        <div className="font-mono text-sm">
                            {step.production}
                        </div>
                    </div>
                )}
                
                <div className={`rounded-lg p-4 border ${
                    step.success 
                        ? 'bg-green-900/30 border-green-500' 
                        : 'bg-red-900/30 border-red-500'
                }`}>
                    <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        Acción
                    </div>
                    <div className={`font-mono text-sm ${step.success ? 'text-green-300' : 'text-red-300'}`}>
                        {step.action}
                    </div>
                </div>
            </div>
            
            {/* Tabla de todos los pasos */}
            <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Ver historial completo ({totalSteps} pasos)
                </summary>
                <div className="mt-3 overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="min-w-full bg-slate-900 rounded-lg overflow-hidden text-sm">
                        <thead className="sticky top-0 bg-slate-800">
                            <tr className="bg-gradient-to-r from-blue-600/40 to-purple-600/40">
                                <th className="px-3 py-2 text-left">Paso</th>
                                <th className="px-3 py-2 text-left">Función</th>
                                <th className="px-3 py-2 text-left">Entrada</th>
                                <th className="px-3 py-2 text-left">Acción</th>
                                <th className="px-3 py-2 text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map((s, idx) => (
                                <tr key={idx} className={`border-t border-slate-700 ${
                                    idx === currentStep ? 'bg-blue-900/30' : ''
                                }`}>
                                    <td className="px-3 py-2 font-mono text-gray-400">{s.step}</td>
                                    <td className="px-3 py-2 font-mono text-purple-300">{s.function}</td>
                                    <td className="px-3 py-2 font-mono text-xs text-cyan-300">{s.input || '(vacío)'}</td>
                                    <td className="px-3 py-2 text-xs">{s.action}</td>
                                    <td className="px-3 py-2">
                                        {s.success ? (
                                            <span className="text-green-400">✓</span>
                                        ) : (
                                            <span className="text-red-400">✗</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}