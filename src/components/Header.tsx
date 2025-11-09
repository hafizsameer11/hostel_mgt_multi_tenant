import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      {/* First Row: Logo and Search Bar */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-blue">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-3xl font-semibold text-primary-700 tracking-wide">The City Hotling</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="relative w-full max-w-3xl">
              <input
                type="text"
                placeholder="Search your next stay"
                className="w-full rounded-full border border-gray-200 pl-12 pr-16 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-soft"
              />
              <button
                aria-label="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white rounded-full w-11 h-11 grid place-items-center hover:bg-black transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="7" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              aria-label="Toggle theme"
              className="hidden sm:inline-flex w-12 h-12 rounded-full border border-gray-200 items-center justify-center text-gray-700 hover:text-primary-600 hover:border-primary-300 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M17 7l1.4-1.4M5.6 18.4L7 17" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link
              to="/blogs"
              className="hidden md:inline-flex items-center rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Read Blogs
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-full bg-black text-white px-6 py-3 text-sm font-semibold shadow-soft hover:bg-gray-900 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Second Row: Navigation Links */}
      <nav className="w-full  px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Primary Nav */}
          <ul className="hidden lg:flex items-center gap-8 pl-16">
            <li>
              <Link
                to="/"
                className={`font-medium transition-colors ${location.pathname === '/'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/jobs"
                className={`font-medium transition-colors ${location.pathname === '/jobs'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Jobs
              </Link>
            </li>
            <li>
              <Link
                to="/onboarding"
                className={`font-medium transition-colors ${location.pathname === '/onboarding'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Onboarding
              </Link>
            </li>
            <li>
              <Link
                to="/merchandise"
                className={`font-medium transition-colors ${location.pathname === '/merchandise'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Merchandise
              </Link>
            </li>
            <li>
              <Link
                to="/blogs"
                className={`font-medium transition-colors ${location.pathname === '/blogs'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Blogs
              </Link>
            </li>
            <li>
              <Link
                to="/blogs/blog-1"
                className={`font-medium transition-colors ${location.pathname.startsWith('/blogs/') && location.pathname !== '/blogs'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Blog Detail
              </Link>
            </li>
            <li>
              <Link
                to="/hostels"
                className={`font-medium transition-colors ${location.pathname === '/hostels'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Hostels
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={`font-medium transition-colors ${location.pathname === '/contact'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-700 hover:text-primary-600'
                  }`}
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* Right Side Buttons */}
          <div className="hidden lg:flex items-center gap-4 text-sm font-semibold">
            <Link
              to="/customer-service"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Customer Service
            </Link>
            <Link
              to="/owner-hotel"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-5 py-2.5 hover:bg-black transition-colors"
            >
              Owner Hotel
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200 mt-2">
            <ul className="flex flex-col gap-4 pt-4">
              <li>
                <Link
                  to="/"
                  className={`block font-medium transition-colors ${location.pathname === '/'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/jobs"
                  className={`block font-medium transition-colors ${location.pathname === '/jobs'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/onboarding"
                  className={`block font-medium transition-colors ${location.pathname === '/onboarding'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Onboarding
                </Link>
              </li>
              <li>
                <Link
                  to="/merchandise"
                  className={`block font-medium transition-colors ${location.pathname === '/merchandise'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Merchandise
                </Link>
              </li>
              <li>
                <Link
                  to="/blogs"
                  className={`block font-medium transition-colors ${location.pathname === '/blogs'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  to="/blogs/blog-1"
                  className={`block font-medium transition-colors ${location.pathname.startsWith('/blogs/') && location.pathname !== '/blogs'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog Detail
                </Link>
              </li>
              <li>
                <Link
                  to="/hostels"
                  className={`block font-medium transition-colors ${location.pathname === '/hostels'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Hostels
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={`block font-medium transition-colors ${location.pathname === '/contact'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>
            {/* Mobile Buttons */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/customer-service"
                className="block px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Customer Service
              </Link>
              <Link
                to="/owner-hotel"
                className="block px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Owner Hotel
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

