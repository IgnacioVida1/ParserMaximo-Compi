import type { Grammar } from '../../Grammars/types';
import { LR0ItemSet } from './lr0Items';
import type { LR0Item } from './lr0Items';
import { EPSILON } from '../../Grammars/types';

export interface LR0Action {
    type: 'shift' | 'reduce' | 'accept' | 'error';
    value?: number;
    production?: {lhs: string, rhs: string[]};
};

export interface LR0ParseStep {
    step: number;
    stack: number[];
    symbols: string[];
    input: string;
    action: string;
    nextState?: number;
};

export class LR0Parser {
    private grammar: Grammar;
    private itemSet: LR0ItemSet;
    private actionTable: Map<number, Map<string, LR0Action>> = new Map();
    private gotoTable: Map<number, Map<string, number>> = new Map();
    private states: LR0Item[][] = [];
    private stateMap: Map<string, number> = new Map();

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.itemSet = new LR0ItemSet(grammar);
        this.buildTable();
    }

    public buildTable(): void {
        const augmentedGrammar = this.itemSet.getAugmentedGrammar();

        const startProduction = augmentedGrammar.productions[0];
        const initialItem: LR0Item = {
            lhs: startProduction.lhs,
            rhs: [...startProduction.rhs],
            dotPosition: 0,
            productionIndex: 0
        };

        let initialClosure = this.itemSet.closure([initialItem]);
        this.states.push(initialClosure);
        this.stateMap.set(this.stateToString(initialClosure), 0);

        let changed = true;
        while (changed) {
            changed = false;

            for (let i = 0; i < this.states.length; i++) {
                const state = this.states[i];
                const symbols = this.getSymbolsAfterDot(state);

                for (const symbol of symbols) {
                    const gotoState = this.itemSet.goto(state, symbol);

                    if (gotoState && gotoState.length > 0) {
                        let targetStateIndex = this.stateMap.get(this.stateToString(gotoState));

                        if (targetStateIndex === undefined) {
                            targetStateIndex = this.states.length;
                            this.states.push(gotoState);
                            this.stateMap.set(this.stateToString(gotoState), targetStateIndex);
                            changed = true;
                        }

                        if (augmentedGrammar.terminals.has(symbol) || symbol === '$') {
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            const existingAction = this.actionTable.get(i)!.get(symbol);
                            if (!existingAction) {
                                this.actionTable.get(i)!.set(symbol, { type: 'shift', value: targetStateIndex });
                            }
                        } else {
                            if (!this.gotoTable.has(i)) {
                                this.gotoTable.set(i, new Map());
                            }
                            this.gotoTable.get(i)!.set(symbol, targetStateIndex);
                        }
                    }
                }

                for (const item of state) {
                    if (this.itemSet.isReduceItem(item)) {
                        const production = this.itemSet.getProductionFromItem(item);

                        if (item.lhs === augmentedGrammar.start) {
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            this.actionTable.get(i)!.set('$', {type: 'accept'});
                        } else {
                            const terminals = [...augmentedGrammar.terminals, '$'];
                            for (const terminal of terminals) {
                                if (!this.actionTable.has(i)) {
                                    this.actionTable.set(i, new Map());
                                }

                                const existingAction = this.actionTable.get(i)!.get(terminal);
                                if (!existingAction || existingAction.type === 'reduce') {
                                    this.actionTable.get(i)!.set(terminal, {
                                        type: 'reduce',
                                        value: item.productionIndex,
                                        production: production
                                    });
                                } else {
                                    console.warn(`Conflicto shift/reduce en estado ${i}, terminal ${terminal}`);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    private getSymbolsAfterDot(items: LR0Item[]): Set<string> {

        const symbols = new Set<string>();
        for (const item of items) {
            if (item.dotPosition < item.rhs.length) {
                const symbol = item.rhs[item.dotPosition];
                if (symbol !== EPSILON) {
                    symbols.add(symbol);
                }
            }
        }
        return symbols;
    };

    private stateToString(state: LR0Item[]): string {

        return state.map(item => {
            if (item.rhs.length === 0) {
                return `${item.lhs}→•`;
            }
            return `${item.lhs}→${item.rhs.join('')}•${item.dotPosition}`;
        }).sort().join('|');
    };

    public parse(input: string): {accepted: boolean, steps: LR0ParseStep[], error?: string} {
        
        if (this.states.length === 0) {
            this.buildTable();
        }

        const tokens = input.trim().split(/\s+/);
        tokens.push('$');

        const steps: LR0ParseStep[] = [];
        let stack: number[] = [0];
        let symbolStack: string[] = [];
        let ip = 0;
        let step = 1;

        while (true) {
            const state = stack[stack.length - 1];
            const currentToken = tokens[ip];
            const action = this.actionTable.get(state)?.get(currentToken);

            const currentInput = tokens.slice(ip).join(' ');

            steps.push({
                step,
                stack: [...stack],
                symbols: [...symbolStack],
                input: currentInput,
                action: ''
            });

            if (!action) {
                return {
                    accepted: false,
                    steps,
                    error: `Error en estado ${state}: No hay acción para '${currentToken}'`
                };
            }

            if (action.type === 'shift') {
                steps[steps.length - 1].action = `Shift a estado ${action.value}`;
                stack.push(action.value!);
                symbolStack.push(currentToken);
                ip++;
                steps[steps.length - 1].nextState = action.value;
            } else if (action.type === 'reduce') {
                const production = action.production!;
                const symbolsToPop = production.rhs.filter(s => s !== EPSILON);
                const numSymbol = production.rhs.length;

                steps[steps.length - 1].action = `Reduce ${production.lhs} → ${production.rhs.join(' ')}`;

                for (let i = 0; i < numSymbol; i++) {
                    stack.pop();
                    symbolStack.pop();
                }

                const prevState = stack[stack.length - 1];
                const gotoState = this.gotoTable.get(prevState)?.get(production.lhs);

                if (gotoState === undefined) {
                    return {
                        accepted: false,
                        steps,
                        error: `Error: No hay goto desde estado ${prevState} para ${production.lhs}`
                    };
                }

                stack.push(gotoState);
                symbolStack.push(production.lhs);
                steps[steps.length - 1].nextState = gotoState;
            } else if (action.type === 'accept') {

                steps[steps.length - 1].action = 'Aceptar';
                return { accepted: true, steps };
            }

            step++;
        }
    };

    public getActionTable(): Map<number, Map<string, LR0Action>> {
        return this.actionTable;
    };

    public getGotoTable(): Map<number, Map<string, number>> {
        return this.gotoTable;
    }

    public getStates(): LR0Item[][] {
        return this.states;
    }

    public getItemSet(): LR0ItemSet {
        return this.itemSet;
    }
};