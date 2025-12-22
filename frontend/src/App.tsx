import { ArrowRight, Package, Key, Wallet, Droplet, Headphones, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import AuthModal from './AuthModal';

function AnimatedItem({ icon: Icon, label, delay }) {
  return (
    <div
      className="absolute animate-float"
      style={{
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-4 rounded-lg shadow-lg shadow-blue-500/40 backdrop-blur-sm border border-blue-300/30">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <span className="text-xs text-gray-300">{label}</span>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const handleGmailLogin = () => {
    setAuthModalOpen(false);
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <style>{`
        @keyframes burst {
          0% {
            transform: translateY(60px) translateX(var(--tx, 0px)) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(60px) translateX(var(--tx, 0px)) scale(0.8);
          }
          40% {
            transform: translateY(var(--ty, -150px)) translateX(var(--tx, 0px)) rotate(12deg) scale(1);
            opacity: 1;
          }
          85% {
            opacity: 1;
            transform: translateY(calc(var(--ty, -150px) - 80px)) translateX(var(--tx, 0px)) rotate(20deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(calc(var(--ty, -150px) - 120px)) translateX(var(--tx, 0px)) rotate(25deg) scale(0.9);
          }
        }

        .animate-burst {
          animation: burst 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        .box-perspective {
          perspective: 1200px;
        }

        .box-3d-container {
          width: 280px;
          height: 200px;
          transform-style: preserve-3d;
          animation: gentleRock 8s linear infinite;
          position: relative;
        }

        @keyframes gentleRock {
          0%, 100% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
        }

        .cube-face {
          position: absolute;
          width: 280px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          border: 3px solid #8b6914;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .cube-front {
          background: linear-gradient(135deg, #d4a574 0%, #c9932d 30%, #b8823a 60%, #a0733d 100%);
          transform: translateZ(100px);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .cube-front::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.05) 2px, rgba(0,0,0,.05) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.05) 2px, rgba(0,0,0,.05) 4px);
          pointer-events: none;
        }

        .box-label {
          position: absolute;
          width: 220px;
          height: 100px;
          background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 50%, #f0f0f0 100%);
          border: 3px dashed #8b6914;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10;
          left: 50%;
          top: 50%;
          transform: translateX(-50%) translateY(-50%);
        }

        .box-label-text {
          font-weight: 900;
          color: #333;
          font-size: 22px;
          letter-spacing: 2px;
          text-transform: uppercase;
          line-height: 1.2;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .cube-back {
          background: linear-gradient(135deg, #b8823a 0%, #a0733d 50%, #8a6633 100%);
          transform: rotateY(180deg) translateZ(100px);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.4);
        }

        .cube-right {
          background: linear-gradient(135deg, #d4a574 0%, #c9932d 50%, #b8823a 100%);
          transform: rotateY(90deg) translateZ(100px);
          box-shadow: inset -10px 0 20px rgba(0, 0, 0, 0.3);
        }

        .cube-left {
          background: linear-gradient(135deg, #b8823a 0%, #a0733d 50%, #8a6633 100%);
          transform: rotateY(-90deg) translateZ(100px);
          box-shadow: inset 10px 0 20px rgba(0, 0, 0, 0.4);
        }

        .cube-top {
          background: linear-gradient(135deg, #e0b46f 0%, #d4a574 50%, #c9932d 100%);
          transform: rotateX(90deg) translateZ(100px);
          box-shadow: inset 0 -10px 20px rgba(0, 0, 0, 0.2);
          border-top: 3px solid #a0a040;
        }

        .cube-bottom {
          background: linear-gradient(135deg, #8a6633 0%, #7a5633 50%, #6a4623 100%);
          transform: rotateX(-90deg) translateZ(100px);
          box-shadow: inset 0 10px 20px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      <Header onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onGmailLogin={handleGmailLogin}
        initialMode={authMode}
      />

      <div className="min-h-screen flex items-center justify-center px-6 pt-40">
        <div className="grid grid-cols-2 gap-12 max-w-6xl w-full items-center">
          {/* Left side - Box with animated items */}
          <div className="flex items-center justify-center relative h-96 box-perspective pt-20">
            {/* 3D Cube Box */}
            <div className="relative box-3d-container">
              {/* Cube Faces */}
              <div className="cube-face cube-front">
                <div className="box-label">
                  <div className="box-label-text">LOST &<br/>FOUND</div>
                </div>
              </div>
              <div className="cube-face cube-back"></div>
              <div className="cube-face cube-right"></div>
              <div className="cube-face cube-left"></div>
              <div className="cube-face cube-top"></div>
              <div className="cube-face cube-bottom"></div>

              {/* Items bursting out */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Key - Top Left */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '0s', '--tx': '-80px', '--ty': '-180px' } as any}
                >
                  <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-lg shadow-lg shadow-orange-500/50 border border-orange-300/30 hover:scale-110 transition-transform">
                    <Key className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Wallet - Top Right */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '0.4s', '--tx': '80px', '--ty': '-180px' } as any}
                >
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-lg shadow-lg shadow-purple-500/50 border border-purple-300/30 hover:scale-110 transition-transform">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Water Bottle - Middle Left */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '0.8s', '--tx': '-50px', '--ty': '-220px' } as any}
                >
                  <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 p-3 rounded-lg shadow-lg shadow-cyan-500/50 border border-cyan-300/30 hover:scale-110 transition-transform">
                    <Droplet className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Earphones - Middle Right */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '1.2s', '--tx': '50px', '--ty': '-220px' } as any}
                >
                  <div className="bg-gradient-to-br from-red-400 to-red-600 p-3 rounded-lg shadow-lg shadow-red-500/50 border border-red-300/30 hover:scale-110 transition-transform">
                    <Headphones className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* ID Card - Center High */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '1.6s', '--tx': '0px', '--ty': '-260px' } as any}
                >
                  <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-lg shadow-lg shadow-emerald-500/50 border border-emerald-300/30 hover:scale-110 transition-transform">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Package - Bottom Center */}
                <div
                  className="absolute left-1/2 bottom-1/3 -translate-x-1/2 animate-burst"
                  style={{ animationDelay: '2s', '--tx': '-120px', '--ty': '-150px' } as any}
                >
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-lg shadow-lg shadow-blue-500/50 border border-blue-300/30 hover:scale-110 transition-transform">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Hero content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                Lost something?
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                  ReFind gets it back.
                </span>
              </h1>

              <p className="text-xl text-gray-400 leading-relaxed">
                AI-driven matching that makes campus life easier. Find your lost items and help others recover theirs—all in one place.
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={handleGetStarted}
                className="group relative inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg text-white font-semibold shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105"
              >
                <span>Get started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <button className="px-8 py-3 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold rounded-lg transition-all duration-300">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
