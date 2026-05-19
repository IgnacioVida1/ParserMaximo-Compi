import type { Grammar } from '../../Grammars/types';
import { EPSILON } from '../../Grammars/types';

export interface LR1Item {
    lhs: string;           // Parte izquierda
    rhs: string[];         // Parte derecha
    dotPosition: number;   // Posición del punto
    lookahead: string;     // Símbolo lookahead
    productionIndex: number; // Índice de producción
}

export class LR1ItemSet {
    private grammar: Grammar;
    private augmentedGrammar: Grammar;
    private firstCache: Map<string, Set<string>> = new Map();

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.augmentedGrammar = this.addAugmentedStart(grammar);
        this.computeFirstForGrammar();
    }

    private addAugmentedStart(grammar: Grammar): Grammar {
        const newStart = `${grammar.start}'`;
        const newProduction = {
            lhs: newStart,
            rhs: [grammar.start]
        };

        const normalizedProductions = grammar.productions.map(prod => {
            if (prod.rhs.length === 1 && prod.rhs[0] === EPSILON) {
                return { lhs: prod.lhs, rhs: [] };
            }
            return { lhs: prod.lhs, rhs: [...prod.rhs] };
        });

        const allProductions = [newProduction, ...normalizedProductions];

        const nonTerminals = new Set<string>();
        const terminals = new Set<string>();

        nonTerminals.add(newStart);

        allProductions.forEach(prod => {
            nonTerminals.add(prod.lhs);
        });

        allProductions.forEach(prod => {
            prod.rhs.forEach(symbol => {
                if (!nonTerminals.has(symbol) && symbol !== EPSILON) {
                    terminals.add(symbol);
                }
            });
        });

        terminals.add('$');

        return {
            ...grammar,
            start: newStart,
            productions: allProductions,
            terminals: terminals,
            nonTerminals: new Set([newStart, ...grammar.nonTerminals]),
        };
    }

    private computeFirstForGrammar(): void {
        // Inicializar FIRST para terminales
        this.augmentedGrammar.terminals.forEach(term => {
            this.firstCache.set(term, new Set([term]));
        });
        
        // Inicializar FIRST para no terminales
        this.augmentedGrammar.nonTerminals.forEach(nt => {
            this.firstCache.set(nt, new Set());
        });
        
        let changed = true;
        while (changed) {
            changed = false;
            
            for (const production of this.augmentedGrammar.productions) {
                const lhs = production.lhs;
                const rhs = production.rhs;
                const lhsFirst = this.firstCache.get(lhs)!;
                const previousSize = lhsFirst.size;

                if (rhs.length === 0) {
                    // Producción ε
                    lhsFirst.add(EPSILON);
                    if (lhsFirst.size !== previousSize) {
                        changed = true;
                    }
                    continue;
                }

                let allHaveEpsilon = true;

                for (const symbol of rhs) {
                    const symbolFirst = this.firstCache.get(symbol);
                    if (symbolFirst) {
                        symbolFirst.forEach(s => {
                            if (s !== EPSILON && !lhsFirst.has(s)) {
                                lhsFirst.add(s);
                                changed = true;
                            }
                        });
                        if (!symbolFirst.has(EPSILON)) {
                            allHaveEpsilon = false;
                            break;
                        }
                    } else {
                        allHaveEpsilon = false;
                        break;
                    }
                }
                
                if (allHaveEpsilon && !lhsFirst.has(EPSILON)) {
                    lhsFirst.add(EPSILON);
                    changed = true;
                }
            }
        }
    }

    public firstOfString(symbols: string[]): Set<string> {
        const result = new Set<string>();
        
        if (symbols.length === 0) {
            result.add(EPSILON);
            return result;
        }

        let allHaveEpsilon = true;
        
        for (const symbol of symbols) {
            const firstSet = this.firstCache.get(symbol);
            if (firstSet) {
                firstSet.forEach(s => {
                    if (s !== EPSILON) result.add(s);
                });
                if (!firstSet.has(EPSILON)) {
                    allHaveEpsilon = false;
                    break;
                }
            } else {
                allHaveEpsilon = false;
                break;
            }
        }
        
        if (allHaveEpsilon) {
            result.add(EPSILON);
        }
        
        return result;
    }

    public closure(items: LR1Item[]): LR1Item[] {
        let closure = [...items];
        let changed = true;
        
        while (changed) {
            changed = false;
            
            for (const item of closure) {
                // Si el punto no está al final
                if (item.dotPosition < item.rhs.length) {
                    const nextSymbol = item.rhs[item.dotPosition];
                    
                    // Si es no terminal, agregar sus producciones
                    if (this.augmentedGrammar.nonTerminals.has(nextSymbol)) {
                        const productions = this.augmentedGrammar.productions.filter(p => p.lhs === nextSymbol);
                        
                        // Calcular lookaheads para los nuevos items
                        const beta = item.rhs.slice(item.dotPosition + 1);
                        const firstBeta = this.firstOfString(beta);
                        
                        // Para cada producción del no terminal
                        for (const prod of productions) {
                            // Para cada lookahead posible
                            const lookaheads = new Set<string>();
                            
                            if (firstBeta.has(EPSILON)) {
                                // Si β puede ser ε, agregar el lookahead original
                                lookaheads.add(item.lookahead);
                                firstBeta.forEach(l => {
                                    if (l !== EPSILON) lookaheads.add(l);
                                });
                            } else {
                                firstBeta.forEach(l => lookaheads.add(l));
                            }
                            
                            // Crear un item por cada lookahead
                            for (const lookahead of lookaheads) {
                                const newItem: LR1Item = {
                                    lhs: prod.lhs,
                                    rhs: [...prod.rhs],
                                    dotPosition: 0,
                                    lookahead: lookahead,
                                    productionIndex: this.augmentedGrammar.productions.findIndex(p => p === prod)
                                };
                                
                                if (!this.itemExists(closure, newItem)) {
                                    closure.push(newItem);
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return closure;
    }

    public goto(items: LR1Item[], symbol: string): LR1Item[] | null {
        const nextItems: LR1Item[] = [];
        
        for (const item of items) {
            if (item.dotPosition < item.rhs.length && item.rhs[item.dotPosition] === symbol) {
                const newItem: LR1Item = {
                    ...item,
                    dotPosition: item.dotPosition + 1
                };
                nextItems.push(newItem);
            }
        }
        
        if (nextItems.length === 0) return null;
        return this.closure(nextItems);
    }

    private itemExists(items: LR1Item[], item: LR1Item): boolean {
        return items.some(i => 
            i.lhs === item.lhs &&
            JSON.stringify(i.rhs) === JSON.stringify(item.rhs) &&
            i.dotPosition === item.dotPosition &&
            i.lookahead === item.lookahead
        );
    }

    public itemToString(item: LR1Item): string {
        if (item.rhs.length === 0 || (item.rhs.length === 1 && item.rhs[0] === EPSILON)) {
            return `${item.lhs} → •, ${item.lookahead}`;
        }
        
        const rhsWithDot = [
            ...item.rhs.slice(0, item.dotPosition),
            '•',
            ...item.rhs.slice(item.dotPosition)
        ];
        return `${item.lhs} → ${rhsWithDot.join(' ')}, ${item.lookahead}`;
    }

    public isReduceItem(item: LR1Item): boolean {
        if (item.rhs.length === 0 || (item.rhs.length === 1 && item.rhs[0] === EPSILON)) {
            return item.dotPosition === 0;
        }
        return item.dotPosition === item.rhs.length;
    }

    public getProductionFromItem(item: LR1Item) {
        return this.augmentedGrammar.productions[item.productionIndex];
    }

    public getAugmentedGrammar(): Grammar {
        return this.augmentedGrammar;
    }
}