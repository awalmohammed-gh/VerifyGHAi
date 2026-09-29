import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';

export const PublicNavbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.header
      initial={{ y: shouldReduceMotion ? 0 : -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/90 dark:border-slate-800/90 shadow-sm'
          : 'bg-white/60 dark:bg-[#090D16]/60 backdrop-blur-xs border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo with hover animation */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.05, rotate: 2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </motion.div>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            VerifAI <span className="text-blue-600 font-black">GH</span>
          </span>
        </Link>

        {/* Right: Theme Toggle & Log In / Get Started */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle size="sm" />

          {isAuthenticated ? (
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            >
              <Link to="/verify">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Dashboard
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <motion.div
                whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              >
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
