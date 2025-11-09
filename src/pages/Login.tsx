import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { login } from '../services/auth.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // Call login API - THIS MUST COMPLETE BEFORE NAVIGATION
      const userData = await login({
        email: email.trim(),
        password,
      });

      // Verify we got user data back
      if (!userData || !userData.token) {
        throw new Error('Invalid response from server. Please try again.');
      }
      
      // Only navigate if login was successful
      navigate('/admin/overview', { replace: true });
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err.statusCode) {
        errorMessage = err.message || 'Login failed. Please check your credentials.';
      } else if (err.response) {
        const apiError = err.response.data;
        errorMessage = apiError?.message || 'Login failed. Please check your credentials.';
      } else if (err.request) {
        // Network error - request was made but no response
        errorMessage = 'Network error. Please check your internet connection and ensure the backend server is running.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      // DO NOT navigate on error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#2176FF] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">Sign in to your HostelCity account</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-soft-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-[#2176FF] transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2176FF] focus:border-[#2176FF] transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#2176FF] focus:ring-[#2176FF] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#2176FF] hover:text-[#1d4ed8] font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Security Hint */}
              <p className="text-xs text-gray-500 text-center">
                We never share your credentials
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2176FF] hover:bg-[#1d4ed8] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#2176FF] focus:ring-offset-2"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                  <Link
                  to="/register"
                  className="text-[#2176FF] hover:text-[#1d4ed8] font-semibold"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;

