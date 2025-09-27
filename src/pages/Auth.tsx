import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Mail, Lock, User, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
type UserType = 'student' | 'company';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    university: '',
    companyName: ''
  });

  // Validate .edu email domain (including international .edu domains)
  const validateEduEmail = (email: string): boolean => {
    const emailLower = email.toLowerCase();
    const eduPatterns = [
        /\.edu$/,
        /\.edu\.[a-z]{2}$/,
        /\.ac\.[a-z]{2}$/,
        /\.university$/,
    ];
    
    return eduPatterns.some(pattern => pattern.test(emailLower));
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // The redirectTo URL MUST be the URL of your Edge Function now,
      // as the Edge Function is responsible for the final authentication decision and redirect.
      const edgeFunctionUrl = `https://sdqmiwsvplykgsxrthfp.supabase.co/functions/v1/oauth-callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Pointing directly to the Edge Function to intercept the auth flow.
          redirectTo: edgeFunctionUrl, 
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  // --- START MODIFICATIONS ---

  // 1. Session Initialization and Error Check on Component Mount
  useEffect(() => {
    setLoading(true);

    // 1.1: Check for external errors (e.g., redirect from Edge Function failure)
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');

    if (authError === 'edu_required') {
        setError('Registration failed. Only .edu or recognized university emails are allowed.');
        // Clear the error query parameter
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(false);
        return;
    }

    // 1.2: The supabase-js library automatically processes the URL hash (#access_token=...) 
    // on page load. We just need to check the session status.
    const checkSessionAndCleanup = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // If the session is active, check the domain one last time (redundant but safe)
          if (!validateEduEmail(session.user.email || '')) {
            setError('Authentication failed. Your university email is no longer valid.');
            await supabase.auth.signOut();
            return;
          }
          // User is logged in, navigate away from the auth page
          navigate('/home');
          return;
        }

        // Cleanup: Clear the hash manually if it still exists (common workaround for React/SPAs)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

      } catch (e) {
        console.error('Initial session check failed:', e);
      } finally {
        setLoading(false);
      }
    };
    
    checkSessionAndCleanup();

  }, [navigate]); 

  // 2. Set up auth state listener for session management (SIMPLIFIED)
  // This listener will be the primary handler for navigation after successful login/logout.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Navigation is handled here after the session is established
          setLoading(false);
          navigate('/home');
        } else if (event === 'SIGNED_OUT') {
          setLoading(false);
          // If the user signs out, ensure they are on the auth page
          if (window.location.pathname !== '/auth') {
             navigate('/auth');
          }
        } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // --- END MODIFICATIONS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/home');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate .edu email for manual signup
    if (!validateEduEmail(formData.email)) {
      setError('Only .edu email addresses are allowed. Please use your university email.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: formData.name,
            university: userType === 'student' ? formData.university : undefined,
            company_name: userType === 'company' ? formData.companyName : undefined,
            username: formData.name || formData.email.split('@')[0],
            user_type: userType,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Account created successfully! Please check your email to confirm your account.');
        setMode('login');
      }
    } catch (error: any) {
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/home'), 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    switch (mode) {
      case 'login':
        return handleLogin(e);
      case 'signup':
        return handleSignup(e);
      case 'forgot':
        return handleForgotPassword(e);
      case 'reset':
        return handleResetPassword(e);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Forgot Password';
      case 'reset':
        return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your account to continue';
      case 'signup':
        return 'Join your university\'s social network';
      case 'forgot':
        return 'Enter your email to receive a password reset link';
      case 'reset':
        return 'Enter your new password';
    }
  };

  // Check for reset mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'reset') {
      setMode('reset');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 university-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Unigramm
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with your university community
          </p>
        </div>

        {/* Auth Form */}
        <div className="post-card">
          {mode !== 'login' && mode !== 'signup' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {getTitle()}
            </h2>
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 border-green-500 text-green-700">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="space-y-4">
                  <Label>I am a:</Label>
                  <RadioGroup value={userType} onValueChange={(value: UserType) => setUserType(value)} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 data-[state=checked]:bg-muted" data-state={userType === 'student' ? 'checked' : 'unchecked'}>
                      <RadioGroupItem value="student" id="student" className="sr-only" />
                      <Label htmlFor="student" className="flex flex-col items-center gap-2 w-full cursor-pointer">
                        <GraduationCap className="w-6 h-6 text-primary" />
                        <span className="font-medium text-center">Student</span>
                      </Label>
                    </div>
                    <div className="flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 data-[state=checked]:bg-muted" data-state={userType === 'company' ? 'checked' : 'unchecked'}>
                      <RadioGroupItem value="company" id="company" className="sr-only" />
                      <Label htmlFor="company" className="flex flex-col items-center gap-2 w-full cursor-pointer">
                        <Building2 className="w-6 h-6 text-primary" />
                        <span className="font-medium text-center">Company</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{userType === 'student' ? 'Full Name' : 'Contact Person Name'}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={userType === 'student' ? 'Enter your full name' : 'Enter contact person name'}
                        className="pl-10 bg-surface border-border"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {userType === 'student' ? (
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="university"
                          name="university"
                          type="text"
                          placeholder="Enter your university"
                          className="pl-10 bg-surface border-border"
                          value={formData.university}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Enter your company name"
                          className="pl-10 bg-surface border-border"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 bg-surface border-border"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 bg-surface border-border"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10 bg-surface border-border"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full btn-primary mt-6" disabled={loading}>
              {loading ? 'Loading...' : getTitle()}
            </Button>
          </form>

          {/* Google Sign-In for login and signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google (.edu only)
              </Button>
            </>
          )}

          {mode === 'login' && (
            <>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Don't have an account? Sign up
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}
