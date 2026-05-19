import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { MouseEvent } from 'react';

interface LRAutomatonViewProps {
    states: any[][]; // Array de estados (items)
    transitions: Map<string, Map<string, number>>; // Transiciones entre estados
    title?: string;
    type?: 'lr0' | 'slr1' | 'lr1' | 'lalr1';
    currentState?: number;
    highlightPath?: number[];
}

export function LRAutomatonView({ 
    states, 
    transitions, 
    title = "Autómata LR", 
    type = 'lr0',
    currentState,
    highlightPath 
}: LRAutomatonViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current || states.length === 0) return;
        
        renderGraph();
    }, [states, transitions, currentState, highlightPath]);

    useEffect(() => {
        if (!containerRef.current) return;
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return;
        applyTransform(svgElement);
    }, [zoom, pan]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (event: MouseEvent) => {
            const dx = event.clientX - dragStartRef.current.x;
            const dy = event.clientY - dragStartRef.current.y;
            setPan({
                x: panStartRef.current.x + dx,
                y: panStartRef.current.y + dy
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const renderGraph = async () => {
        // Cargar Graphviz dinámicamente
        const { Graphviz } = await import('@hpcc-js/wasm');
        const graphviz = await Graphviz.load();
        
        const dot = generateDot();
        const svg = await graphviz.layout(dot, 'svg', 'dot');
        
        if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            
            // Aplicar estilos al SVG
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
                svgElement.style.width = '100%';
                svgElement.style.height = 'auto';
                svgElement.style.maxHeight = '820px';
                svgElement.style.background = 'transparent';
                applyTransform(svgElement);
            }

            fitToView();
        }
    };

    const applyTransform = (svgElement: SVGSVGElement) => {
        svgElement.style.transformOrigin = '0 0';
        svgElement.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    };

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        setIsDragging(true);
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        panStartRef.current = { ...pan };
    };

    const fitToView = () => {
        if (!containerRef.current) return;
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return;

        const bbox = svgElement.getBBox();
        if (bbox.width === 0 || bbox.height === 0) return;

        const padding = 24;
        const containerWidth = containerRef.current.clientWidth - padding * 2;
        const containerHeight = containerRef.current.clientHeight - padding * 2;

        if (containerWidth <= 0 || containerHeight <= 0) return;

        const scale = Math.min(containerWidth / bbox.width, containerHeight / bbox.height);
        const nextZoom = Math.max(0.4, Math.min(2, Number(scale.toFixed(2))));
        const offsetX = padding + (containerWidth - bbox.width * nextZoom) / 2 - bbox.x * nextZoom;
        const offsetY = padding + (containerHeight - bbox.height * nextZoom) / 2 - bbox.y * nextZoom;

        setZoom(nextZoom);
        setPan({ x: offsetX, y: offsetY });
    };

    const formatItemLabel = (item: any): string => {
        if (!item || typeof item !== 'object' || !('lhs' in item)) {
            return String(item);
        }

        const lhs = String(item.lhs);
        const rhs = Array.isArray(item.rhs) ? item.rhs.map(String) : [];
        const dotPosition = typeof item.dotPosition === 'number' ? item.dotPosition : rhs.length;

        let rhsWithDot: string[] = [];
        if (rhs.length === 0) {
            rhsWithDot = ['•'];
        } else {
            rhsWithDot = [
                ...rhs.slice(0, dotPosition),
                '•',
                ...rhs.slice(dotPosition)
            ];
        }

        let suffix = '';
        if (typeof item.lookahead === 'string') {
            suffix = `, ${item.lookahead}`;
        } else if (item.lookaheads instanceof Set) {
            suffix = `, ${Array.from(item.lookaheads).join('/')}`;
        }

        return `${lhs} → ${rhsWithDot.join(' ')}${suffix}`;
    };

    const generateDot = (): string => {
        const useHorizontal = states.length >= 14;
        let dot = `digraph LR_Automaton {\n`;
        dot += `  rankdir=${useHorizontal ? 'LR' : 'TD'};\n`;
        dot += `  node [shape=circle, fontname="Courier New", fontsize=12, color="#94a3b8", fontcolor="#e2e8f0"];\n`;
        dot += `  edge [fontname="Courier New", fontsize=11, color="#94a3b8", fontcolor="#cbd5f5"];\n`;
        dot += `  bgcolor="transparent";\n\n`;
        
        // Estados
        for (let i = 0; i < states.length; i++) {
            const stateItems = states[i];
            const isCurrent = currentState === i;
            const isHighlighted = highlightPath?.includes(i);
            
            // Crear label con los items
            const itemsLabel = stateItems.map((item) => escapeHtml(formatItemLabel(item))).join('\\n');
            
            const shape = isCurrent ? 'doublecircle' : 'circle';
            const color = isCurrent ? '#38bdf8' : (isHighlighted ? '#f59e0b' : '#94a3b8');
            const style = isCurrent ? 'filled' : (isHighlighted ? 'filled' : '');
            const fillcolor = isCurrent ? '#0ea5e933' : (isHighlighted ? '#f59e0b33' : 'transparent');
            const penwidth = isCurrent ? '2' : (isHighlighted ? '1.5' : '1');
            
            dot += `  I${i} [label="I${i}\\n${itemsLabel}", shape=${shape}, color="${color}", style="${style}", fillcolor="${fillcolor}", penwidth=${penwidth}];\n`;
        }
        
        dot += `\n`;
        
        // Transiciones
        for (const [fromState, symbolMap] of transitions.entries()) {
            for (const [symbol, toState] of symbolMap.entries()) {
                const isHighlighted = highlightPath?.includes(parseInt(fromState)) && 
                                     highlightPath?.includes(toState);
                const color = isHighlighted ? '#f59e0b' : '#94a3b8';
                const penwidth = isHighlighted ? '2' : '1';
                
                dot += `  I${fromState} -> I${toState} [label="${escapeHtml(symbol)}", color="${color}", penwidth=${penwidth}];\n`;
            }
        }
        
        dot += `}\n`;
        return dot;
    };

    const escapeHtml = (text: string): string => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '\\n');
    };

    return (
        <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Search className="w-4 h-4" /> {title}
                    <span className="text-xs text-gray-500">({states.length} estados, {Array.from(transitions.values()).reduce((a,b) => a + b.size, 0)} transiciones)</span>
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <button
                        onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                        title="Reducir"
                    >
                        -
                    </button>
                    <button
                        onClick={fitToView}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                        title="Ajustar a vista"
                    >
                        Ajustar
                    </button>
                    <button
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                        title="Reset"
                    >
                        100%
                    </button>
                    <button
                        onClick={() => setZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                        title="Aumentar"
                    >
                        +
                    </button>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">● Estado actual</span>
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">● Ruta</span>
                </div>
            </div>
            <div 
                ref={containerRef} 
                className={`graphviz-svg overflow-x-auto overflow-y-auto bg-slate-950/60 rounded-lg p-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ minHeight: '520px', maxHeight: '900px' }}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
}