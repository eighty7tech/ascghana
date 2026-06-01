'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Zap } from 'lucide-react';

export default function HeroSection() {
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => (prev < 12500 ? prev + 85 : prev));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-arsenal-navy via-black to-arsenal-red/10">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-arsenal-red/20 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-arsenal-gold/10 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arsenal-red/10 border border-arsenal-red/30 mb-8">
            <span className="live-dot" />
            <span className="text-sm font-semibold text-arsenal-red">OFFICIALLY APPROVED BY ARSENAL FC</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight">
            Arsenal
            <br />
            <span className="text-gradient-red">Supporters Club</span>
            <br />
            Ghana
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-body">
            Join the Official Ghana Gooners. Founded 2003, uniting Arsenal fans across West Africa since our inception.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-arsenal-gold" />
              <div className="text-left">
                <p className="text-sm text-gray-400">Active Members</p>
                <p className="text-3xl font-bold text-white">{liveCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-arsenal-red/50 to-transparent" />
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-arsenal-gold" />
              <div className="text-left">
                <p className="text-sm text-gray-400">Since 2003</p>
                <p className="text-3xl font-bold text-white">23 Years</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/membership/apply" className="btn-arsenal">
              Join Membership
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/events" className="btn-arsenal-outline">
              Upcoming Events
            </Link>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Scroll to explore</p>
            <div className="w-6 h-10 border-2 border-arsenal-red/50 rounded-full flex items-center justify-center">
              <div className="w-1 h-2 bg-arsenal-red rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
