export type Symbol = string;
export type Production = {
    lhs: string;
    rhs: string[];
};

export interface Grammar {
    productions: Production[];
    start: string;
    terminals: Set<string>;
    nonTerminals: Set<string>;
};

export interface FirstFollow {
    first: Map<string, Set<string>>;
    follow: Map<string, Set<string>>;
};

export const EPSILON = 'ε';