import React, { useEffect } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  SlidersHorizontal,
  Check,
  X,
  RotateCcw,
  Smartphone,
  Eye,
  Sparkles,
} from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePalette = 'institucional' | 'esmeralda' | 'indigo' | 'grafite' | 'ambar';
export type FormStyle = 'padrao' | 'confortavel' | 'contraste';

export interface ThemePreferences {
  mode: ThemeMode;
  palette: ThemePalette;
  formStyle: FormStyle;
}

export interface PaletteOption {
  id: ThemePalette;
  label: string;
  shortDesc: string;
  swatch: string;
  headerBg: string;
  accentLight: string;
  accentDark: string;
  metaLight: string;
  metaDark: string;
}

export const THEME_PALETTES: PaletteOption[] = [
  {
    id: 'institucional',
    label: 'Azul Institucional',
    shortDesc: 'Padrão oficial PMRC',
    swatch: '#2563eb',
    headerBg: '#0c1b3a',
    accentLight: '#1d4ed8',
    accentDark: '#60a5fa',
    metaLight: '#0c1b3a',
    metaDark: '#071024',
  },
  {
    id: 'esmeralda',
    label: 'Esmeralda Gestão',
    shortDesc: 'Suave para longas jornadas',
    swatch: '#059669',
    headerBg: '#062c22',
    accentLight: '#047857',
    accentDark: '#34d399',
    metaLight: '#062c22',
    metaDark: '#041d16',
  },
  {
    id: 'indigo',
    label: 'Índigo Executivo',
    shortDesc: 'Contraste moderno',
    swatch: '#4f46e5',
    headerBg: '#181842',
    accentLight: '#4338ca',
    accentDark: '#818cf8',
    metaLight: '#181842',
    metaDark: '#0f0f2b',
  },
  {
    id: 'grafite',
    label: 'Grafite Neutro',
    shortDesc: 'Minimalista sem fadiga',
    swatch: '#475569',
    headerBg: '#18181b',
    accentLight: '#334155',
    accentDark: '#94a3b8',
    metaLight: '#18181b',
    metaDark: '#09090b',
  },
  {
    id: 'ambar',
    label: 'Âmbar Clássico',
    shortDesc: 'Destaque quente legível',
    swatch: '#d97706',
    headerBg: '#2b1908',
    accentLight: '#b45309',
    accentDark: '#fbbf24',
    metaLight: '#2b1908',
    metaDark: '#1c1005',
  },
];

export const DEFAULT_THEME_PREFS: ThemePreferences = {
  mode: 'light',
  palette: 'institucional',
  formStyle: 'padrao',
};

const STORAGE_KEY_PREFS = 'sgep_theme_prefs_v2';

export function loadThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validModes: ThemeMode[] = ['light', 'dark', 'system'];
      const validPalettes: ThemePalette[] = ['institucional', 'esmeralda', 'indigo', 'grafite', 'ambar'];
      const validForms: FormStyle[] = ['padrao', 'confortavel', 'contraste'];
      return {
        mode: validModes.includes(parsed?.mode) ? parsed.mode : DEFAULT_THEME_PREFS.mode,
        palette: validPalettes.includes(parsed?.palette) ? parsed.palette : DEFAULT_THEME_PREFS.palette,
        formStyle: validForms.includes(parsed?.formStyle) ? parsed.formStyle : DEFAULT_THEME_PREFS.formStyle,
      };
    }
    // Compatibilidade com chave legada 'theme'
    const legacy = localStorage.getItem('theme');
    if (legacy === 'dark' || legacy === 'light') {
      return { ...DEFAULT_THEME_PREFS, mode: legacy };
    }
  } catch {
    // fallback seguro
  }
  return DEFAULT_THEME_PREFS;
}

export function saveThemePreferences(prefs: ThemePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    localStorage.setItem('theme', prefs.mode === 'dark' ? 'dark' : 'light');
  } catch {
    // ignora restrições de armazenamento
  }
}

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  formStyle: FormStyle;
  isDarkMode: boolean;
  systemPrefersDark: boolean;
  onChangeMode: (mode: ThemeMode) => void;
  onChangePalette: (palette: ThemePalette) => void;
  onChangeFormStyle: (style: FormStyle) => void;
  onResetDefaults: () => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  themeMode,
  themePalette,
  formStyle,
  isDarkMode,
  systemPrefersDark,
  onChangeMode,
  onChangePalette,
  onChangeFormStyle,
  onResetDefaults,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePalette = THEME_PALETTES.find((p) => p.id === themePalette) || THEME_PALETTES[0];

  const modeOptions: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Claro',
      desc: 'Dia / Iluminado',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'dark',
      label: 'Escuro',
      desc: 'Conforto noturno',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'system',
      label: 'Automático',
      desc: systemPrefersDark ? 'Tela: Escuro' : 'Tela: Claro',
      icon: <Monitor className="w-4 h-4 text-sky-500" />,
    },
  ];

  const formStyleOptions: {
    id: FormStyle;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'padrao',
      label: 'Padrão',
      desc: 'Campos equilibrados e compactos para desktop e telas médias.',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      id: 'confortavel',
      label: 'Celular / Toque',
      desc: 'Campos mais altos (44px), texto legível sem zoom automático no celular.',
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      id: 'contraste',
      label: 'Alto Contraste',
      desc: 'Bordas reforçadas (2px), rótulos nítidos e foco bem destacado nos campos.',
      icon: <Eye className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="no-print fixed inset-0 z-[110] flex items-end sm:items-start sm:justify-end bg-slate-950/55 backdrop-blur-[2px] sm:p-4 sm:pt-16 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[420px] max-h-[90dvh] sm:max-h-[calc(100dvh-5rem)] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700/80 overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alça visual de arraste no celular */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-slate-50 dark:bg-slate-900">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Cabeçalho do Seletor */}
        <div
          className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0"
          style={{
            background: isDarkMode
              ? `linear-gradient(135deg, ${activePalette.headerBg} 0%, #0f172a 100%)`
              : `linear-gradient(135deg, ${activePalette.headerBg} 0%, ${activePalette.accentLight} 100%)`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="theme-modal-title" className="text-sm font-bold text-white truncate">
                Tema, Cores e Formulários
              </h2>
              <p className="text-[11px] text-white/80 truncate">
                {activePalette.label} • {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar configurações de tema"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* 1. Modo de Exibição */}
          <section aria-label="Modo de exibição">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Modo de Tela
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {themeMode === 'system'
                  ? `Automático (${systemPrefersDark ? 'Escuro' : 'Claro'})`
                  : isDarkMode
                  ? 'Escuro ativo'
                  : 'Claro ativo'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {modeOptions.map((opt) => {
                const selected = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeMode(opt.id)}
                    className={`relative flex flex-col items-center justify-center gap-1 px-2 py-3 min-h-[72px] rounded-xl border text-center transition-all cursor-pointer active:scale-[0.98] ${
                      selected
                        ? 'bg-slate-50 dark:bg-slate-800/90 shadow-sm'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: activePalette.swatch,
                            boxShadow: `0 0 0 2px ${activePalette.swatch}33`,
                          }
                        : undefined
                    }
                  >
                    {selected && (
                      <span
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center"
                        style={{ backgroundColor: activePalette.swatch }}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {opt.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Paleta de Cores do Sistema */}
          <section aria-label="Paleta de cores">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cor do Sistema
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Cabeçalho, destaques e foco
              </span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
              {THEME_PALETTES.map((pal) => {
                const selected = themePalette === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => onChangePalette(pal.id)}
                    className={`flex items-center gap-2.5 p-2.5 min-h-[54px] rounded-xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      selected
                        ? 'bg-slate-50 dark:bg-slate-800/90 shadow-sm'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: pal.swatch,
                            boxShadow: `0 0 0 2px ${pal.swatch}33`,
                          }
                        : undefined
                    }
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-black/10 dark:border-white/15 shrink-0 flex flex-col">
                      <span className="h-1/2 w-full block" style={{ backgroundColor: pal.headerBg }} />
                      <span className="h-1/2 w-full block" style={{ backgroundColor: pal.swatch }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {pal.label}
                        </span>
                        {selected && (
                          <span
                            className="w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0"
                            style={{ backgroundColor: pal.swatch }}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {pal.shortDesc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Estilo e Conforto dos Formulários */}
          <section aria-label="Estilo dos formulários">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Formulários e Campos
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Legibilidade e toque
              </span>
            </div>
            <div className="space-y-2">
              {formStyleOptions.map((opt) => {
                const selected = formStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeFormStyle(opt.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                      selected
                        ? 'bg-slate-50 dark:bg-slate-800/90 shadow-sm'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: activePalette.swatch,
                            boxShadow: `0 0 0 2px ${activePalette.swatch}33`,
                          }
                        : undefined
                    }
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                      style={
                        selected
                          ? { backgroundColor: activePalette.swatch, color: '#ffffff' }
                          : undefined
                      }
                    >
                      <span className={selected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                        {opt.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {opt.label}
                        </span>
                        {selected && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: activePalette.swatch }}
                          >
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Prévia ao Vivo dos Formulários */}
          <section
            aria-label="Prévia de formulário"
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: activePalette.swatch }} />
                Prévia nos Formulários
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Documentos A4 permanecem oficiais
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Assunto / Campo
                </label>
                <input
                  type="text"
                  defaultValue="Ofício de Solicitação"
                  readOnly
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Secretaria
                </label>
                <select
                  defaultValue="SMA"
                  aria-label="Prévia de seleção de secretaria"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="SMA">Administração (SMA)</option>
                  <option value="SMS">Saúde (SMS)</option>
                  <option value="SME">Educação (SME)</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Rodapé com Safe-Area para celulares */}
        <div
          className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex items-center justify-between gap-2 shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            style={{ backgroundColor: activePalette.swatch }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar e Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
