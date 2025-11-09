const PromoBanner = () => {
  return (
    <div className="bg-yellow-300 border-b border-yellow-400 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
      }}></div>

      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-gray-900 font-bold text-lg md:text-xl text-center flex-1">
            Lowest Price for a week - Don't Miss Out!
          </p>
          <button className="px-6 py-2.5 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg whitespace-nowrap">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;

