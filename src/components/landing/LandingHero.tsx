import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const LandingHero: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const ctaTarget = isAuthenticated ? '/verify' : '/register';
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30, scale: shouldReduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 18,
        delay: shouldReduceMotion ? 0 : 0.35,
      },
    },
  };

  return (
    <section
      id="hero"
      className="relative pt-12 pb-20 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32 overflow-hidden border-b border-slate-100 dark:border-slate-800/80"
    >
      {/* Background ambient lighting */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-blue-500/10 dark:bg-blue-600/15 blur-3xl -z-10 pointer-events-none rounded-full"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Centered Headline, Description, and CTA Buttons (Staggered) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Eyebrow / Trust Pill */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Next-Gen Forensic Fact Verification for Ghana</span>
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]"
          >
            Verify Before You <span className="text-blue-600 dark:text-blue-400">Share.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto"
          >
            AI-assisted information verification that helps you analyze claims, examine evidence, and understand the credibility of information.
          </motion.p>

          {/* Centered CTA Buttons with hover scale effects */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link to={ctaTarget}>
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-lg shadow-blue-500/20"
                >
                  Start Verifying
                </Button>
              </Link>
            </motion.div>

          </motion.div>
        </motion.div>

        {/* Centered Visual Verification Result UI Mockup with floating motion */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="mt-12 sm:mt-16 flex justify-center"
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-7 space-y-5 text-left transition-all"
          >
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Verification Result
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-400">AI Evaluated</span>
              </div>
            </div>

            {/* Verdict Badge */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-extrabold text-sm text-amber-900 dark:text-amber-300 tracking-wide">
                  SUSPICIOUS
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                Needs Context
              </span>
            </div>

            {/* Scores Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Credibility
                </span>
                <span className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  42<span className="text-xs text-slate-400 font-sans font-normal">/100</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Confidence
                </span>
                <span className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-0.5 block">
                  87%
                </span>
              </div>
            </div>

            {/* Evidence Found Summary */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                Evidence Found
              </span>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Supporting regional sources identified</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Conflicting public statements detected</span>
                </div>
              </div>
            </div>

            {/* Mockup Action Link */}
            <Link
              to={ctaTarget}
              className="w-full flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 pt-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span>View Full Verification Analysis →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
