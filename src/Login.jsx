import React, { useState, useEffect } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, AlertCircle, Loader2, Zap, Check } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  
  // Redis validation states
  const [emailError, setEmailError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Clear errors when switching modes
  useEffect(() => {
    setError("");
    setEmailError("");
  }, [isSignup]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  const checkEmailInRedis = async () => {
    if (!email || isSignup) return; 
    
    setIsValidating(true);
    setEmailError("");
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/users/lookup?email=${encodeURIComponent(email)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (!data.exists) {
          setEmailError("Account not found. Please sign up first.");
        }
      } else {
        console.warn("Could not validate email against Redis");
      }
    } catch (err) {
      console.error("Redis lookup error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!isSignup && emailError) {
      return;
    }

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      
      {/* Centered Stylish App Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="absolute top-6 sm:top-10 left-0 w-full z-30 flex justify-center pointer-events-none"
      >
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-800 tracking-[0.25em] uppercase font-medium">
          SEYAL
        </h1>
      </motion.div>

      {/* Animated Soft Pastel Background Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-200/40 blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-200/50 blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], translateY: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[50vw] rounded-full bg-pink-200/40 blur-[100px]"
        />
      </div>

      {/* Floating Elements / Emojis on the Left */}
      <div className="hidden lg:block absolute left-[5%] top-0 bottom-0 w-[25%] z-0 pointer-events-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          className="absolute top-[25%] left-[20%] text-7xl drop-shadow-2xl"
        >
          🚀
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [0, -10, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[55%] left-[50%] text-6xl drop-shadow-2xl"
        >
          📝
        </motion.div>
        <motion.div 
          animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[20%] left-[10%] text-7xl drop-shadow-2xl"
        >
          ✅
        </motion.div>
      </div>

      {/* Floating Elements / Emojis on the Right */}
      <div className="hidden lg:block absolute right-[5%] top-0 bottom-0 w-[25%] z-0 pointer-events-none">
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[20%] right-[30%] text-7xl drop-shadow-2xl"
        >
          🎯
        </motion.div>
        <motion.div 
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-[50%] right-[60%] text-6xl drop-shadow-2xl"
        >
          💡
        </motion.div>
        <motion.div 
          animate={{ y: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute bottom-[25%] right-[20%] text-7xl drop-shadow-2xl"
        >
          ✨
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4 p-8 sm:p-10 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 rotate-3"
          >
            <Check size={32} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {isSignup ? "Join us to organize your life." : "Enter your details to access your tasks."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-3 mb-6 text-sm overflow-hidden shadow-sm"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={checkEmailInRedis}
                required
                className={`w-full pl-11 pr-4 py-3.5 bg-white border ${emailError ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-300 shadow-sm`}
              />
              {isValidating && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {emailError && !isSignup && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-red-500 text-xs mt-2 pl-2 flex items-center gap-1 font-medium"
                >
                  <AlertCircle size={12} />
                  {emailError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300"
          >
            {isSignup ? "Create Account" : "Sign In"}
          </motion.button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <motion.button 
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-white border border-slate-200 py-3.5 rounded-xl font-semibold text-slate-700 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </motion.button>

        <p className="text-sm text-center mt-8 text-slate-500 font-medium">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
          >
            {isSignup ? "Log in here" : "Sign up for free"}
          </button>
        </p>

      </motion.div>
    </div>
  );
}
