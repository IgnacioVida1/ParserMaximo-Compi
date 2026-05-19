import type { Grammar, FirstFollow } from '../Grammars/types';
import { EPSILON } from '../Grammars/types';

export interface LL1Table {
    [nonTerminal: string]: {
        [terminal: string]: string[];
    };
};

export interface ParseStep {
    step: number;
    stack: string[];
    input: string;
    action: string;
    production?: string;
};

export class LL1Parser {

    private grammar: Grammar;
    private first: Map<string, Set<string>>;
    private follow: Map<string, Set<string>>;
    private table: LL1Table = {};
    private errors: string[] = [];

    constructor(grammar: Grammar, firstFollow: FirstFollow) {
        this.grammar = grammar;
        this.first = firstFollow.first;
        this.follow = firstFollow.follow;
        this.buildTable();
    };

    private buildTable() {
        this.grammar.nonTerminals.forEach(nt => {
            this.table[nt] = {};
        });

        for (const production of this.grammar.productions) {
            const A = production.lhs;
            const alpha = production.rhs;

            const firstAlpha = this.computeFirstOfSequence(alpha);

            firstAlpha.forEach(a => {
                if (a !== EPSILON) {
                    if (this.table[A][a]) {
                        this.errors.push(`Conflict in LL(1) table for non-terminal ${A} and terminal ${a}`);
                    }
                    this.table[A][a] = alpha;
                }
            });

            if (firstAlpha.has(EPSILON)) {
                const followA = this.follow.get(A) || new Set();
                followA.forEach(b => {
                    if (b !== EPSILON) {
                        if (this.table[A][b]) {
                            this.errors.push(`Conflict in LL(1) table for non-terminal ${A} and terminal ${b}`);
                        }
                        this.table[A][b] = alpha;
                    }
                });
            }
        };
    };

    private computeFirstOfSequence(symbols: string[]): Set<string> {

        const result = new Set<string>();
        let haveEpsilon = true;

        for (const symbol of symbols) {
            if (this.grammar.terminals.has(symbol)) {
                result.add(symbol);
                haveEpsilon = false;
                break;
            } else if (this.grammar.nonTerminals.has(symbol)) {
                const firstSymbol = this.first.get(symbol) || new Set();
                firstSymbol.forEach(s => { if (s !== EPSILON) { result.add(s); } });
                if (!firstSymbol.has(EPSILON)) {
                    haveEpsilon = false;
                    break;
                }

            } else if (symbol === EPSILON) {
                continue;
            }
        }

        if (haveEpsilon && symbols.length > 0) {
            result.add(EPSILON);
        }

        return result;
    };

    public parse(input: string): {accepted: boolean; steps: ParseStep[]; errors?: string[] } {

        const tokens = input.trim().split(/\s+/);
        tokens.push('$');

        const steps: ParseStep[] = [];
        let stack: string[] = ['$', this.grammar.start];
        let ip = 0;
        let step = 1;

        while (stack.length > 0) {
            const top = stack[stack.length - 1];
            const currentToken = tokens[ip];

            const currentInput = tokens.slice(ip).join(' ');

            steps.push({
                step,
                stack: [...stack],
                input: currentInput,
                action: ''
            });

            if (this.grammar.terminals.has(top)) {
                if (top === currentToken) {
                    stack.pop();
                    ip++;
                    steps[steps.length - 1].action = `Match: ${top}`;
                } else {
                    return {
                        accepted: false,
                        steps,
                        errors: [`Error: expected ${top}, found ${currentToken}`]
                    };
                }
            } else if (top === '$') {
                if (currentToken === '$') {
                    steps[steps.length - 1].action = 'Accept';
                    return {accepted: true, steps};
                } else {
                    return { accepted: false, steps, errors: [`Error: expected end of input, found ${currentToken}`] };
                }
            } else if (this.grammar.nonTerminals.has(top)) {
                const production = this.table[top]?.[currentToken];
                if (!production) {
                    return {
                        accepted: false,
                        steps,
                        errors: [`Error: no production for non-terminal ${top} with terminal ${currentToken}`]
                    };
                }

                stack.pop();

                if (production.length === 1 && production[0] === EPSILON) {
                    steps[steps.length - 1].action = `Output: ${top} → ε`;
                    steps[steps.length - 1].production = `${top} → ε`;
                } else {
                    steps[steps.length - 1].action = `${top} → ${production.join(' ')}`;
                    steps[steps.length - 1].production = `${top} → ${production.join(' ')}`;
                    for (let i = production.length - 1; i >= 0; i--) {
                        stack.push(production[i]);
                    }
                }
            } else {
                return { 
                    accepted: false,
                    steps,
                    errors: [`Error: symbol ${top} is neither terminal nor non-terminal`]
                }
            }

            step++;
        };

        return {
            accepted: false,
            steps,
            errors: ['Error: stack is empty but input is not fully consumed']
        }
    };

    public getTable(): LL1Table {
        return this.table; };

    public getErrors(): string[] {
        return this.errors;
    }

    public isLL1(): boolean {
        return this.errors.length === 0;
    };
};
