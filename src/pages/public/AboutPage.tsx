import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Target, Heart, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
          About VerifAI GH
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Protecting Public Truth in the Digital Age
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          VerifAI GH was created to empower citizens, journalists, and researchers with transparent,
          explainable tools to counter online disinformation and malicious forwards.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-3xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To provide instantaneous, transparent, and evidence-grounded credibility assessments for
            news stories, social broadcasts, and digital media in Ghana and West Africa, promoting
            critical media literacy without censorship.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Core Principles</h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Explainability:</strong> No opaque scores; every rating has justification.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Evidence-First:</strong> Prioritize official gazettes and peer-reviewed studies.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span><strong>Responsible Action:</strong> Encourage verification over sensational condemnation.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Disinformation Landscape in Ghana */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200/90 p-8 lg:p-10 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Addressing the Information Landscape
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          From misleading WhatsApp audio notes during election cycles to unverified herbal health cures
          and fake employment recruitment schemes, viral misinformation spreads rapidly across
          social networks. VerifAI GH serves as a rapid preliminary sanity check, helping citizens
          identify clickbait patterns, check domain histories, and access verified fact-check
          bulletins before forwarding.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Ready to explore the platform?</h3>
        <div className="flex justify-center gap-3">
          <Link to="/verify">
            <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Try Content Verification
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline" size="md">
              Learn How It Works
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
