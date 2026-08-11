import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Every page's root wrapper — the one page-level motion touch, kept identical everywhere on purpose. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/** Wrap a list's container in this, and each item in <StaggerItem>, for a staggered reveal. */
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
