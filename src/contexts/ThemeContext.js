import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../utils/theme';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      if (auth.currentUser) {
        const settingsRef = doc(db, 'userSettings', auth.currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const { darkMode } = settingsSnap.data();
          setIsDarkMode(darkMode);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preferência de tema:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setIsDarkMode, darkMode: isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
