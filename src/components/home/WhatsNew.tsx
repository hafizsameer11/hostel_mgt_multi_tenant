import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface HotelCard {
    id: number;
    image: string;
    badge: string;
    title: string;
    description: string;
}

interface WhatsNewProps {
    hotelCards: HotelCard[];
}

const WhatsNew = ({ hotelCards }: WhatsNewProps) => {
    const [currentCardSlide, setCurrentCardSlide] = useState(0);

    useEffect(() => {
        const maxSlides = Math.max(0, hotelCards.length - 3);
        const interval = setInterval(() => {
            setCurrentCardSlide((prev) => (prev + 1) % (maxSlides + 1));
        }, 4000);

        return () => clearInterval(interval);
    }, [hotelCards.length]);

    return (
        <section className="py-8 bg-white">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">What's New</h2>
                <div className="relative overflow-hidden">
                    <div
                        className="flex gap-6 transition-transform duration-500 ease-in-out"
                        style={{
                            transform: `translateX(-${currentCardSlide * (100 / 3)}%)`,
                        }}
                    >
                        {hotelCards.map((card) => (
                            <div
                                key={card.id}
                                className="flex-shrink-0 w-full md:w-[32%] bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col"
                                style={{ minHeight: '420px' }}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 left-3 bg-green-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <span>✨</span>
                                        {card.badge}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {card.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                                        {card.description}
                                    </p>
                                    <div className="mt-auto">
                                        <Link
                                            to="/hostels"
                                            className="inline-flex items-center bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                        >
                                            Book Now →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhatsNew;

