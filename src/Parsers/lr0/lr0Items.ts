import type { Grammar } from '../../Grammars/types';
import { EPSILON } from '../../Grammars/types';

export interface LR0Item {
    lhs: string;
    rhs: string[];
    dotPosition: number;
    productionIndex: number;
};

export class LR0ItemSet {
    private grammar: Grammar;
    private augmentedGrammar: Grammar;

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.augmentedGrammar = this.addAugmentedStart(grammar);
    }

    private addAugmentedStart(grammar: Grammar): Grammar {
        const newStart = `${grammar.start}'`;
        const newProduction = {
            lhs: newStart,
            rhs: [grammar.start]
        };

        const normalizedProductions = grammar.productions.map(prod => {
            if (prod.rhs.length === 1 && prod.rhs[0] === EPSILON) {
                return { ...prod, rhs: [] };
            }
            return { ...prod, rhs: [...prod.rhs] };
        });

        return {
            ...grammar,
            start: newStart,
            productions: [newProduction, ...normalizedProductions],
            nonTerminals: new Set([newStart, ...grammar.nonTerminals]),
        };
    };

    public getAugmentedGrammar(): Grammar {
        return this.augmentedGrammar;
    };

    public closure(items: LR0Item[]): LR0Item[] {
        let closure = [...items];
        let changed = true;

        while (changed){
            changed = false;

            for (const item of closure) {
                if (item.dotPosition < item.rhs.length) {
                    const nextSymbol = item.rhs[item.dotPosition];

                    if (this.augmentedGrammar.nonTerminals.has(nextSymbol)) {
                        const productions = this.augmentedGrammar.productions.filter(p => p.lhs === nextSymbol);

                        for (const prod of productions) {
                            const newItem: LR0Item = {
                                lhs: prod.lhs,
                                rhs: prod.rhs,
                                dotPosition: 0,
                                productionIndex: this.augmentedGrammar.productions.indexOf(prod)
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

        return closure;
    };

    public goto(items: LR0Item[], symbol: string): LR0Item[] | null {
        const nextItems: LR0Item[] = [];

        for (const item of items) {
            if (item.dotPosition < item.rhs.length && item.rhs[item.dotPosition] === symbol){
                const newItem: LR0Item = {
                    ...item,
                    dotPosition: item.dotPosition + 1
                };
                nextItems.push(newItem);
            }
        }

        if (nextItems.length === 0) { return null; };

        return this.closure(nextItems);
    };

    private itemExists(items: LR0Item[], item: LR0Item): boolean {
        return items.some(i => 
            i.lhs === item.lhs &&
            JSON.stringify(i.rhs) === JSON.stringify(item.rhs) &&
            i.dotPosition === item.dotPosition
        );
    }

    public itemToString(item: LR0Item): string {
        
        if (item.rhs.length === 0) {
            if (item.dotPosition === 0) {
                return `${item.lhs} → .`;
            } else {
                return `${item.lhs} → .`;
            }
        }

        const rhsWithDot = [
            ...item.rhs.slice(0, item.dotPosition),
            '.',
            ...item.rhs.slice(item.dotPosition)
        ];

        return `${item.lhs} → ${rhsWithDot.join(' ')}`;
    };

    public isReduceItem(item: LR0Item): boolean {
        if (item.rhs.length === 0) {
            return item.dotPosition === 0;
        }
        return item.dotPosition === item.rhs.length;
    }

    public getProductionFromItem(item: LR0Item) {
        const production = this.augmentedGrammar.productions[item.productionIndex];
        if (production.rhs.length === 0) {
            return { ...production, rhs: [EPSILON] };
        }
        return this.augmentedGrammar.productions[item.productionIndex];
    }
};