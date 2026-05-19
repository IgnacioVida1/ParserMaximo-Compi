import { EPSILON } from './types.ts'
import type { Grammar } from './types.ts';

export function computeFirst(grammar: Grammar): Map<string, Set<string>> {
    const first = new Map<string, Set<string>>();

    grammar.nonTerminals.forEach(nt => {
        first.set(nt, new Set());
    });

    let changed = true;

    while (changed) {
        changed = false;

        for (const production of grammar.productions) {
            const lhs = production.lhs;
            const rhs = production.rhs;
            const lhsFirst = first.get(lhs)!;

            let haveEpsilon = true;

            for (const symbol of rhs) {
                if (grammar.terminals.has(symbol)) {
                    if (!lhsFirst.has(symbol)) {
                        lhsFirst.add(symbol);
                        changed = true;
                    }
                    haveEpsilon = false;
                    break;
                } else if (grammar.nonTerminals.has(symbol)) {
                    const symbolFirst = first.get(symbol)!;
                    const prevSize = lhsFirst.size;

                    symbolFirst.forEach(s => {
                        if (s !== EPSILON) {
                            lhsFirst.add(s);
                        }
                    });

                    if (lhsFirst.size !== prevSize) {
                        changed = true;
                    }

                    if (!symbolFirst.has(EPSILON)) {
                        haveEpsilon = false;
                        break;
                    }
                } else if (symbol === EPSILON) {
                    haveEpsilon = true;
                    break;
                }
            }

            if (haveEpsilon) {

                if (!lhsFirst.has(EPSILON)) {
                    lhsFirst.add(EPSILON);
                    changed = true;
                }
            }
        }
    };

    return first;
};