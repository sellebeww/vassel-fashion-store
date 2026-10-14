import React from 'react';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: 'fade-up' | 'fade-in' | 'fade-down' | 'scale-subtle';
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: number;
}

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.8,
  className = '',
  staggerChildren,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants: Record<string, Variants> = {
    'fade-up': {
      hidden: { opacity: 0, y: 28 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: LUXURY_EASE,
          staggerChildren,
        },
      },
    },
    'fade-down': {
      hidden: { opacity: 0, y: -20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          delay,
          ease: LUXURY_EASE,
          staggerChildren,
        },
      },
    },
    'fade-in': {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration,
          delay,
          ease: LUXURY_EASE,
          staggerChildren,
        },
      },
    },
    'scale-subtle': {
      hidden: { opacity: 0, scale: 0.97 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration,
          delay,
          ease: LUXURY_EASE,
          staggerChildren,
        },
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={variants[variant]}
      className={className}
    >
      {children}
    </motion.div>
  );
};
