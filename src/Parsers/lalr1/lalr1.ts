import type { Grammar } from '../../Grammars/types';
import { EPSILON } from '../../Grammars/types';
import { LALR1ItemSet, type LALR1Item } from './lalr1Items';

export interface LALR1Action {
    type: 'shift' | 'reduce' | 'accept' | 'error';
    value?: number;
    production?: { lhs: string; rhs: string[] };
}

export interface LALR1ParseStep {
    step: number;
    stack: number[];
    symbols: string[];
    input: string;
    action: string;
    nextState?: number;
}

export class LALR1Parser {
    private grammar: Grammar;
    private itemSet: LALR1ItemSet;
    private actionTable: Map<number, Map<string, LALR1Action>> = new Map();
    private gotoTable: Map<number, Map<string, number>> = new Map();
    private states: LALR1Item[][] = [];
    private stateMap: Map<string, number> = new Map();

    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.itemSet = new LALR1ItemSet(grammar);
        this.buildTables();
    }

    private getStateCore(state: LALR1Item[]): string {
        // El núcleo ignora los lookaheads
        return state.map(item => {
            if (item.rhs.length === 0 || (item.rhs.length === 1 && item.rhs[0] === EPSILON)) {
                return `${item.lhs}→•`;
            }
            return `${item.lhs}→${item.rhs.join('')}•${item.dotPosition}`;
        }).sort().join('|');
    }

    private mergeStates(states: LALR1Item[][]): LALR1Item[][] {
        const merged: LALR1Item[][] = [];
        const coreMap = new Map<string, number>();
        
        for (const state of states) {
            const core = this.getStateCore(state);
            
            if (coreMap.has(core)) {
                // Combinar con estado existente
                const targetIndex = coreMap.get(core)!;
                const targetState = merged[targetIndex];
                
                // Combinar lookaheads de items con el mismo núcleo
                for (const item of state) {
                    const targetItem = targetState.find(i =>
                        i.lhs === item.lhs &&
                        JSON.stringify(i.rhs) === JSON.stringify(item.rhs) &&
                        i.dotPosition === item.dotPosition
                    );
                    
                    if (targetItem) {
                        item.lookaheads.forEach(l => targetItem.lookaheads.add(l));
                    } else {
                        targetState.push({ ...item, lookaheads: new Set(item.lookaheads) });
                    }
                }
            } else {
                // Nuevo estado
                const newState = state.map(item => ({
                    ...item,
                    lookaheads: new Set(item.lookaheads)
                }));
                merged.push(newState);
                coreMap.set(core, merged.length - 1);
            }
        }
        
        console.log(`Fusion LALR(1): ${states.length} estados -> ${merged.length} estados`);
        return merged;
    }

    public buildTables(): void {
        const augmentedGrammar = this.itemSet.getAugmentedGrammar();
        
        console.log('=== CONSTRUCCIÓN LALR(1) ===');
        
        // Construir LR(1) items primero
        const startProduction = augmentedGrammar.productions[0];
        const initialItem: LALR1Item = {
            lhs: startProduction.lhs,
            rhs: [...startProduction.rhs],
            dotPosition: 0,
            lookaheads: new Set(['$']),
            productionIndex: 0
        };

        let initialClosure = this.itemSet.closure([initialItem]);
        let lr1States: LALR1Item[][] = [initialClosure];
        let lr1StateMap = new Map<string, number>();
        lr1StateMap.set(this.getStateCore(initialClosure), 0);

        let changed = true;
        while (changed) {
            changed = false;
            
            for (let i = 0; i < lr1States.length; i++) {
                const state = lr1States[i];
                const symbols = this.getSymbolsAfterDot(state);
                
                for (const symbol of symbols) {
                    const gotoState = this.itemSet.goto(state, symbol);
                    
                    if (gotoState && gotoState.length > 0) {
                        const core = this.getStateCore(gotoState);
                        let targetStateIndex = lr1StateMap.get(core);
                        
                        if (targetStateIndex === undefined) {
                            targetStateIndex = lr1States.length;
                            lr1States.push(gotoState);
                            lr1StateMap.set(core, targetStateIndex);
                            changed = true;
                        }
                    }
                }
            }
        }
        
        // Fusionar estados con el mismo núcleo (LALR)
        this.states = this.mergeStates(lr1States);
        
        // Reconstruir stateMap
        this.stateMap.clear();
        this.states.forEach((state, idx) => {
            this.stateMap.set(this.getStateCore(state), idx);
        });
        
        // Construir tablas con los estados fusionados
        for (let i = 0; i < this.states.length; i++) {
            const state = this.states[i];
            const symbols = this.getSymbolsAfterDot(state);
            
            // GOTO y SHIFT
            for (const symbol of symbols) {
                // Necesitamos calcular goto para cada símbolo
                const gotoState = this.itemSet.goto(state, symbol);
                
                if (gotoState && gotoState.length > 0) {
                    const targetCore = this.getStateCore(gotoState);
                    const targetStateIndex = this.stateMap.get(targetCore);
                    
                    if (targetStateIndex !== undefined) {
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
            }
            
            // REDUCE
            for (const item of state) {
                if (this.itemSet.isReduceItem(item)) {
                    const production = this.itemSet.getProductionFromItem(item);
                    
                    if (item.lhs === augmentedGrammar.start) {
                        if (!this.actionTable.has(i)) {
                            this.actionTable.set(i, new Map());
                        }
                        this.actionTable.get(i)!.set('$', { type: 'accept' });
                    } else {
                        for (const lookahead of item.lookaheads) {
                            if (!this.actionTable.has(i)) {
                                this.actionTable.set(i, new Map());
                            }
                            
                            const existingAction = this.actionTable.get(i)!.get(lookahead);
                            if (!existingAction) {
                                this.actionTable.get(i)!.set(lookahead, {
                                    type: 'reduce',
                                    value: item.productionIndex,
                                    production: production
                                });
                            } else if (existingAction.type === 'shift') {
                                console.warn(`⚠️ Conflicto shift/reduce en estado ${i}, lookahead ${lookahead}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`✅ ${this.states.length} estados LALR(1) generados`);
        console.log(`✅ ${this.actionTable.size} entradas en ACTION`);
        console.log(`✅ ${this.gotoTable.size} entradas en GOTO`);
    }

    private getSymbolsAfterDot(items: LALR1Item[]): Set<string> {
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

    public parse(input: string): { accepted: boolean; steps: LALR1ParseStep[]; error?: string } {
        if (this.states.length === 0) {
            this.buildTables();
        }
        
        let tokens = input.trim().split(/\s+/);
        tokens.push('$');

        const steps: LALR1ParseStep[] = [];
        let stack: number[] = [0];
        let symbolStack: string[] = [];
        let ip = 0;
        let step = 1;

        console.log('=== PARSING LALR(1) ===');
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

    public getActionTable(): Map<number, Map<string, LALR1Action>> {
        return this.actionTable;
    }

    public getGotoTable(): Map<number, Map<string, number>> {
        return this.gotoTable;
    }

    public getStates(): LALR1Item[][] {
        return this.states;
    }
    
    public getItemSet(): LALR1ItemSet {
        return this.itemSet;
    }
}