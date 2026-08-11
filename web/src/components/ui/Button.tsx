import { motion, type HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';

const variantClass: Record<Variant, string> = {
  primary:
    'bg-indigo-500 text-white hover:bg-indigo-400 disabled:hover:bg-indigo-500',
  secondary:
    'border border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800 disabled:hover:border-slate-700 disabled:hover:bg-transparent',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 disabled:hover:bg-red-500/90',
  ghost: 'text-slate-400 hover:text-white',
  success: 'bg-emerald-500/90 text-white hover:bg-emerald-500 disabled:hover:bg-emerald-500/90',
  warning: 'bg-amber-500/90 text-white hover:bg-amber-500 disabled:hover:bg-amber-500/90',
};

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
}

/** The one button in the app that actually moves via Framer Motion — every other interactive element reuses this. */
export function Button({ variant = 'primary', className = '', disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
