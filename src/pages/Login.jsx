import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Users, Sprout, Calendar, TrendingUp, Wheat, BarChart3, Lock, Mail } from 'lucide-react';
import { getStoredAuth, loginWithCredentials } from '../services/api';

const AgricultureHRGraphic = () => (
  <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
    <div className="absolute top-[-20%] left-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-[#A5D6A7]/10 rounded-full blur-3xl"></div>
    
    <div className="absolute top-10 right-10 opacity-30">
      <Sprout size={64} className="text-white/60" />
    </div>
    <div className="absolute bottom-10 left-10 opacity-30 rotate-45">
      <Wheat size={64} className="text-white/40" />
    </div>

    <div className="relative flex flex-col items-center gap-8 z-10">
      <div className="relative w-56 h-56">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
        <div className="absolute inset-4 border-2 border-white/15 rounded-full"></div>
        <div className="absolute inset-8 bg-white/10 rounded-full flex flex-col items-center justify-center backdrop-blur-sm">
          <Wheat size={48} className="text-white/80 mb-2" />
          <span className="text-white/80 font-bold text-sm">HARVEST</span>
          <span className="text-white/60 text-xs">2024</span>
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 px-3 flex items-center gap-2">
          <Users size={14} className="text-[#2E7D32]" />
          <span className="text-xs font-bold text-[#1B1B1B]">128 Workers</span>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-2 px-3 flex items-center gap-2">
          <Sprout size={14} className="text-[#2E7D32]" />
          <span className="text-xs font-bold text-[#1B1B1B]">45 Active Fields</span>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 px-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A5D6A7]/40 flex items-center justify-center">
              <TrendingUp size={18} className="text-[#2E7D32]" />
            </div>
            <div>
              <p className="text-xs text-[#6D4C41]">Yield vs Target</p>
              <p className="text-xl font-bold text-[#1B1B1B]">+18.5%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 px-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A5D6A7]/40 flex items-center justify-center">
              <Calendar size={18} className="text-[#2E7D32]" />
            </div>
            <div>
              <p className="text-xs text-[#6D4C41]">Season Progress</p>
              <p className="text-xl font-bold text-[#1B1B1B]">72%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#6D4C41]" />
            <span className="text-sm font-semibold text-[#1B1B1B]">HR Summary</span>
          </div>
          <BarChart3 size={16} className="text-[#2E7D32]" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#6D4C41]">Present Today</span>
            <span className="font-bold text-[#1B1B1B]">112 / 128</span>
          </div>
          <div className="w-full bg-[#A5D6A7]/40 rounded-full h-1.5">
            <div className="bg-[#2E7D32] h-1.5 rounded-full w-[87.5%]"></div>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-[#6D4C41]">New Hires (Oct)</span>
            <span className="font-bold text-[#1B1B1B]">+8</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.username && auth?.password) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await loginWithCredentials({ username, password, remember: rememberMe });
      navigate('/');
    } catch (loginError) {
      setError(loginError?.message || 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#F5F1E8]">
      
      {/* Left Panel - Dark Green */}
      <div className="hidden lg:flex bg-[#1B5E20] flex-col relative" style={{ width: '58%', flexShrink: 0 }}>
        
        {/* Top Logo/Brand */}
        <div className="absolute top-8 left-8 z-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Leaf size={20} className="text-[#1B5E20]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">AgriCare</p>
              <p className="text-white/60 text-xs">Farm Management System</p>
            </div>
          </div>
        </div>
        
        {/* Main Graphic */}
        <AgricultureHRGraphic />
        
        {/* Bottom Quote */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-20">
          <p className="text-white/60 text-sm italic">"Growing Better Farms Through Smart Management"</p>
        </div>

        {/* Organic blob border — overlaps into the right panel */}
        <div className="absolute top-0 right-0 h-full pointer-events-none z-30" style={{ width: '80px', transform: 'translateX(50%)' }}>
          <svg
            className="h-full w-full"
            viewBox="0 0 80 900"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main blob fill — cream colored to match right panel */}
            <path
              d="M80,0 
                 L0,0 
                 C20,60 35,120 15,180 
                 C-5,240 -10,300 10,360 
                 C30,420 40,480 20,540 
                 C0,600 -15,660 5,720 
                 C25,780 35,840 0,900 
                 L80,900 Z"
              fill="#F5F1E8"
            />
            {/* Subtle highlight stroke along the blob edge */}
            <path
              d="M0,0 
                 C20,60 35,120 15,180 
                 C-5,240 -10,300 10,360 
                 C30,420 40,480 20,540 
                 C0,600 -15,660 5,720 
                 C25,780 35,840 0,900"
              stroke="#D4C5B0"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 bg-[#F5F1E8] relative flex-1">

        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-[#1B5E20] rounded-2xl flex items-center justify-center">
                <Leaf size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[#1B1B1B] font-bold text-lg">AgriCare</p>
                <p className="text-[#6D4C41] text-xs">Farm Management System</p>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-[#1B1B1B] mb-2">Welcome back</h1>
            <p className="text-[#6D4C41]">
              Sign in using the API credentials from your backend,<br className="hidden sm:block" />
              then continue to manage farm operations and workforce data.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-2">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6D4C41] w-4 h-4" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-[#D4C5B0] rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent bg-white"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B1B1B] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6D4C41] w-4 h-4" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#D4C5B0] rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#D4C5B0] text-[#1B5E20] focus:ring-[#1B5E20]"
                />
                <span className="text-sm text-[#6D4C41]">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[#1B5E20] hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#1B5E20] hover:bg-[#0D3B12] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}