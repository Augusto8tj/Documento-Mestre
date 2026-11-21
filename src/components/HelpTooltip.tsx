import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface HelpTooltipProps {
  title?: string;
  content: React.ReactNode;
  size?: 'xs' | 'sm';
  tone?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose' | 'blue';
  className?: string;
  ariaLabel?: string;
}

/**
 * Balão explicativo interativo ("?") com posicionamento fixo calculado pela viewport,
 * evitando cortes em modais com scroll ou tabelas com overflow-x-auto.
 * Funciona com hover, foco de teclado e clique/toque (mobile-friendly).
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  size = 'xs',
  tone = 'slate',
  className = '',
  ariaLabel
}) => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 10;
    const popWidth = Math.min(290, window.innerWidth - margin * 2);
    const estHeight = 135;

    let placement: 'top' | 'bottom' = 'bottom';
    let top = rect.bottom + 8;
    if (top + estHeight > window.innerHeight - margin && rect.top > estHeight + margin) {
      placement = 'top';
      top = Math.max(margin, rect.top - estHeight - 8);
    }

    let left = rect.left + rect.width / 2 - popWidth / 2;
    if (left < margin) left = margin;
    if (left + popWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popWidth - margin);
    }

    setCoords({ top, left, placement });
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleOpenHover = () => {
    clearCloseTimer();
    computePosition();
    setOpen(true);
  };

  const handleLeaveHover = () => {
    if (pinned) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearCloseTimer();
    if (open && pinned) {
      setPinned(false);
      setOpen(false);
    } else {
      computePosition();
      setPinned(true);
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;

    // Ajuste fino após renderizar altura real do balão
    const raf = requestAnimationFrame(() => {
      const el = triggerRef.current;
      const pop = popoverRef.current;
      if (!el || !pop) return;
      const rect = el.getBoundingClientRect();
      const popRect = pop.getBoundingClientRect();
      const margin = 10;

      let placement: 'top' | 'bottom' = 'bottom';
      let top = rect.bottom + 8;
      if (top + popRect.height > window.innerHeight - margin && rect.top - popRect.height - 8 >= margin) {
        placement = 'top';
        top = rect.top - popRect.height - 8;
      } else if (top + popRect.height > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - popRect.height - margin);
      }

      let left = rect.left + rect.width / 2 - popRect.width / 2;
      if (left < margin) left = margin;
      if (left + popRect.width > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - popRect.width - margin);
      }

      setCoords({ top, left, placement });
    });

    const handleOutsideClick = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setPinned(false);
        setOpen(false);
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setPinned(false);
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      computePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open, computePosition]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const toneClasses: Record<NonNullable<HelpTooltipProps['tone']>, string> = {
    slate: 'text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800',
    indigo: 'text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60',
    emerald: 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60',
    amber: 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-950/60',
    violet: 'text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200 hover:bg-violet-100/70 dark:hover:bg-violet-950/60',
    rose: 'text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-rose-950/60',
    blue: 'text-blue-500 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-200 hover:bg-blue-100/70 dark:hover:bg-blue-950/60'
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleClick}
        onMouseEnter={handleOpenHover}
        onMouseLeave={handleLeaveHover}
        onFocus={handleOpenHover}
        onBlur={handleLeaveHover}
        aria-label={ariaLabel || (title ? `Ajuda sobre ${title}` : 'Ver explicação')}
        aria-expanded={open}
        className={`inline-flex items-center justify-center rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${toneClasses[tone]}`}
      >
        <HelpCircle className={iconSize} />
      </button>

      {open && coords && (
        <div
          ref={popoverRef}
          role="tooltip"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={handleLeaveHover}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9998,
            maxWidth: '295px',
            minWidth: '220px'
          }}
          className="bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 text-[11px] leading-relaxed p-3 rounded-xl shadow-2xl border border-sky-500/40 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-left font-normal whitespace-normal"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span>{title || 'Dica Rápida'}</span>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setPinned(false);
                setOpen(false);
              }}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors shrink-0"
              title="Fechar explicação"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-slate-200">{content}</div>
        </div>
      )}
    </span>
  );
};
