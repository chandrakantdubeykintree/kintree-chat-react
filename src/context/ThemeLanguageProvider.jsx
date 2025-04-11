import { useProfile } from "@/hooks/useProfile";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import i18n from "@/i18n";
import { LANGUAGE_METADATA, LANGUAGES } from "@/constants/languages";

const initialState = {
  theme: "light",
  language: "en",
  setTheme: () => null,
  setLanguage: () => null,
};

const ThemeLanguageProviderContext = createContext(initialState);

export function ThemeLanguageProvider({
  children,
  defaultTheme = "light",
  defaultLanguage = "en",
  storageKey = "kintree-theme",
  languageStorageKey = "kintree-language",
  ...props
}) {
  const { profile: configurations, updateProfile } = useProfile(
    "user/configurations"
  );

  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem(storageKey);
    return savedTheme || configurations?.theme || defaultTheme;
  });

  const [language, setLanguageState] = useState(() => {
    // const savedLanguage = localStorage.getItem(languageStorageKey);
    return configurations?.language || defaultLanguage;
  });

  // Initialize theme and language once when configurations are loaded
  useEffect(() => {
    if (configurations && !localStorage.getItem(storageKey)) {
      setThemeState(configurations.theme || defaultTheme);
      localStorage.setItem(storageKey, configurations.theme || defaultTheme);
    }
    if (configurations && !localStorage.getItem(languageStorageKey)) {
      const configLanguage = configurations.language || defaultLanguage;
      if (LANGUAGES[configLanguage]) {
        setLanguageState(configLanguage);
        localStorage.setItem(languageStorageKey, configLanguage);
        i18n.changeLanguage(configLanguage);
      }
    }
  }, [configurations]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  // Debounced update function to prevent multiple API calls
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId = null;
      return (newSettings) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateProfile({
            url: "user/configurations",
            data: newSettings,
          });
        }, 500);
      };
    })(),
    [updateProfile]
  );

  const setTheme = useCallback(
    (newTheme) => {
      if (newTheme === theme) return;
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
      debouncedUpdate({ theme: newTheme, language });
    },
    [theme, language, storageKey, debouncedUpdate]
  );

  const setLanguage = useCallback(
    async (newLanguage) => {
      if (!LANGUAGES[newLanguage] || newLanguage === language) return;

      setLanguageState(newLanguage);
      await i18n.changeLanguage(newLanguage);

      // Update document direction
      const dir = LANGUAGE_METADATA[newLanguage]?.dir || "ltr";
      document.documentElement.dir = dir;
      document.documentElement.lang = newLanguage;
      document.documentElement.classList.toggle("rtl", dir === "rtl");

      // Update localStorage
      localStorage.setItem(languageStorageKey, newLanguage);

      // Update configurations with debounce
      debouncedUpdate({ theme, language: newLanguage });
    },
    [theme, language, languageStorageKey, debouncedUpdate]
  );

  const value = {
    theme,
    language,
    setTheme,
    setLanguage,
  };

  return (
    <ThemeLanguageProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeLanguageProviderContext.Provider>
  );
}

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageProviderContext);

  if (context === undefined) {
    throw new Error(
      "useThemeLanguage must be used within a ThemeLanguageProvider"
    );
  }

  return context;
};
