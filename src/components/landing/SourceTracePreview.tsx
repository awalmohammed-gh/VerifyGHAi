import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Share2,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TraceStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'SUBMITTED' | 'ORIGIN' | 'REGISTRY' | 'VERDICT';
  sourceName: string;
  domain: string;
  status: 'pending' | 'origin' | 'official' | 'counter';
  description: string;
  badgeText: string;
  badgeColor: string;
}

const TRACE_STEPS: TraceStep[] = [
  {
    id: 'step-1',
    stepNumber: '01',
    title: 'Circulating Claim Ingested',
    subtitle: 'Viral WhatsApp audio and Telegram circular',
    time: '08:14 GMT',
    type: 'SUBMITTED',
    sourceName: 'Encrypted Telegram Channel',
    domain: 't.me/gh-placement-admit',
    status: 'origin',
    description: 'Claim circulated: "Ministry of Education waives all 2026 placement verification fees via external portal".',
    badgeText: 'Viral Ingestion',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'step-2',
    stepNumber: '02',
    title: 'Earliest Source Traced',
    subtitle: 'First publication timestamp localized',
    time: '08:42 GMT (+28m)',
    type: 'ORIGIN',
    sourceName: 'Unregistered Blog Domain',
    domain: 'ghana-education-portal.online',
    status: 'counter',
    description: 'Autonomous crawler discovered root domain registered 48 hours prior with anonymous proxy whois and zero institutional affiliation.',
    badgeText: 'Synthetic Origin',
    badgeColor: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'step-3',
    stepNumber: '03',
    title: 'Institutional Registry Cross-Check',
    subtitle: 'Government gazettes & authenticated records',
    time: '08:43 GMT (+1m)',
    type: 'REGISTRY',
    sourceName: 'Ghana Education Service (GES)',
    domain: 'ges.gov.gh',
    status: 'official',
    description: 'Live API query to GES Public Advisory API confirmed active official alert warning the public against placement fee scams.',
    badgeText: 'Official Authority',
    badgeColor: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'step-4',
    stepNumber: '04',
    title: 'Evidence Synthesis & Verdict',
    subtitle: 'Automated claim decomposition & risk rating',
    time: '08:44 GMT (+1s)',
    type: 'VERDICT',
    sourceName: 'VerifAI GH Multi-Engine Verdict',
    domain: 'verifai.gov.gh/trace/gh-2026',
    status: 'official',
    description: '100% contradiction rate against official records. High urgency phishing flags detected with 98% model confidence.',
    badgeText: 'Verified Refutation',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
];

export const SourceTracePreview: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
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
    <section
      id="provenance-trace"
      className="py-20 md:py-28 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-[#090D16] dark:via-slate-900/30 dark:to-[#090D16]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Interactive Provenance Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How VerifAI Traces Claims to Their Origin
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            From the earliest anonymous forward to verified national registries, our forensic pipeline chronologically reconstructs the exact evidence trail.
          </p>
        </motion.div>

        {/* Timeline Visualization Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-8">
          {/* Top Bar of Provenance Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Live Forensic Trail
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Ghana Education Service Admissions Circular
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Traceability Score: 99.2%
              </span>
            </div>
          </div>

          {/* Timeline Nodes Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 relative"
          >
            {TRACE_STEPS.map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <motion.div
                  key={step.id}
                  variants={itemVariants}
                  whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 text-left relative flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/60 dark:border-blue-400/60 ring-2 ring-blue-500/20 shadow-md'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                        {step.stepNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${step.badgeColor}`}>
                        {step.badgeText}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {step.title}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {step.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {step.time}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {isSelected ? 'Inspecting' : 'View'} →
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Active Step Deep-Dive Inspector */}
          <motion.div
            key={activeStepIndex}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                  Node Details: {TRACE_STEPS[activeStepIndex].title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>Domain: {TRACE_STEPS[activeStepIndex].domain}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {TRACE_STEPS[activeStepIndex].description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-800 text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Source Integrity: Verified SHA-256 Digest</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Cross-Referenced: 12 Fact-Checking Databases</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
