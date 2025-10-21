import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ModelType = 'chat' | 'doc' | 'vision';

interface ModelContextType {
  currentModel: ModelType;
  setModel: (model: ModelType) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

const MODEL_STORAGE_KEY = 'aura_selected_model';

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [currentModel, setCurrentModel] = useState<ModelType>('chat');

  // Load model from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && (stored === 'chat' || stored === 'doc' || stored === 'vision')) {
      setCurrentModel(stored as ModelType);
    }
  }, []);

  // Save model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, currentModel);
  }, [currentModel]);

  const setModel = (model: ModelType) => {
    setCurrentModel(model);
  };

  return (
    <ModelContext.Provider value={{ currentModel, setModel }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

