import type { Grammar } from '../../Grammars/types';
import { EPSILON } from '../../Grammars/types';

export interface LALR1Item {
    lhs: string;           
    rhs: string[];         
    dotPosition: number;   
    lookaheads: Set<string>;
    productionIndex: number;
}

export class LALR1ItemSet {
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

        // NORMALIZAR ε-producciones: convertir ['ε'] a []
        const normalizedProductions = grammar.productions.map(prod => {
            if (prod.rhs.length === 1 && prod.rhs[0] === EPSILON) {
                return { lhs: prod.lhs, rhs: [] };
            }
            return { lhs: prod.lhs, rhs: [...prod.rhs] };
        });

        const allProductions = [newProduction, ...normalizedProductions];
        
        // RECONSTRUIR terminales y no terminales desde cero
        const nonTerminals = new Set<string>();
        const terminals = new Set<string>();
        
        // Agregar el nuevo start
        nonTerminals.add(newStart);
        
        // Agregar todos los lhs de producciones como no terminales
        allProductions.forEach(prod => {
            nonTerminals.add(prod.lhs);
        });
        
        // Agregar símbolos de rhs como terminales o no terminales
        allProductions.forEach(prod => {
            prod.rhs.forEach(symbol => {
                if (!nonTerminals.has(symbol) && symbol !== EPSILON) {
                    terminals.add(symbol);
                }
            });
        });
        
        // Agregar $ como terminal especial
        terminals.add('$');

        return {
            ...grammar,
            start: newStart,
            productions: allProductions,
            terminals: terminals,
            nonTerminals: nonTerminals,
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
                    if (!lhsFirst.has(EPSILON)) {
                        lhsFirst.add(EPSILON);
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
        
        console.log('FIRST sets LALR(1):', Array.from(this.firstCache.entries()).map(([k, v]) => `${k}: {${Array.from(v).join(', ')}}`));
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

    public closure(items: LALR1Item[]): LALR1Item[] {
        let closure = [...items];
        let changed = true;
        
        while (changed) {
            changed = false;
            
            for (const item of closure) {
                if (item.dotPosition < item.rhs.length) {
                    const nextSymbol = item.rhs[item.dotPosition];
                    
                    if (this.augmentedGrammar.nonTerminals.has(nextSymbol)) {
                        const productions = this.augmentedGrammar.productions.filter(p => p.lhs === nextSymbol);
                        
                        const beta = item.rhs.slice(item.dotPosition + 1);
                        const firstBeta = this.firstOfString(beta);
                        
                        for (const prod of productions) {
                            const newLookaheads = new Set<string>();
                            
                            if (firstBeta.has(EPSILON)) {
                                item.lookaheads.forEach(l => newLookaheads.add(l));
                                firstBeta.forEach(l => {
                                    if (l !== EPSILON) newLookaheads.add(l);
                                });
                            } else {
                                firstBeta.forEach(l => newLookaheads.add(l));
                            }
                            
                            if (newLookaheads.size > 0) {
                                const existingItem = closure.find(i => 
                                    i.lhs === prod.lhs &&
                                    JSON.stringify(i.rhs) === JSON.stringify(prod.rhs) &&
                                    i.dotPosition === 0
                                );
                                
                                if (existingItem) {
                                    const prevSize = existingItem.lookaheads.size;
                                    newLookaheads.forEach(l => existingItem.lookaheads.add(l));
                                    if (existingItem.lookaheads.size !== prevSize) {
                                        changed = true;
                                    }
                                } else {
                                    const newItem: LALR1Item = {
                                        lhs: prod.lhs,
                                        rhs: [...prod.rhs],
                                        dotPosition: 0,
                                        lookaheads: newLookaheads,
                                        productionIndex: this.augmentedGrammar.productions.findIndex(p => p === prod)
                                    };
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

    public goto(items: LALR1Item[], symbol: string): LALR1Item[] | null {
        const nextItems: LALR1Item[] = [];
        
        for (const item of items) {
            if (item.dotPosition < item.rhs.length && item.rhs[item.dotPosition] === symbol) {
                const existingItem = nextItems.find(i => 
                    i.lhs === item.lhs &&
                    JSON.stringify(i.rhs) === JSON.stringify(item.rhs) &&
                    i.dotPosition === item.dotPosition + 1
                );
                
                if (existingItem) {
                    item.lookaheads.forEach(l => existingItem.lookaheads.add(l));
                } else {
                    const newItem: LALR1Item = {
                        ...item,
                        dotPosition: item.dotPosition + 1,
                        lookaheads: new Set(item.lookaheads)
                    };
                    nextItems.push(newItem);
                }
            }
        }
        
        if (nextItems.length === 0) return null;
        return this.closure(nextItems);
    }

    public itemToString(item: LALR1Item): string {
        const lookaheadStr = Array.from(item.lookaheads).join('/');
        
        if (item.rhs.length === 0) {
            return `${item.lhs} → •, ${lookaheadStr}`;
        }
        
        const rhsWithDot = [
            ...item.rhs.slice(0, item.dotPosition),
            '•',
            ...item.rhs.slice(item.dotPosition)
        ];
        return `${item.lhs} → ${rhsWithDot.join(' ')}, ${lookaheadStr}`;
    }

    public isReduceItem(item: LALR1Item): boolean {
        if (item.rhs.length === 0) {
            return item.dotPosition === 0;
        }
        return item.dotPosition === item.rhs.length;
    }

    public getProductionFromItem(item: LALR1Item) {
        const production = this.augmentedGrammar.productions[item.productionIndex];
        if (production.rhs.length === 0) {
            return { ...production, rhs: [EPSILON] };
        }
        return production;
    }

    public getAugmentedGrammar(): Grammar {
        return this.augmentedGrammar;
    }
}