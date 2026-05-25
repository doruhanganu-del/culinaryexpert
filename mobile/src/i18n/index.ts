import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import esES from './locales/es-ES.json';
import ca   from './locales/ca.json';
import pt   from './locales/pt.json';
import fr   from './locales/fr.json';
import it   from './locales/it.json';
import deDE from './locales/de-DE.json';
import deAT from './locales/de-AT.json';
import nl   from './locales/nl.json';
import pl   from './locales/pl.json';
import ro   from './locales/ro.json';

const SUPPORTED = ['en-US', 'en-GB', 'es-ES', 'ca', 'pt', 'fr', 'it', 'de-DE', 'de-AT', 'nl', 'pl', 'ro'] as const;

function detectLocale(): string {
  try {
    const raw = Intl.DateTimeFormat().resolvedOptions().locale;
    if ((SUPPORTED as readonly string[]).includes(raw)) return raw;
    const lang = raw.split('-')[0];
    return SUPPORTED.find(s => s === lang || s.startsWith(lang + '-')) ?? 'en-US';
  } catch {
    return 'en-US';
  }
}

i18n.use(initReactI18next).init({
  resources: {
    'en-US': { translation: enUS },
    'en-GB': { translation: enGB },
    'es-ES': { translation: esES },
    'ca':    { translation: ca },
    'pt':    { translation: pt },
    'fr':    { translation: fr },
    'it':    { translation: it },
    'de-DE': { translation: deDE },
    'de-AT': { translation: deAT },
    'nl':    { translation: nl },
    'pl':    { translation: pl },
    'ro':    { translation: ro },
  },
  lng: detectLocale(),
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
});

export default i18n;
