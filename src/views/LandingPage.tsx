import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Target, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function LandingPage() {
  const { currentUser } = useAppContext();

  if (currentUser) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center overflow-x-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
      
      {/* Navbar */}
      <header className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight"><span className="text-primary">AVO</span>RA</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#why" className="hover:text-white transition-colors">Why us</a>
        </nav>
        <Link 
          to="/onboarding" 
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium backdrop-blur-sm border border-white/10"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center px-6 py-20 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8 border border-primary/20"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Join 2,000+ founders & builders
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 max-w-4xl"
        >
          Find The People Who Will Build Your Startup With You
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl"
        >
          Connect with founders, developers, designers, marketers, and innovators who want to create meaningful startups.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link 
            to="/auth" 
            className="px-8 py-4 rounded-full bg-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 text-white font-bold tracking-wide flex items-center justify-center gap-2 transition-transform group"
          >
            Find Your Team <ArrowRight className="w-5 h-5 transition-transform" />
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24 text-left"
        >
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-white">Curated Network</h3>
            <p className="text-white/60 text-sm leading-relaxed">Skip the noise of traditional job boards. Everyone here wants to build or join a high-growth startup.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4 text-accent">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-white">Precise Matching</h3>
            <p className="text-white/60 text-sm leading-relaxed">Our logic connects you with technical and non-technical talent with complementary skills and matching commitments.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-white">Swipe & Connect</h3>
            <p className="text-white/60 text-sm leading-relaxed">Review profiles quickly, request connections, and start building. It’s that simple.</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <p>&copy; {new Date().getFullYear()} Avora. All rights reserved.</p>
      </footer>
    </div>
  );
}
