import { createContext, useContext } from 'react';

export interface AuthContextType {
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  login: (name: string, email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
