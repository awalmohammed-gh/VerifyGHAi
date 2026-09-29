import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FileText,
  Cpu,
  Globe,
  Database,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const HowItWorksPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      num: '01',
      title: 'Submit Content',
      desc: 'Paste a raw text snippet, submit an online article URL, or upload a social flyer image.',
      icon: FileText,
    },
    {
      num: '02',
      title: 'Linguistic & Indicator Analysis',
      desc: 'Our engine evaluates sensationalism, clickbait headlines, urgency triggers, and unsupported scientific claims.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Domain & Source Track Record',
      desc: 'Cross-references our curated registry of media publishers, known disinformation blogs, and institutional domains.',
      icon: Globe,
    },
    {
      num: '04',
      title: 'Fact-Check & Evidence Matching',
      desc: 'Retrieves relevant advisories and verified fact-checks from public records and research archives.',
      icon: Database,
    },
    {
      num: '05',
      title: 'Explainable Score & Recommendation',
      desc: 'Synthesizes all weighted parameters into an intuitive 0–100 score with step-by-step reasoning and safe sharing guidance.',
      icon: ShieldCheck,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: 0.1,
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-3xl mx-auto space-y-4"
      >
        <span className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider font-mono">
          Verification Pipeline
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          How VerifAI GH Analyzes Content
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Explore the 5-step analytical methodology behind our credibility scores, from raw token
          parsing to evidence cross-referencing.
        </p>
      </motion.div>

      {/* Steps List with Staggered Scroll Reveal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="space-y-6"
      >
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              variants={itemVariants}
              whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.005 }}
              className="p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row items-start gap-6 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                <Icon className="w-7 h-7" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                    STEP {step.num}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Scoring Rubric */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-slate-900 text-white p-8 lg:p-10 space-y-6 border border-slate-800"
      >
        <h3 className="text-xl font-bold">Understanding the 0–100 Credibility Scale</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30">
            <span className="text-emerald-400 font-extrabold block text-sm mb-1">85 – 100</span>
            <span className="font-bold text-white uppercase block mb-1">VERIFIED</span>
            <p className="text-slate-400">Supported by official releases or empirical publications.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-blue-500/30">
            <span className="text-blue-400 font-extrabold block text-sm mb-1">70 – 84</span>
            <span className="font-bold text-white uppercase block mb-1">TRUSTED</span>
            <p className="text-slate-400">Credible publisher with balanced, neutral presentation.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-500/30">
            <span className="text-amber-400 font-extrabold block text-sm mb-1">40 – 69</span>
            <span className="font-bold text-white uppercase block mb-1">SUSPICIOUS</span>
            <p className="text-slate-400">Sensationalist indicators or missing citations present.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-rose-500/30">
            <span className="text-rose-400 font-extrabold block text-sm mb-1">0 – 39</span>
            <span className="font-bold text-white uppercase block mb-1">FAKE</span>
            <p className="text-slate-400">Refuted claims or known fabricated viral forwards.</p>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center pt-6 space-y-4"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Try a sample verification now</h3>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          className="inline-block"
        >
          <Link to="/verify">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Verification Form
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
