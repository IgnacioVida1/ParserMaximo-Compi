import type {Grammar} from './types';
import { EPSILON } from './types';

export function extractSymbols(grammar: Grammar): {
    terminals: Set<string>;
    nonTerminals: Set<string>;
} {
    const nonTerminals = new Set<string>();
    const terminals = new Set<string>();

    grammar.productions.forEach(prod => {
        nonTerminals.add(prod.lhs);
        prod.rhs.forEach(symbol => {
            if (!grammar.productions.some(p => p.lhs === symbol) && symbol !== EPSILON) {
                terminals.add(symbol);
            } else if (symbol !== EPSILON) {
                nonTerminals.add(symbol);
            }
        });
    });

    return { terminals, nonTerminals };
}

export function normalizeGrammar(grammar: Grammar): Grammar {
    const { terminals, nonTerminals } = extractSymbols(grammar);
    return {
        ...grammar,
        terminals,
        nonTerminals
    };
};