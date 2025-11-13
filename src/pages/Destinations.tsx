import { useState, useEffect } from 'react';

interface Destination {
    id: number;
    city: string;
    region: string;
    category: string;
    image: string;
}

interface DestinationsProps {
    destinations: Destination[];
    filterCategories: string[];
}

const Destinations = ({ destinations, filterCategories }: DestinationsProps) => {
    const [destinationSearch, setDestinationSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [currentCitySlide, setCurrentCitySlide] = useState(0);
    const [currentMountainSlide, setCurrentMountainSlide] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(1);

    const filteredDestinations = destinations.filter((dest) => {
        const matchesSearch =
            dest.city.toLowerCase().includes(destinationSearch.toLowerCase()) ||
            dest.region.toLowerCase().includes(destinationSearch.toLowerCase());
        const matchesFilter = activeFilter === 'All' || dest.category === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const cityDestinations = filteredDestinations.filter((dest) => dest.category === 'City');
    const mountainDestinations = filteredDestinations.filter((dest) => dest.category === 'Mountain');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setItemsPerView(4);
            } else if (window.innerWidth >= 1024) {
                setItemsPerView(3);
            } else {
                setItemsPerView(2);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const effectiveCityPerView = Math.min(itemsPerView, Math.max(1, cityDestinations.length));
    const effectiveMountainPerView = Math.min(itemsPerView, Math.max(1, mountainDestinations.length));

    useEffect(() => {
        setCurrentCitySlide(0);
        const maxSlides = Math.max(0, cityDestinations.length - effectiveCityPerView);
        if (maxSlides > 0) {
            const interval = setInterval(() => {
                setCurrentCitySlide((prev) => (prev + 1) % (maxSlides + 1));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [cityDestinations.length, destinationSearch, activeFilter, effectiveCityPerView]);

    useEffect(() => {
        setCurrentMountainSlide(0);
        const maxSlides = Math.max(0, mountainDestinations.length - effectiveMountainPerView);
        if (maxSlides > 0) {
            const interval = setInterval(() => {
                setCurrentMountainSlide((prev) => (prev + 1) % (maxSlides + 1));
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [mountainDestinations.length, destinationSearch, activeFilter, effectiveMountainPerView]);

    return (
        <section className="py-8 bg-white">
            <div className="w-full px-4 sm:px-8 lg:px-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Destinations</h2>

                {/* Filters and Search - One Line */}
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    {/* Search Bar - First */}
                    <div className="relative w-full md:w-auto md:min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search cities..."
                            value={destinationSearch}
                            onChange={(e) => setDestinationSearch(e.target.value)}
                            className="w-full rounded-full border border-gray-300 pl-4 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                            aria-label="Search"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary-600 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-primary-700 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                                <path d="M20 20l-3.5-3.5" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>

                    {/* Filter Buttons - After Search */}
                    <div className="flex flex-wrap gap-3 flex-1">
                        {filterCategories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveFilter(category)}
                                className={`px-4 py-2 rounded-full font-medium transition-colors ${activeFilter === category
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cities Row - First Row */}
                {cityDestinations.length > 0 && (
                    <div className="mb-6">
                        <div className="relative overflow-hidden">
                            <div
                                className="flex gap-6 transition-transform duration-500 ease-in-out"
                                style={{
                                    transform: `translateX(-${currentCitySlide * (100 / effectiveCityPerView)}%)`,
                                }}
                            >
                                {cityDestinations.map((destination) => (
                                    <div
                                        key={destination.id}
                                        className="flex-shrink-0 text-center"
                                        style={{
                                            flexBasis: `${100 / effectiveCityPerView}%`,
                                            maxWidth: `${100 / effectiveCityPerView}%`,
                                        }}
                                    >
                                        <div className="relative mb-4">
                                            <div className="w-36 h-36 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                                <img
                                                    src={destination.image}
                                                    alt={destination.city}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {destination.city}
                                        </h3>
                                        <p className="text-gray-600 text-sm">{destination.region}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mountain Areas Row - Second Row */}
                {mountainDestinations.length > 0 && (
                    <div>
                        <div className="relative overflow-hidden">
                            <div
                                className="flex gap-6 transition-transform duration-500 ease-in-out"
                                style={{
                                    transform: `translateX(-${currentMountainSlide * (100 / effectiveMountainPerView)}%)`,
                                }}
                            >
                                {mountainDestinations.map((destination) => (
                                    <div
                                        key={destination.id}
                                        className="flex-shrink-0 text-center"
                                        style={{
                                            flexBasis: `${100 / effectiveMountainPerView}%`,
                                            maxWidth: `${100 / effectiveMountainPerView}%`,
                                        }}
                                    >
                                        <div className="relative mb-4">
                                            <div className="w-36 h-36 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                                <img
                                                    src={destination.image}
                                                    alt={destination.city}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {destination.city}
                                        </h3>
                                        <p className="text-gray-600 text-sm">{destination.region}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {cityDestinations.length === 0 && mountainDestinations.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No destinations found matching your search.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Destinations;

