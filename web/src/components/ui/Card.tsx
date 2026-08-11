import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
}

export function Card({ hover = false, className = '', children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, borderColor: 'rgb(71 85 105)' } : undefined}
      transition={{ duration: 0.15 }}
      className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
