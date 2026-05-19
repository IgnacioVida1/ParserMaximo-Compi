import { useEffect, useRef, useState } from 'react';
import { TreePine } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { ParseStep } from '../../Parsers/ll1';
import { EPSILON } from '../../Grammars/types';

type TreeNode = {
    id: string;
    label: string;
    children: TreeNode[];
};

interface Props {
    steps: ParseStep[];
    startSymbol: string;
    terminals?: Set<string>;
}

const buildParseTree = (steps: ParseStep[], startSymbol: string): TreeNode => {
    let nodeId = 0;
    const createNode = (label: string): TreeNode => ({
        id: `n${nodeId++}`,
        label,
        children: []
    });

    const root = createNode(startSymbol);
    const nodeStack: TreeNode[] = [root];

    for (const step of steps) {
        if (step.production) {
            const parts = step.production.split('->').length > 1
                ? step.production.split('->')
                : step.production.split('→');
            const lhs = (parts[0] || '').trim();
            const rhsRaw = (parts[1] || '').trim();

            let rhsSymbols: string[] = [];
            if (rhsRaw && rhsRaw !== EPSILON) {
                rhsSymbols = rhsRaw.split(/\s+/).filter(Boolean);
            } else if (rhsRaw === EPSILON) {
                rhsSymbols = [EPSILON];
            }

            let current = nodeStack.pop();
            while (current && current.label !== lhs && nodeStack.length > 0) {
                current = nodeStack.pop();
            }

            if (!current || current.label !== lhs) {
                continue;
            }

            if (rhsSymbols.length === 0) {
                continue;
            }

            const children: TreeNode[] = rhsSymbols.map((symbol) => {
                const label = symbol === EPSILON ? 'eps' : symbol;
                return createNode(label);
            });

            current.children.push(...children);

            for (let i = children.length - 1; i >= 0; i--) {
                if (children[i].label !== 'eps') {
                    nodeStack.push(children[i]);
                }
            }
        } else if (step.action.startsWith('Match:')) {
            const matched = step.action.replace('Match:', '').trim();
            if (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].label === matched) {
                nodeStack.pop();
            }
        }
    }

    return root;
};

const escapeLabel = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '\\n');
};

const buildDot = (root: TreeNode, terminals?: Set<string>): string => {
    const nodes: string[] = [];
    const edges: string[] = [];

    const stack: TreeNode[] = [root];
    while (stack.length > 0) {
        const node = stack.pop();
        if (!node) continue;

        const label = escapeLabel(node.label);
        const isEps = node.label === 'eps';
        const isTerminal = terminals?.has(node.label) ?? false;
        const fillcolor = isEps ? '#1f2937' : (isTerminal ? '#0b3a2d' : '#0f172a');
        const fontcolor = isEps ? '#cbd5f5' : (isTerminal ? '#86efac' : '#e2e8f0');
        const border = isTerminal ? '#34d399' : '#94a3b8';

        nodes.push(`  ${node.id} [label="${label}", shape=box, style="rounded,filled", color="${border}", fillcolor="${fillcolor}", fontcolor="${fontcolor}"];`);

        for (const child of node.children) {
            edges.push(`  ${node.id} -> ${child.id} [color="#94a3b8"];`);
            stack.push(child);
        }
    }

    return [
        'digraph ParseTree {',
        '  rankdir=TB;',
        '  node [fontname="Courier New", fontsize=12];',
        '  edge [fontname="Courier New", fontsize=11];',
        '  bgcolor="transparent";',
        ...nodes,
        ...edges,
        '}'
    ].join('\n');
};

export function LL1ParseTreeView({ steps, startSymbol, terminals }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!containerRef.current || steps.length === 0) return;
        renderGraph();
    }, [steps, startSymbol]);

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

    const applyTransform = (svgElement: SVGSVGElement) => {
        svgElement.style.transformOrigin = '0 0';
        svgElement.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
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

    const renderGraph = async () => {
        const { Graphviz } = await import('@hpcc-js/wasm');
        const graphviz = await Graphviz.load();

        const tree = buildParseTree(steps, startSymbol);
        const dot = buildDot(tree, terminals);
        const svg = await graphviz.layout(dot, 'svg', 'dot');

        if (containerRef.current) {
            containerRef.current.innerHTML = svg;
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

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        setIsDragging(true);
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        panStartRef.current = { ...pan };
    };

    if (steps.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                No hay pasos para construir el arbol
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <TreePine className="w-4 h-4" /> Arbol de parseo LL(1)
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <button
                        onClick={() => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200"
                        title="Reducir"
                    >
                        -
                    </button>
                    <button
                        onClick={fitToView}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200"
                        title="Ajustar a vista"
                    >
                        Ajustar
                    </button>
                    <button
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200"
                        title="Reset"
                    >
                        100%
                    </button>
                    <button
                        onClick={() => setZoom((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-200"
                        title="Aumentar"
                    >
                        +
                    </button>
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
