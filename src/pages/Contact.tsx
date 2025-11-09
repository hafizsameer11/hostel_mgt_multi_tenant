import Header from '../components/Header'
import Footer from '../components/Footer'

const teams = [
    {
        title: 'Support Team',
        description: 'Booking & stay related queries',
        cta: 'WhatsApp',
        href: 'https://wa.me/0000000000',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    },
    {
        title: 'Franchise Team',
        description: 'Open a Hotling property',
        cta: 'Sign Up Now',
        href: '#franchise',
        image: 'https://images.unsplash.com/photo-1503389152951-9f343605f61e?auto=format&fit=crop&w=1200&q=80',
    },
    {
        title: 'Marketing Team',
        description: 'Creator, brand & artist collabs',
        cta: 'Email us',
        href: 'mailto:marketing@hotling.com',
        image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
    },
]

const Contact = () => {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1">
                <section className="px-6 sm:px-8 lg:px-12 pt-16 pb-12 text-center">
                    <p className="text-sm uppercase tracking-[0.4em] text-primary-500 font-semibold mb-3">we're here for you</p>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">Hey, need help?</h1>
                    <p className="max-w-3xl mx-auto text-lg text-gray-600">
                        From booking enquiries to opening your own Hotling franchise, we are just a text or email away. Choose the team that suits your question best.
                    </p>
                </section>

                <section className="px-6 sm:px-8 lg:px-12 pb-24">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {teams.map((team) => (
                            <div key={team.title} className="group rounded-[32px] bg-white border border-gray-100 shadow-[0_45px_80px_-45px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col min-h-[30rem]">
                                <div className="h-60 bg-gray-100 overflow-hidden">
                                    <img src={team.image} alt={team.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.title}</h3>
                                    <p className="text-sm text-gray-500 mb-8 flex-1">{team.description}</p>
                                    <a
                                        href={team.href}
                                        className="inline-flex items-center justify-center rounded-full bg-[#F4603C] text-white font-semibold px-6 py-3 shadow-[0_12px_30px_-18px_rgba(244,96,60,0.9)] transition-transform hover:translate-y-[-2px]"
                                    >
                                        {team.cta}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="relative py-24 bg-gray-50 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                        <span className="text-[220px] md:text-[320px] font-black uppercase tracking-[0.3em] text-gray-200 select-none">Hotling</span>
                    </div>
                    <div className="relative max-w-3xl mx-auto text-center px-6 space-y-6">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Follow your heart with Hotling</h2>
                        <p className="text-lg text-gray-600">
                            Join our community of travellers, creators, and partners who make every Hotling stay unforgettable. We love hearing from you.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
                            <a href="https://instagram.com" className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                                Instagram
                            </a>
                            <a href="https://youtube.com" className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                                YouTube
                            </a>
                            <a href="mailto:hello@hotling.com" className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                                hello@hotling.com
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default Contact


