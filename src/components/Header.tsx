import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <nav className="container mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-blue">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className="text-2xl font-bold text-primary-600">HostelCity</span>
        </Link>

        {/* Menu Items */}
        <ul className="hidden md:flex items-center gap-8">
          <li>
            <Link
              to="/"
              className={`font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={`font-medium transition-colors ${
                location.pathname === '/about'
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/services"
              className={`font-medium transition-colors ${
                location.pathname === '/services'
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Services
            </Link>
          </li>
          <li>
            <Link
              to="/hostels"
              className={`font-medium transition-colors ${
                location.pathname === '/hostels'
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Hostels
            </Link>
          </li>
        </ul>

        {/* Buttons */}
        <div className="flex items-center space-x-4">
          <Link
            to="/hostels"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-blue hover:shadow-blue-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Explore Hostels
          </Link>
          <Link
            to="/login"
            className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-blue hover:shadow-blue-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </nav>
    </header>
  );
};

export default Header;

