import type { Grammar } from './types';
import { EPSILON } from './types';

export function computeFollow(grammar: Grammar, first: Map<string, Set<string>>): Map<string, Set<string>> {

    const follow = new Map<string, Set<string>>();

    grammar.nonTerminals.forEach(nt => {
        follow.set(nt, new Set());
    });

    follow.get(grammar.start)!.add('$');

    let changed = true;

    while (changed) {
        changed = false;

        for (const production of grammar.productions) {

            const lhs = production.lhs;
            const rhs = production.rhs;

            for (let i = 0; i < rhs.length; i++) {
                const symbol = rhs[i];

                if (grammar.nonTerminals.has(symbol)) {
                    const symbolFollow = follow.get(symbol)!;
                    const rest = rhs.slice(i + 1);

                    if (rest.length === 0) {
                        const lhsFollow = follow.get(lhs)!;
                        const prevSize = symbolFollow.size;

                        lhsFollow.forEach(s => symbolFollow.add(s));

                        if (symbolFollow.size !== prevSize) { changed = true; }
                    } else {
                        let haveEpsilon = true;

                        for (const beta of rest) {
                            let betaFirst: Set<string>;

                            if (grammar.terminals.has(beta)) {
                                betaFirst = new Set([beta]);
                            } else {
                                betaFirst = first.get(beta)!;
                            }

                            const prevSize = symbolFollow.size;
                            betaFirst.forEach(s => {
                                if (s !== EPSILON) { symbolFollow.add(s); }
                            });
                            if (symbolFollow.size !== prevSize) { changed = true; }

                            if (!betaFirst.has(EPSILON)) {
                                haveEpsilon = false;
                                break;
                            }
                        }

                        if (haveEpsilon) {

                            const lhsFollow = follow.get(lhs)!;
                            const prevSize = symbolFollow.size;

                            lhsFollow.forEach(s => symbolFollow.add(s));
                            if (symbolFollow.size !== prevSize) { changed = true; }
                        }
                    }
                }
            }
        }
    }

    return follow;
}
