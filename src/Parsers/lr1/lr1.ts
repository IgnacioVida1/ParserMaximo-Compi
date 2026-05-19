import type { Grammar } from '../../Grammars/types';
import { EPSILON } from '../../Grammars/types';
import { LR1ItemSet, type LR1Item } from './lr1Items';

export interface LR1Action {
    type: 'shift' | 'reduce' | 'accept' | 'error';
    value?: number;
    production?: { lhs: string; rhs: string[] };
}

export interface LR1ParseStep {
    step: number;
    stack: number[];
    symbols: string[];
    input: string;
    action: string;
    nextState?: number;
}

export class LR1Parser {
    private grammar: Grammar;
    private itemSet: LR1ItemSet;
    private actionTable: Map<number, Map<string, LR1Action>> = new Map();
    private gotoTable: Map<number, Map<string, number>> = new Map();
    private states: LR1Item[][] = [];
    private stateMap: Map<string, number> = new Map();

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.itemSet = new LR1ItemSet(grammar);
        this.buildTables();
    }

    public buildTables(): void {
        const augmentedGrammar = this.itemSet.getAugmentedGrammar();
        
        console.log('=== CONSTRUCCIÓN LR(1) ===');
        
        // Crear ítem inicial con lookahead $
        const startProduction = augmentedGrammar.productions[0];
        const initialItem: LR1Item = {
            lhs: startProduction.lhs,
            rhs: [...startProduction.rhs],
            dotPosition: 0,
            lookahead: '$',
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

                // GOTO y SHIFT
                for (const symbol of symbols) {
                    const gotoState = this.itemSet.goto(state, symbol);

                    if (gotoState && gotoState.length > 0) {
                        const stateKey = this.stateToString(gotoState);
                        let targetStateIndex = this.stateMap.get(stateKey);

                        if (targetStateIndex === undefined) {
                            targetStateIndex = this.states.length;
                            this.states.push(gotoState);
                            this.stateMap.set(stateKey, targetStateIndex);
                            changed = true;
                        }

                        if (augmentedGrammar.terminals.has(symbol) || symbol === '$') {
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            this.actionTable.get(i)!.set(symbol, { type: 'shift', value: targetStateIndex });
                        } else if (augmentedGrammar.nonTerminals.has(symbol)) {
                            if (!this.gotoTable.has(i)) {
                                this.gotoTable.set(i, new Map());
                            }
                            this.gotoTable.get(i)!.set(symbol, targetStateIndex);
                        }
                    }
                }

                // REDUCE - Usando el lookahead del item
                for (const item of state) {
                    if (this.itemSet.isReduceItem(item)) {
                        const production = this.itemSet.getProductionFromItem(item);
                        
                        if (item.lhs === augmentedGrammar.start) {
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            this.actionTable.get(i)!.set('$', { type: 'accept' });
                        } else {
                            // LR(1): Solo agregar reducción para el lookahead específico
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            
                            const existingAction = this.actionTable.get(i)!.get(item.lookahead);
                            if (!existingAction) {
                                this.actionTable.get(i)!.set(item.lookahead, {
                                    type: 'reduce',
                                    value: item.productionIndex,
                                    production: production
                                });
                            } else if (existingAction.type === 'shift') {
                                console.warn(`⚠️ Conflicto shift/reduce en estado ${i}, lookahead ${item.lookahead}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`✅ ${this.states.length} estados generados`);
        console.log(`✅ ${this.actionTable.size} entradas en ACTION`);
        console.log(`✅ ${this.gotoTable.size} entradas en GOTO`);
    }

    private getSymbolsAfterDot(items: LR1Item[]): Set<string> {
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
    }

    private stateToString(state: LR1Item[]): string {
        return state.map(item => {
            if (item.rhs.length === 0 || (item.rhs.length === 1 && item.rhs[0] === EPSILON)) {
                return `${item.lhs}→•,${item.lookahead}`;
            }
            return `${item.lhs}→${item.rhs.join('')}•${item.dotPosition},${item.lookahead}`;
        }).sort().join('|');
    }

    public parse(input: string): { accepted: boolean; steps: LR1ParseStep[]; error?: string } {
        if (this.states.length === 0) {
            this.buildTables();
        }
        
        let tokens = input.trim().split(/\s+/);
        tokens.push('$');

        const steps: LR1ParseStep[] = [];
        let stack: number[] = [0];
        let symbolStack: string[] = [];
        let ip = 0;
        let step = 1;

        console.log('=== PARSING LR(1) ===');
        console.log('Entrada:', tokens);

        while (true) {
            const state = stack[stack.length - 1];
            const currentToken = tokens[ip];
            
            const actionRow = this.actionTable.get(state);
            if (!actionRow) {
                return {
                    accepted: false,
                    steps,
                    error: `Error: No hay acciones para el estado ${state}`
                };
            }
            
            const action = actionRow.get(currentToken);
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
                steps[steps.length - 1].action = `Shift "${currentToken}" → estado ${action.value}`;
                stack.push(action.value!);
                symbolStack.push(currentToken);
                ip++;
                steps[steps.length - 1].nextState = action.value;
                console.log(`Paso ${step}: Shift ${currentToken}`);
            } 
            else if (action.type === 'reduce') {
                const production = action.production!;
                const symbolsToPop = production.rhs.filter(s => s !== EPSILON);
                const numSymbols = symbolsToPop.length;
                
                steps[steps.length - 1].action = `Reduce: ${production.lhs} → ${production.rhs.join(' ')}`;
                
                for (let i = 0; i < numSymbols; i++) {
                    stack.pop();
                    symbolStack.pop();
                }
                
                const prevState = stack[stack.length - 1];
                const gotoState = this.gotoTable.get(prevState)?.get(production.lhs);
                
                if (gotoState === undefined) {
                    return {
                        accepted: false,
                        steps,
                        error: `Error: No hay goto desde ${prevState} para ${production.lhs}`
                    };
                }
                
                stack.push(gotoState);
                symbolStack.push(production.lhs);
                steps[steps.length - 1].nextState = gotoState;
                console.log(`Paso ${step}: Reduce ${production.lhs} → ${production.rhs.join(' ')}, goto ${gotoState}`);
            } 
            else if (action.type === 'accept') {
                steps[steps.length - 1].action = '✅ ACEPTAR - Cadena válida';
                console.log(`Paso ${step}: Aceptar`);
                return { accepted: true, steps };
            }
            
            step++;
        }
    }

    public getActionTable(): Map<number, Map<string, LR1Action>> {
        return this.actionTable;
    }

    public getGotoTable(): Map<number, Map<string, number>> {
        return this.gotoTable;
    }

    public getStates(): LR1Item[][] {
        return this.states;
    }
    
    public getItemSet(): LR1ItemSet {
        return this.itemSet;
    }
}