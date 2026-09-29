import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, Cpu, Award, Globe, Database } from 'lucide-react';

interface MetricItem {
  id: string;
  value: string;
  label: string;
  subtext: string;
  icon: React.ElementType;
  accent: string;
}

const METRICS: MetricItem[] = [
  {
    id: 'verifications',
    value: '28,450+',
    label: 'Claims Verified',
    subtext: 'Across Ghanaian news, social forwards, and regional bulletins',
    icon: CheckCircle2,
    accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'traceability',
    value: '99.4%',
    label: 'Source Traceability',
    subtext: 'Exact original publisher and timestamp localization',
    icon: Globe,
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'latency',
    value: '< 1.8s',
    label: 'Analysis Speed',
    subtext: 'High-throughput LLM reasoning with live search grounding',
    icon: Cpu,
    accent: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'registries',
    value: '140+',
    label: 'Monitored Registries',
    subtext: 'Official ministries, gazettes, health agencies & media partners',
    icon: Database,
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
  },
];

export const StatsImpactSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

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
    <section className="py-20 md:py-28 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Verified Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for National-Scale Accuracy
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Real-time metrics powering civic awareness, journalistic verification, and public trust.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.id}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-left transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${metric.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white block">
                    {metric.value}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {metric.label}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {metric.subtext}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
