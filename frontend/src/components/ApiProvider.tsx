import React, { createContext, useMemo } from 'react';
import ApiClient from '../ApiClient';
import { error } from 'console';

export const ApiContext = createContext<ApiClient | null>(null)

export function ApiProvider({ children, onError }: React.PropsWithChildren<{ onError?: (error: any) => void; }>) {
    
    const api = useMemo(() => new ApiClient(error), [onError]);
    return (
        <ApiContext.Provider value={api}>
            {children}
        </ApiContext.Provider>
    
    )

}

export default ApiProvider;