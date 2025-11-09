import Header from '../components/Header'
import Footer from '../components/Footer'
import type { FormEvent } from 'react'

const guestSteps = [
    {
        icon: '🔍',
        title: 'Search hotels',
        description: 'Enter your city, dates, and number of guests to see tailored stays across Pakistan.',
    },
    {
        icon: '🤝',
        title: 'Compare & choose',
        description: 'Filter by price, ratings, amenities, and guest reviews to find your perfect match.',
    },
    {
        icon: '💳',
        title: 'Book & pay securely',
        description: 'Reserve instantly with secure payment, then receive your confirmation in seconds.',
    },
    {
        icon: '🛎️',
        title: 'Check in & enjoy',
        description: 'Arrive with ease—your booking details and preferences are already shared with the hotel.',
    },
]

const partnerSteps = [
    {
        icon: '👤',
        title: 'Create an account',
        description: 'Sign up as a hotel partner and meet your onboarding specialist within 24 hours.',
    },
    {
        icon: '🏨',
        title: 'List property details',
        description: 'Add room types, amenities, policies, and pricing to showcase your stay.',
    },
    {
        icon: '📸',
        title: 'Add photos & info',
        description: 'Upload high-impact visuals, descriptions, and highlights that convert browsers into bookings.',
    },
    {
        icon: '📅',
        title: 'Start receiving bookings',
        description: 'Go live to appear in searches, manage reservations, and get paid on time through Hotling.',
    },
]

const featureHighlights = [
    { icon: '✅', label: 'Instant booking confirmation' },
    { icon: '💳', label: 'Secure payments & invoicing' },
    { icon: '🏆', label: 'Verified hotels only' },
    { icon: '🕓', label: '24/7 customer support' },
    { icon: '🌐', label: 'Multi-language & currency support' },
]

const faqs = [
    {
        question: 'How do I book a hotel?',
        answer:
            'Use the search bar to choose your city, dates, and guests. Compare options, click “Book now,” and complete payment. You will receive an instant confirmation email and SMS.',
    },
    {
        question: 'Can I cancel my booking?',
        answer:
            'Yes. Each hotel displays its cancellation policy before you confirm. You can cancel or modify your booking from your dashboard or by contacting support.',
    },
    {
        question: 'What payment methods do you support?',
        answer:
            'We accept major credit and debit cards, bank transfers, and digital wallets. Partners can enable cash-on-arrival for verified guests.',
    },
    {
        question: 'Is my payment secure?',
        answer:
            'Absolutely. Payments are processed through PCI-compliant gateways with end-to-end encryption and fraud monitoring.',
    },
    {
        question: 'How can I contact support?',
        answer:
            'Our support team is available 24/7 via live chat, email at care@hotling.com, and dedicated partner hotlines.',
    },
    {
        question: 'Do hotel partners pay a fee?',
        answer:
            'Partners choose a commission plan that fits their goals. During onboarding, we walk you through pricing, payouts, and performance dashboards.',
    },
]

const Onboarding = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1">
                <section className="px-6 sm:px-10 lg:px-16 pt-20 pb-16 bg-gradient-to-b from-sky-50 via-white to-white">
                    <div className="max-w-5xl space-y-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
                            Welcome aboard
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                            Welcome to Hotling — Your comfort starts here.
                        </h1>
                        <p className="text-lg text-gray-600">
                            Discover and book luxury hotels across Pakistan in just a few clicks. Whether you are planning a getaway or listing a new property, we walk beside you from first search to first reservation.
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm font-medium">
                            <a
                                href="/hostels"
                                className="inline-flex items-center rounded-full bg-black text-white px-7 py-4 text-base hover:bg-gray-900 transition-colors"
                            >
                                Explore hotels
                            </a>
                            <a
                                href="/register"
                                className="inline-flex items-center rounded-full border border-gray-200 px-7 py-4 text-base text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
                            >
                                List your property
                            </a>
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 py-16 bg-white">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-gray-900">How onboarding works for guests</h2>
                            <p className="text-gray-600 text-lg">
                                Finding and booking your next stay is as simple as four quick steps. We designed Hotling so you can focus on the adventure, not the admin.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {guestSteps.map((step) => (
                                <div
                                    key={step.title}
                                    className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_45px_90px_-70px_rgba(15,23,42,0.4)] space-y-3"
                                >
                                    <span className="text-4xl" aria-hidden>
                                        {step.icon}
                                    </span>
                                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 pb-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-gray-900">Set up your hotel in four guided steps</h2>
                            <p className="text-gray-600 text-lg">
                                Partner onboarding is collaborative and fast. Use our checklist, integrations, and coach-led sessions to go live in under a week.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {partnerSteps.map((step) => (
                                <div
                                    key={step.title}
                                    className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_45px_90px_-70px_rgba(15,23,42,0.35)] space-y-3"
                                >
                                    <span className="text-4xl" aria-hidden>
                                        {step.icon}
                                    </span>
                                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 py-16 bg-white">
                    <div className="max-w-6xl mx-auto space-y-10">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-gray-900">Why travellers and partners choose Hotling</h2>
                            <p className="text-gray-600 text-lg">Built for trust, speed, and unforgettable stays.</p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featureHighlights.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_35px_70px_-60px_rgba(15,23,42,0.35)] space-y-2"
                                >
                                    <span className="text-3xl" aria-hidden>
                                        {feature.icon}
                                    </span>
                                    <h3 className="text-lg font-semibold text-gray-900">{feature.label}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 pb-16 bg-gradient-to-r from-primary-50 via-white to-primary-50">
                    <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-gray-900">Take a 90-second guided tour</h2>
                            <p className="text-gray-600 text-lg">
                                Watch how guests search and book, how hoteliers manage inventory, and how our support team keeps everything running smoothly.
                            </p>
                            <a
                                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition-colors"
                            >
                                Play walkthrough video
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-[28px] shadow-[0_45px_90px_-70px_rgba(15,23,42,0.45)]">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube.com/embed/5ZkH0E9KZx4?rel=0&modestbranding=1"
                                title="Hotling Onboarding Walkthrough"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 pb-16 bg-white">
                    <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-900">Create your account in minutes</h2>
                            <p className="text-gray-600 text-lg">
                                Start your personalised journey. A progress bar keeps you informed and saves your information if you need to finish later.
                            </p>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                                <div className="bg-primary-500 h-3 rounded-full w-1/3" />
                            </div>
                            <form
                                className="grid gap-5"
                                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                                    event.preventDefault()
                                    const data = new FormData(event.currentTarget)
                                    const name = data.get('name')
                                    alert(`Thanks ${name}, we have saved your onboarding starter profile!`)
                                }}
                            >
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Full name</label>
                                        <input
                                            name="name"
                                            required
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            placeholder="Ayesha Khan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Mobile number</label>
                                        <input
                                            name="phone"
                                            required
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            placeholder="+92 300 1234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Create password</label>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            placeholder="Minimum 8 characters"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-full bg-primary-600 text-white px-8 py-3 text-sm font-semibold hover:bg-primary-700 transition-colors"
                                >
                                    Save & continue to preferences
                                </button>
                            </form>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                <span>Or sign up with</span>
                                <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 hover:border-gray-300">
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-4 h-4" />
                                    Google
                                </button>
                                <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 hover:border-gray-300">
                                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="" className="w-4 h-4" />
                                    Facebook
                                </button>
                            </div>
                        </div>
                        <aside className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-[0_45px_90px_-70px_rgba(15,23,42,0.4)] space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">What to expect next</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li>
                                    <strong className="font-semibold text-gray-900">Profile setup:</strong> Tell us about your travel style or property goals.
                                </li>
                                <li>
                                    <strong className="font-semibold text-gray-900">Preferences:</strong> Set check-in times, payment options, or hospitality quirks.
                                </li>
                                <li>
                                    <strong className="font-semibold text-gray-900">Book your stay:</strong> Pick your first trip or launch promotion with confidence.
                                </li>
                            </ul>
                        </aside>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 pb-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">FAQs for new explorers and partners</h2>
                        <p className="text-gray-600 text-lg">Popular topics so you can get started without a single hiccup.</p>
                        <div className="space-y-4">
                            {faqs.map((faq) => (
                                <details key={faq.question} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.4)]">
                                    <summary className="text-lg font-semibold text-gray-900 cursor-pointer focus:outline-none">
                                        {faq.question}
                                    </summary>
                                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-6 sm:px-10 lg:px-16 pb-20 bg-white">
                    <div className="max-w-4xl mx-auto rounded-[32px] bg-black text-white p-10 shadow-[0_45px_90px_-70px_rgba(15,23,42,0.55)] space-y-6">
                        <h2 className="text-3xl font-bold">Need help getting started?</h2>
                        <p className="text-white/80 text-lg">
                            Our support team is available 24/7 via chat, email, and phone. Share a quick note and we will guide you through onboarding, bookings, or any hiccup you encounter.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a href="https://chat.hotling.com" className="inline-flex items-center rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-gray-200 transition-colors">
                                Open live chat
                            </a>
                            <a href="mailto:care@hotling.com" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white hover:text-black transition-colors">
                                Email support
                            </a>
                            <a href="/customer-service" className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white hover:text-black transition-colors">
                                Visit customer service hub
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default Onboarding

