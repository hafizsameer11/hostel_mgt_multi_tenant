import { useState, useEffect } from 'react';

interface Experience {
    id: number;
    title: string;
    dates: string;
    price: string;
    nights: number;
    image: string;
}

interface MountainExperiencesProps {
    experiences: Experience[];
}

const MountainExperiences = ({ experiences }: MountainExperiencesProps) => {
    const [currentExperienceSlide, setCurrentExperienceSlide] = useState(0);

    useEffect(() => {
        setCurrentExperienceSlide(0);
        if (experiences.length > 0) {
            const maxSlides = Math.max(0, experiences.length - 3);
            if (maxSlides > 0) {
                const interval = setInterval(() => {
                    setCurrentExperienceSlide((prev) => {
                        const next = (prev + 1) % (maxSlides + 1);
                        return next;
                    });
                }, 5000);

                return () => clearInterval(interval);
            }
        }
    }, [experiences.length]);

    return (
        <section className="py-10 bg-white">
            <div className="container mx-auto px-6">
                <div className="mb-4">
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">
                        Explore the Pakistani Mountains
                    </h2>
                    <p className="text-lg text-gray-600">
                        Join us for weeklong trips to epic mountain locations across Pakistan!
                    </p>
                </div>

                <div className="relative overflow-hidden">
                    <div
                        className="flex gap-6 transition-transform duration-500 ease-in-out"
                        style={{
                            transform: `translateX(-${currentExperienceSlide * (100 / 3)}%)`,
                        }}
                    >
                        {experiences.map((experience) => (
                            <div
                                key={experience.id}
                                className="flex-shrink-0 w-full md:w-[31%] bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={experience.image}
                                        alt={experience.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Nights Badge */}
                                    <div className="absolute bottom-3 left-3 bg-gray-900 bg-opacity-75 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                                        {experience.nights} Nights
                                    </div>
                                    {/* Lightning Icon */}
                                    <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                                        <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{experience.title}</h3>
                                    <p className="text-gray-600 text-sm mb-2">{experience.dates}</p>
                                    <p className="text-lg font-semibold text-primary-600">{experience.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MountainExperiences;

