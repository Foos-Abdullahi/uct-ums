import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type Language = 'en' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('uct-ums-lang');
        return (saved as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('uct-ums-lang', lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
