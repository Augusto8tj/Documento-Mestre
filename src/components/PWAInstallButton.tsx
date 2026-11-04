import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../usePWAInstall';
import { Download, Share2, PlusSquare, X, CheckCircle, WifiOff } from 'lucide-react';
import { BRASAO_RIO_CLARO } from '../brasaoBase64';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Se já estiver rodando como PWA instalado (modo standalone)
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
        <CheckCircle className="w-3 h-3 text-emerald-500" />
        <span>App Instalado</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Botão para Chrome / Edge / Android / Desktop */}
      {isInstallable && (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer border border-blue-400/30"
          title="Instalar o Banco Mestre diretamente no seu computador ou celular sem passar por lojas de aplicativos"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Instalar App</span>
        </button>
      )}

      {/* Botão para Safari no iOS (iPhone / iPad) */}
      {isIOS && !isInstallable && (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
          title="Como instalar no iPhone ou iPad"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Instalar no iPhone</span>
        </button>
      )}

      {/* Modal Guia Passo a Passo para iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#002b82] flex items-center justify-center shadow-md shrink-0">
                <img
                  src={BRASAO_RIO_CLARO}
                  alt="Brasão Rio Claro"
                  width={28}
                  height={32}
                  style={{
                    width: '28px',
                    height: '32px',
                    aspectRatio: '86 / 100',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                  className="brasao-oficial-img object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = BRASAO_RIO_CLARO;
                  }}
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Instalar no iPhone / iPad
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Banco Mestre Administrativo PMRC
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              O Safari permite instalar o sistema como um aplicativo nativo na tela de início:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  Toque no botão <strong className="text-blue-600">Compartilhar</strong> (ícone de quadrado com seta para cima <Share2 className="w-3.5 h-3.5 inline mx-0.5" />) na barra inferior do Safari.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  Role as opções para baixo e selecione <strong className="text-slate-900 dark:text-white">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  Toque em <strong className="text-blue-600">"Adicionar"</strong> no canto superior direito para concluir.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#002b82] py-2.5 text-xs font-bold text-white hover:bg-blue-900 transition-colors shadow-sm"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-xs border border-amber-400/40 animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <div>
        <p className="leading-tight">Modo Offline Ativo</p>
        <p className="text-[10px] text-amber-100 font-normal leading-tight">
          Você continua acessando todos os modelos e registros salvos localmente.
        </p>
      </div>
    </div>
  );
};
