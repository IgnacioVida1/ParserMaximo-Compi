import type { Grammar } from '../Grammars/types';
import { EPSILON } from '../Grammars/types';

export interface RecursiveStep {

    step: number;
    function: string;
    input: string;
    position: number;
    action: string;
    success: boolean;
    production?: string;
};

export class RecursiveDescentParser {

    private grammar: Grammar;
    private input: string[] = [];
    private position: number = 0;
    private steps: RecursiveStep[] = [];
    private stepCount: number = 0;

    constructor(grammar: Grammar) {
        this.grammar = grammar;
    }

    public parse(input: string): { accepted: boolean; steps: RecursiveStep[]; error?: string } {

        this.input = input.trim().split(/\s+/);
        this.input.push('$');
        this.position = 0;
        this.steps = [];
        this.stepCount = 0;

        try {

            const result = this.parseSymbol(this.grammar.start);

            if (result && this.input[this.position] === '$') {

                this.addStep(this.grammar.start, 'Cadena aceptada', true);
                return {accepted: true, steps: this.steps};
            } else {
                return {
                    accepted: false,
                    steps: this.steps,
                    error: `Error de sintaxis: se esperaba el final de la cadena pero se encontró '${this.input[this.position]}'`
                };
            }
        } catch (e: any) {
            return {
                accepted: false,
                steps: this.steps,
                error: e.message};
        }
    }

    private parseSymbol(symbol: string): boolean {
        if (this.grammar.terminals.has(symbol)) {
            return this.matchTerminal(symbol);
        } else if (this.grammar.nonTerminals.has(symbol)) {
            return this.parseNonTerminal(symbol);
        } else if (symbol === EPSILON) {
            this.addStep(symbol, 'ε, no consume entrada', true, `${symbol} → ε`);
            return true;
        }
        this.addStep(symbol, `Error: Símbolo desconocido '${symbol}'`, false);
        return false;
    }

    private matchTerminal(terminal: string): boolean {
        const currentInput = this.input[this.position];
        this.addStep(terminal, `Comparar con '${currentInput}'`, false);

        if (currentInput === terminal) {
            this.addStep(terminal, `Terminal '${terminal}' coincide, avanzar`, true);
            this.position++;
            return true;
        }

        this.addStep(terminal, `Terminal '${terminal}' no coincide con '${currentInput}'`, false);
        return false;
    }

    private parseNonTerminal(nonTerminal: string): boolean {
        const productions = this.grammar.productions.filter(p => p.lhs === nonTerminal);
        const savedPosition = this.position;
        
        // Intentar cada producción en orden
        for (let idx = 0; idx < productions.length; idx++) {
            const production = productions[idx];
            const prodStr = `${nonTerminal} → ${production.rhs.join(' ')}`;
            
            // Restaurar posición para cada intento
            this.position = savedPosition;
            
            this.addStep(nonTerminal, `Intentando producción ${idx + 1}/${productions.length}: ${prodStr}`, false, prodStr);
            
            let success = true;
            
            // Si es producción ε, éxito inmediato sin consumir entrada
            if (production.rhs.length === 1 && production.rhs[0] === EPSILON) {
                this.addStep(nonTerminal, `✓ Producción ε exitosa: ${prodStr}`, true, prodStr);
                return true;
            }
            
            // Intentar cada símbolo de la producción
            for (const symbol of production.rhs) {
                if (!this.parseSymbol(symbol)) {
                    success = false;
                    break;
                }
            }
            
            if (success) {
                this.addStep(nonTerminal, `✓ Producción exitosa: ${prodStr}`, true, prodStr);
                return true;
            }
            
            // Falló esta producción, hacer backtracking
            this.addStep(nonTerminal, `↺ Backtracking - Producción fallida, restaurando posición a ${savedPosition}`, false, '');
        }
        
        // Restaurar posición original
        this.position = savedPosition;
        this.addStep(nonTerminal, `✗ No hay producciones exitosas para ${nonTerminal}`, false);
        return false;
    }

    private addStep(functionName: string, action: string, success: boolean, production?: string): void {
    this.stepCount++;
    this.steps.push({
      step: this.stepCount,
      function: functionName,
      input: this.input.slice(this.position).join(' '),
      position: this.position,
      action: action,
      success: success});
    }
};