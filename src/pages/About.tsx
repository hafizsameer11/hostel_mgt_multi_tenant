import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-primary-600">Home</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">About</span>
          </nav>
        </div>
      </div>

      {/* Intro Block */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About HostelCity
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              HostelCity is a comprehensive hostel management platform designed to help property owners, 
              managers, and tenants streamline their daily operations. Our platform serves hostel owners 
              seeking efficient property management, managers who need real-time insights into their facilities, 
              and tenants looking for a seamless experience. We combine reliability, transparency, and efficiency 
              to deliver a modern solution that simplifies hostel management.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Mission & Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Reliability</h3>
              <p className="text-gray-600">
                We ensure your data is secure, your operations run smoothly, and your platform is always available when you need it.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-600">
                Clear visibility into all operations, from billing to maintenance, with real-time updates and comprehensive reporting.
              </p>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Efficiency</h3>
              <p className="text-gray-600">
                Automate repetitive tasks, reduce manual errors, and save time with our streamlined workflows and intelligent automation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing & Rent Management</h3>
              <p className="text-gray-600 text-sm">
                Automated invoice generation, payment tracking, and comprehensive financial reporting.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alerts & Reminders</h3>
              <p className="text-gray-600 text-sm">
                Never miss critical dates with automated notifications for bills, receivables, and maintenance.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance Orchestration</h3>
              <p className="text-gray-600 text-sm">
                Track work orders, cleaning schedules, repairs, and purchase demands with status updates.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Architecture Visualization</h3>
              <p className="text-gray-600 text-sm">
                Visual floor plans showing floors, rooms, and seats with live occupancy indicators.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Score Cards</h3>
              <p className="text-gray-600 text-sm">
                Evaluate tenants, employees, and vendors with detailed criteria and historical data.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
              <p className="text-gray-600 text-sm">
                Dashboard insights and performance metrics to make data-driven decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-600">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Numbers That Matter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-primary-100 font-medium">Hostels Onboarded</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">15 min</div>
              <div className="text-primary-100 font-medium">Average Setup Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-white mb-2">24/7</div>
              <div className="text-primary-100 font-medium">Support SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Talk to us or start your free trial today. Experience the difference HostelCity can make.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-blue hover:shadow-blue-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Start Free
            </Link>
            <Link
              to="/contact"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-soft hover:shadow-soft-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border border-primary-600"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

