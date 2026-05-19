export interface HistoryItem {
    id: string;
    timestamp: Date;
    grammar: string;
    inputString: string;
    parserType: string;
    accepted: boolean;
    grammarName: string;
}

// Guardar en localStorage
export const saveToHistory = (grammar: string, inputString: string, parserType: string, accepted: boolean) => {
    const saved = localStorage.getItem('parserHistory');
    let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
    
    // Extraer nombre de la gramática
    const lines = grammar.trim().split('\n');
    const firstLine = lines[0] || '';
    const grammarName = firstLine.split('→')[0]?.trim() || 'Gramática';
    
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date(),
        grammar,
        inputString,
        parserType,
        accepted,
        grammarName
    };
    
    // Agregar al inicio y limitar a 50 items
    history = [newItem, ...history].slice(0, 50);
    
    localStorage.setItem('parserHistory', JSON.stringify(history));
    
    // Disparar evento para actualizar UI
    window.dispatchEvent(new Event('historyUpdated'));
};

// Cargar historial
export const loadHistory = (): HistoryItem[] => {
    const saved = localStorage.getItem('parserHistory');
    if (!saved) return [];
    
    try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
        }));
    } catch {
        return [];
    }
};

// Eliminar item
export const deleteFromHistory = (id: string) => {
    const history = loadHistory();
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem('parserHistory', JSON.stringify(newHistory));
    window.dispatchEvent(new Event('historyUpdated'));
};

// Eliminar todo
export const clearHistory = () => {
    localStorage.removeItem('parserHistory');
    window.dispatchEvent(new Event('historyUpdated'));
};