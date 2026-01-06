import { createContext, useContext, useState, type ReactNode } from 'react';

interface OracleContextType {
    // Search data from Vault
    searchQuery: string;
    selectedDocuments: string[];
    searchChunks: any[];

    // Methods to update context
    consultMinerva: (query: string, docs: string[], chunks: any[]) => void;
    clearOracle: () => void;

    // State to track if data was imported
    hasOracleGuidance: boolean;
}

const OracleContext = createContext<OracleContextType | undefined>(undefined);

export function OracleProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [searchChunks, setSearchChunks] = useState<any[]>([]);
    const [hasOracleGuidance, setHasOracleGuidance] = useState(false);

    const consultMinerva = (query: string, docs: string[], chunks: any[]) => {
        setSearchQuery(query);
        setSelectedDocuments(docs);
        setSearchChunks(chunks);
        setHasOracleGuidance(true);
    };

    const clearOracle = () => {
        setSearchQuery('');
        setSelectedDocuments([]);
        setSearchChunks([]);
        setHasOracleGuidance(false);
    };

    return (
        <OracleContext.Provider
            value={{
                searchQuery,
                selectedDocuments,
                searchChunks,
                consultMinerva,
                clearOracle,
                hasOracleGuidance,
            }}
        >
            {children}
        </OracleContext.Provider>
    );
}

export function useOracle() {
    const context = useContext(OracleContext);
    if (context === undefined) {
        throw new Error('useOracle must be used within an OracleProvider');
    }
    return context;
}
