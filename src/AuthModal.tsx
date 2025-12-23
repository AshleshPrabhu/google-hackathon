import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from 'sonner';
import { useNavigate } from 'react-router';


export async function saveUserToDB(user: any) {

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName ?? "",
      email: user.email,
      image: user.photoURL ?? "",
      createdAt: new Date()
    });
  }
}


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signup' }: AuthModalProps) {
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [email, setEmail] = useState<string>()
  const [password, setPassword] = useState<string>()
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  
  const onGmailLogin = async()=>{
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      await saveUserToDB(res.user);
      toast.success("Signed in successfully!");
      navigate('/dashboard');
      
    } catch (error) {
      toast.error("Error signing in with Google");
      console.error("Error signing in with Google:", error);
    }
  
  }
  
  const emailAuth = async(email: string | undefined, password: string | undefined, type:"signup"|"signin")=>{
    if(!email || !password) {
      toast.error("Please provide both email and password");
      return;
    }
    if(type==="signup"){
      try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToDB(res.user);
        toast.success("Account created successfully!");
        navigate('/dashboard');
  
  
      } catch (error) {
        toast.error("Error creating account");
        console.error("Error creating account:", error);
        
      }
    }else if(type==="signin"){
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        console.log(res);
        toast.success("Signed in successfully!");
        navigate('/dashboard');
      } catch (error) {
        toast.error("Error signing in , check if you have an account");
        console.error("Error signing in:", error);
      }
    }
  }
  useEffect(() => {
    if (isOpen) {
      setIsSignup(initialMode === 'signup');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-8 w-96 shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          {isSignup ? 'Join ReFind to start finding lost items' : 'Sign in to your ReFind account'}
        </p>

        <div className="space-y-3 mb-6">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all duration-300"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-300 p-1 hover:bg-slate-700/50 rounded-md"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* {isSignup && (
            <input
              type="password"
              placeholder="Confirm password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all duration-300"
            />
          )} */}
        </div>

        <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 mb-4 shadow-lg shadow-blue-500/20" 
        onClick={()=>emailAuth(email,password,isSignup?"signup":"signin")}
        
        >
          {isSignup ? 'Create Account' : 'Sign In'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-slate-950 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={onGmailLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-slate-900 font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center border-t border-slate-700 pt-6">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <span className="text-blue-400 hover:text-blue-300 font-semibold">
              {isSignup ? 'Sign in' : 'Sign up'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
