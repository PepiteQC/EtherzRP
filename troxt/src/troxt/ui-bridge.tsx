/**
 * troxt/ui — drop-in replacement pour `@blinkdotnew/ui`.
 *
 * Composants React minimalistes, sans dépendance externe. Le style suit
 * une palette "EtherWorld" (cyan/violet sur fond sombre).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─────────────────────────────────────────────────────────
//  PALETTE
// ─────────────────────────────────────────────────────────
const palette = {
  bg:       '#0b0e14',
  panel:    '#11161f',
  panel2:   '#161c26',
  border:   '#1f2733',
  text:     '#e6ecf3',
  muted:    '#8a95a6',
  primary:  '#5cf2ff',
  primary2: '#8a6cff',
  danger:   '#ff5577',
  warn:     '#ffb454',
  ok:       '#5cff9c',
} as const;

const cssVars: React.CSSProperties = {
  ['--t-bg' as any]:       palette.bg,
  ['--t-panel' as any]:    palette.panel,
  ['--t-panel2' as any]:   palette.panel2,
  ['--t-border' as any]:   palette.border,
  ['--t-text' as any]:     palette.text,
  ['--t-muted' as any]:    palette.muted,
  ['--t-primary' as any]:  palette.primary,
  ['--t-primary2' as any]: palette.primary2,
  ['--t-danger' as any]:   palette.danger,
  ['--t-warn' as any]:     palette.warn,
  ['--t-ok' as any]:       palette.ok,
};

// ─────────────────────────────────────────────────────────
//  CARD
// ─────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  footer?: React.ReactNode;
}
export function Card({ title, footer, children, style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background: 'var(--t-panel)',
        border: '1px solid var(--t-border)',
        borderRadius: 12,
        padding: 16,
        color: 'var(--t-text)',
        ...cssVars,
        ...style,
      }}
    >
      {title && (
        <div style={{
          fontWeight: 600,
          marginBottom: 12,
          color: 'var(--t-text)',
        }}>{title}</div>
      )}
      <div>{children}</div>
      {footer && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--t-border)',
          color: 'var(--t-muted)',
          fontSize: 12,
        }}>{footer}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  BUTTON
// ─────────────────────────────────────────────────────────
export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
}
export function Button({
  variant = 'default',
  size = 'md',
  style,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '4px 10px', fontSize: 12, borderRadius: 6 },
    md: { padding: '8px 14px', fontSize: 14, borderRadius: 8 },
    lg: { padding: '12px 20px', fontSize: 16, borderRadius: 10 },
  };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    default: {
      background: 'linear-gradient(180deg, var(--t-primary), var(--t-primary2))',
      color: '#0a0d12',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--t-text)',
      border: '1px solid var(--t-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--t-muted)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'var(--t-danger)',
      color: '#1a0608',
      border: 'none',
    },
  };
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        ...cssVars,
        ...sizes[size],
        ...variants[variant],
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 80ms ease, opacity 80ms ease',
        ...style,
      }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────────────────────
//  SLIDER
// ─────────────────────────────────────────────────────────
export interface SliderProps {
  value:    number;
  min?:     number;
  max?:     number;
  step?:    number;
  onChange: (value: number) => void;
  label?:   string;
  style?:   React.CSSProperties;
}
export function Slider({ value, min = 0, max = 100, step = 1, onChange, label, style }: SliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 12, color: 'var(--t-muted)' }}>{label}</label>}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          accentColor: 'var(--t-primary)',
          width: '100%',
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--t-muted)', textAlign: 'right' }}>
        {value} / {max}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  PROGRESS
// ─────────────────────────────────────────────────────────
export interface ProgressProps {
  value:     number;            // 0..100
  height?:   number;
  style?:    React.CSSProperties;
  showLabel?: boolean;
}
export function Progress({ value, height = 6, style, showLabel = false }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{ width: '100%', ...style }}>
      {showLabel && (
        <div style={{
          fontSize: 11,
          color: 'var(--t-muted)',
          marginBottom: 4,
          textAlign: 'right',
        }}>{clamped.toFixed(0)}%</div>
      )}
      <div style={{
        height,
        background: 'var(--t-panel2)',
        borderRadius: height,
        overflow: 'hidden',
        border: '1px solid var(--t-border)',
      }}>
        <div style={{
          width: `${clamped}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--t-primary), var(--t-primary2))',
          transition: 'width 200ms ease',
        }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  BADGE
// ─────────────────────────────────────────────────────────
export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'danger' | 'ok' | 'warn';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}
export function Badge({ variant = 'default', style, children, ...rest }: BadgeProps) {
  const variants: Record<BadgeVariant, React.CSSProperties> = {
    default:   { background: 'var(--t-primary)', color: '#0a0d12' },
    secondary: { background: 'var(--t-panel2)',  color: 'var(--t-text)' },
    outline:   { background: 'transparent',      color: 'var(--t-text)', border: '1px solid var(--t-border)' },
    danger:    { background: 'var(--t-danger)',  color: '#1a0608' },
    ok:        { background: 'var(--t-ok)',      color: '#061a0d' },
    warn:      { background: 'var(--t-warn)',    color: '#1a1006' },
  };
  return (
    <span
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        ...cssVars,
        ...variants[variant],
        ...style,
      }}
    >{children}</span>
  );
}

// ─────────────────────────────────────────────────────────
//  TOAST SYSTEM
// ─────────────────────────────────────────────────────────
type ToastKind = 'info' | 'success' | 'error' | 'warn';
interface ToastItem {
  id:     string;
  kind:   ToastKind;
  text:   string;
  ttlMs:  number;
}

interface ToastApi {
  info:    (msg: string, ttlMs?: number) => void;
  success: (msg: string, ttlMs?: number) => void;
  error:   (msg: string, ttlMs?: number) => void;
  warn:    (msg: string, ttlMs?: number) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast hors <ToastProvider>');
  return ctx;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}
export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const remove = useCallback((id: string) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((kind: ToastKind, text: string, ttlMs = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((arr) => [...arr, { id, kind, text, ttlMs }]);
    const handle = window.setTimeout(() => remove(id), ttlMs);
    timers.current.set(id, handle);
  }, [remove]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const h of map.values()) window.clearTimeout(h);
      map.clear();
    };
  }, []);

  const api: ToastApi = {
    info:    (m, t) => push('info', m, t),
    success: (m, t) => push('success', m, t),
    error:   (m, t) => push('error', m, t),
    warn:    (m, t) => push('warn', m, t),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
        ...cssVars,
      }}>
        {items.map((t) => {
          const colors: Record<ToastKind, React.CSSProperties> = {
            info:    { borderLeft: '3px solid var(--t-primary)' },
            success: { borderLeft: '3px solid var(--t-ok)' },
            error:   { borderLeft: '3px solid var(--t-danger)' },
            warn:    { borderLeft: '3px solid var(--t-warn)' },
          };
          return (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              style={{
                background: 'var(--t-panel)',
                color: 'var(--t-text)',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--t-border)',
                fontSize: 13,
                minWidth: 220,
                maxWidth: 360,
                cursor: 'pointer',
                pointerEvents: 'auto',
                ...colors[t.kind],
              }}
            >{t.text}</div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/**
 * Helper importable sans React : pour les modules non-React qui veulent
 * quand même un toast. On garde une référence globale vers l'API.
 */
let globalToast: ToastApi | null = null;
export function bindGlobalToast(api: ToastApi): void {
  globalToast = api;
}
export const toast: ToastApi = {
  info:    (m, t) => globalToast?.info(m, t) ?? console.info('[troxt.toast]', m),
  success: (m, t) => globalToast?.success(m, t) ?? console.log('[troxt.toast]', m),
  error:   (m, t) => globalToast?.error(m, t) ?? console.error('[troxt.toast]', m),
  warn:    (m, t) => globalToast?.warn(m, t) ?? console.warn('[troxt.toast]', m),
};
