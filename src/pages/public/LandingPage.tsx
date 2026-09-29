import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  FileSearch,
  Sparkles,
  History,
  Scale,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { LandingHero } from '../../components/landing/LandingHero';
import { StatsImpactSection } from '../../components/landing/StatsImpactSection';
import { RecentVerifications } from '../../components/landing/RecentVerifications';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const ctaTarget = isAuthenticated ? '/verify' : '/register';
  const shouldReduceMotion = useReducedMotion();

  // Stagger Container Variants for Grid Sections
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.14,
        delayChildren: 0.1,
      },
    },
  };

  // Spring Physics for Individual Cards
  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
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

  return (
    <div className="w-full text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 overflow-hidden">
      {/* 1. HERO SECTION */}
      <LandingHero />

      {/* 2. STATS & FORENSIC IMPACT SECTION */}
      <StatsImpactSection />

      {/* 3. LIVE RECENT VERIFICATIONS CAROUSEL & CLAIMS FEED */}
      <RecentVerifications />

      {/* 4. CORE FEATURES SECTION (Scroll-Triggered Spring Animations) */}
      <section className="py-20 md:py-28 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Core Features
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Everything you need to evaluate claims with forensic confidence.
            </p>
          </motion.div>

          <motion.div
            variants={gridContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Card 1 */}
            <motion.div
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.01 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 text-left transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI-Assisted Analysis
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Analyze information and identify relevant claims using search grounding and linguistic inspection.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.01 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 text-left transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Evidence & Sources
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                See the sources and evidence behind an assessment, complete with citations and publisher ratings.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.01 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 text-left transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Credibility Score
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Understand the overall credibility assessment through standardized 0–100 scores and risk tiers.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div
              variants={cardVariants}
              whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.01 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 text-left transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Verification History & Collections
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Keep track of your previous verifications, export PDF forensic dossiers, and organize findings into folders.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION SECTION */}
      <section className="py-20 md:py-28 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Not sure if it's true? <br />
            <span className="text-blue-600 dark:text-blue-400">Verify it in seconds.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Get instant clarity with explainable AI fact verification grounded in verified national registries.
          </p>

          <div className="pt-2 flex justify-center">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link to={ctaTarget}>
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-xl shadow-blue-500/25 px-8"
                >
                  Start Verifying Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
