import { ArrowRight } from 'lucide-react';

interface HeaderProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export default function Header({ onGetStarted, onSignIn }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent">
      <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <span className="text-2xl font-bold text-white">ReFind</span>

        <nav className="hidden md:flex items-center gap-12">
          <button className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
            Features
          </button>
          <button className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
            Demo
          </button>
          <button className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">
            About
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={onSignIn}
            className="hidden md:block text-gray-300 hover:text-white transition-colors duration-300 font-medium"
          >
            Sign in
          </button>
          <button 
            onClick={onGetStarted}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
