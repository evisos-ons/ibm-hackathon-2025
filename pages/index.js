'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/page.module.css';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/page');
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Logged in successfully!');
        router.push('/page');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccess('Check your email for confirmation!');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    if (error) console.error(error);
  };

  const createStars = () => {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      const style = {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 3}px`,
        height: `${Math.random() * 3}px`,
        animationDuration: `${Math.random() * 3 + 2}s`,
        animationDelay: `${Math.random() * 2}s`
      };
      stars.push(<div key={i} className={styles.star} style={style}></div>);
    }
    return stars;
  };

  return (
    <div className={styles.container}>
      <div className={styles.stars}>
        {createStars()}
      </div>
      <div className={styles.authForm}>
        <h2 style={{ 
          color: '#fff', 
          textAlign: 'center', 
          marginBottom: '2rem',
          fontSize: '1.8rem',
          fontWeight: '500',
          letterSpacing: '0.5px'
        }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <form onSubmit={handleAuth}>
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.switchMode}>
          <p>
            {isLogin ? "New user? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className={styles.textButton}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
