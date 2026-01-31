
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate checking local storage for session
    const storedUser = localStorage.getItem('prompt-finance-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('prompt-finance-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    // Simulate network delay
    setTimeout(() => {
        // Mock validation - allow any email with @ and 6+ char password
        if (email.includes('@') && password.length >= 6) {
             const mockUser = {
                id: 'demo-user-id',
                name: email.split('@')[0],
                email: email
            };
            setUser(mockUser);
            localStorage.setItem('prompt-finance-user', JSON.stringify(mockUser));
            setIsLoading(false);
        } else {
            setError("Invalid credentials (mock). Use any email and 6+ char password.");
            setIsLoading(false);
        }
    }, 800);
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
        if (email.includes('@') && password.length >= 6) {
            const mockUser = {
                id: crypto.randomUUID(),
                name: name,
                email: email
            };
            setUser(mockUser);
            localStorage.setItem('prompt-finance-user', JSON.stringify(mockUser));
            setIsLoading(false);
        } else {
            setError("Invalid details. Password must be 6+ chars.");
            setIsLoading(false);
        }
    }, 800);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('prompt-finance-user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
