import { Link } from 'react-router-dom'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 text-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-12 py-16 space-y-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="rounded-[28px] border border-gray-200 bg-white shadow-[0_45px_90px_-70px_rgba(15,23,42,0.35)] px-6 sm:px-8 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:w-[56rem]">
            <div className="space-y-5 max-w-xl">
              <h3 className="text-3xl font-semibold">Download Hotling App</h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-xl">😀</span>
                  <span>Get a seamless booking experience during your trips.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl">🗺️</span>
                  <span>Explore nearby hotspots with curated local maps.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl">🤝</span>
                  <span>Receive event updates and connect with Hotling travellers.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-xl">🏅</span>
                  <span>Complete quests, earn Zo credit, and unlock loyalty perks.</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center gap-5">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https%3A%2F%2Fhotling.com%2Fapp-download"
                alt="Scan to download the Hotling app"
                className="h-44 w-44 rounded-3xl border border-gray-200 bg-white object-cover"
              />
              <div className="flex items-center gap-3">
                <a
                  href="https://apps.apple.com"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.365 1.43c0 1.14-.465 2.2-1.284 3.03-.816.83-1.92 1.31-3.066 1.23-.14-1-.004-2.02.43-2.92.43-.93 1.11-1.71 2.02-2.2.31-.2.66-.33 1.02-.37.18-.02.36-.04.53-.06.22.44.34.93.35 1.42v-.13zM21.27 17.41c-.42.96-.62 1.41-.84 1.82-.55 1.02-1.21 1.95-2.01 2.91-.83 1-1.77 1.51-2.75 1.53-.55.02-1.12-.16-1.7-.35-.55-.19-1.12-.39-1.7-.37-.62.01-1.23.2-1.82.39-.54.18-1.08.35-1.58.33-1.13-.03-2.08-.68-2.97-1.68-.83-.94-1.47-2.03-2.04-3.17-1.1-2.16-1.96-4.54-1.99-7.11-.02-1.39.25-2.78.9-3.99.51-.97 1.19-1.8 2.05-2.4 1.02-.71 2.17-1.06 3.4-1.04.66.01 1.32.14 1.97.39.53.21 1.08.48 1.66.47.52-.01 1.04-.24 1.59-.45.82-.33 1.56-.47 2.21-.41 1.63.13 2.87.87 3.73 1.9-1.48.89-2.36 2.26-2.32 3.97.03 1.54.73 2.73 1.88 3.43.57.36 1.2.55 1.84.61-.14.41-.28.82-.43 1.22z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor">
                    <path d="M325.3 234.3L104.5 13.5 351 160.9zM373.6 208.9L392 219l26.7-26.7c18.5-18.5 18.5-48.5 0-67L392 80.6l-18.4 10.1-44 118.2 44 118.2zM51 32.7C40.6 42.9 34.6 57 34.6 72.1v367.8c0 15.2 6 29.2 16.4 39.4l224.2-224.3L51 32.7zM351 351.1L104.5 498.5 325.3 277.7 351 351.1z" />
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>

          <div className="flex-1 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Explore Hotling</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><Link to="/hostels" className="hover:text-primary-600 transition-colors">Hostels</Link></li>
                <li><Link to="/destinations" className="hover:text-primary-600 transition-colors">Destinations</Link></li>
                <li><Link to="/blogs" className="hover:text-primary-600 transition-colors">Blogs</Link></li>
                <li><Link to="/blogs/blog-1" className="hover:text-primary-600 transition-colors">Blog Detail</Link></li>
                <li><Link to="/merchandise" className="hover:text-primary-600 transition-colors">Merchandise</Link></li>
                <li><Link to="/jobs" className="hover:text-primary-600 transition-colors">Jobs</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Partner &amp; Support</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><Link to="/onboarding" className="hover:text-primary-600 transition-colors">Onboarding</Link></li>
                <li><Link to="/owner-hotel" className="hover:text-primary-600 transition-colors">Owner Hotel</Link></li>
                <li><Link to="/customer-service" className="hover:text-primary-600 transition-colors">Customer Service</Link></li>
                <li><Link to="/contact" className="hover:text-primary-600 transition-colors">Contact us</Link></li>
                <li><a href="mailto:care@hotling.com" className="hover:text-primary-600 transition-colors">care@hotling.com</a></li>
                <li><a href="tel:+922111234567" className="hover:text-primary-600 transition-colors">+92 21 112 345 67</a></li>
              </ul>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Follow us</p>
                <div className="flex items-center gap-3 text-gray-500">
                  <a href="https://instagram.com" aria-label="Instagram" className="hover:text-primary-600 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3c-2.757 0-5 2.243-5 5s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm5.5-3c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1z" />
                    </svg>
                  </a>
                  <a href="https://youtube.com" aria-label="YouTube" className="hover:text-primary-600 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 15l5.19-3L10 9z" />
                      <path d="M21.8 8.001s-.195-1.377-.795-1.984C20.28 5.2 19.5 5.2 19.14 5.154 16.081 5 12 5 12 5s-4.081 0-7.14.154C4.5 5.2 3.72 5.2 3 6.017 2.4 6.624 2.2 8.001 2.2 8.001S2 9.748 2 11.496v1.007c0 1.748.2 3.495.2 3.495s.195 1.377.795 1.984c.72.817 1.665.792 2.085.878C6.919 19 12 19 12 19s4.081 0 7.14-.154c.36-.046 1.14-.046 1.86-.863.6-.607.8-1.984.8-1.984s.2-1.748.2-3.495v-1.007c0-1.748-.2-3.495-.2-3.495z" />
                    </svg>
                  </a>
                  <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-primary-600 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.984 3.5c0 1.381-1.11 2.5-2.484 2.5C1.107 6 0 4.881 0 3.5 0 2.12 1.105 1 2.516 1c1.373 0 2.468 1.12 2.468 2.5zM.533 22V7.5h3.867V22H.533zM8.067 7.5H11.8v1.975h.055C12.6 8.63 14.13 7 16.733 7 21.267 7 22 9.515 22 13.13V22h-3.867v-7.52c0-1.793-.033-4.096-2.5-4.096-2.5 0-2.883 1.953-2.883 3.97V22H8.067V7.5z" />
                    </svg>
                  </a>
                  <a href="https://twitter.com" aria-label="X" className="hover:text-primary-600 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.98 2.01h-2.78L13.4 9.31 8.83 2.01H1l8.96 13.53L1.32 21.99h2.78l5.22-7.7 4.94 7.7H23l-9.17-13.82 7.15-11.16z" />
                    </svg>
                  </a>
                  <a href="https://facebook.com" aria-label="Facebook" className="hover:text-primary-600 transition-colors">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.97h-2.34V22c4.78-.8 8.44-4.94 8.44-9.93z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-primary-600 transition-colors">Cookie Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600 transition-colors">Terms &amp; Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-gray-600 border-t border-gray-100 pt-6">
          <p>© {year} Hotling. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold">PKR • Urdu / English</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <Link to="/privacy" className="hover:text-primary-600 transition-colors">Privacy</Link>
            <Link to="/cookies" className="hover:text-primary-600 transition-colors">Cookies</Link>
            <Link to="/terms" className="hover:text-primary-600 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

