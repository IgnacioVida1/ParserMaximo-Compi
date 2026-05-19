import { AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react';
export function ComparativePage() {

    
    return (
        <div className="bg-slate-800/60 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden shadow-xl text-gray-400">
            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-6 py-3 border-b border-slate-700">
                <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-300" />
                    Comparativa de Parsers
                </h3>
            </div>
            <div className="p-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left py-2 px-3">Parser</th>
                            <th className="text-left py-2 px-3">Lookahead</th>
                            <th className="text-left py-2 px-3">Poder</th>
                            <th className="text-left py-2 px-3">Tamaño Tabla</th>
                            <th className="text-left py-2 px-3">ε-producciones</th>
                            <th className="text-left py-2 px-3">Uso práctico</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-slate-700/50">
                            <td className="py-2 px-3 text-blue-400">LL(1)</td>
                            <td className="py-2 px-3">1</td>
                            <td className="py-2 px-3">Bajo</td>
                            <td className="py-2 px-3">Pequeña</td>
                            <td className="py-2 px-3 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3">Lenguajes simples</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                            <td className="py-2 px-3 text-purple-400">Recursive</td>
                            <td className="py-2 px-3">N/A</td>
                            <td className="py-2 px-3">Medio</td>
                            <td className="py-2 px-3">N/A</td>
                            <td className="py-2 px-3 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3">Educativo/Manual</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                            <td className="py-2 px-3 text-green-400">LR(0)</td>
                            <td className="py-2 px-3">0</td>
                            <td className="py-2 px-3">Muy bajo</td>
                            <td className="py-2 px-3">Mediana</td>
                            <td className="py-2 px-3 text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3">Solo educativo</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                            <td className="py-2 px-3 text-orange-400">SLR(1)</td>
                            <td className="py-2 px-3">1</td>
                            <td className="py-2 px-3">Medio</td>
                            <td className="py-2 px-3">Mediana</td>
                            <td className="py-2 px-3 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3">Compiladores simples</td>
                        </tr>
                        <tr className="border-b border-slate-700/50">
                            <td className="py-2 px-3 text-pink-400">LR(1)</td>
                            <td className="py-2 px-3">1</td>
                            <td className="py-2 px-3">Alto</td>
                            <td className="py-2 px-3">Grande</td>
                            <td className="py-2 px-3 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3">Teórico</td>
                        </tr>
                        <tr>
                            <td className="py-2 px-3 text-amber-400 font-semibold">LALR(1)</td>
                            <td className="py-2 px-3">1</td>
                            <td className="py-2 px-3">Alto</td>
                            <td className="py-2 px-3">Pequeña</td>
                            <td className="py-2 px-3 text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                            </td>
                            <td className="py-2 px-3 font-semibold">Yacc/Bison, Compiladores reales</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}