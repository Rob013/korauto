import React, { useEffect, useState, useMemo } from 'react';

export const SeasonalDecorations = () => {
    const [showDecorations, setShowDecorations] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        // Show in December (11) and January (0)
        if (month === 11 || month === 0) {
            setShowDecorations(true);
        }
        setMounted(true);
    }, []);

    // Generate random snowflakes with varied properties
    const snowflakes = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            animationDuration: 8 + Math.random() * 7, // 8-15s
            animationDelay: Math.random() * 5,
            size: 0.5 + Math.random() * 1, // 0.5-1.5em
            opacity: 0.3 + Math.random() * 0.7,
            swingDuration: 2 + Math.random() * 2, // 2-4s
            char: ['❅', '❆', '❄'][Math.floor(Math.random() * 3)]
        }));
    }, []);

    if (!showDecorations || !mounted) return null;

    return (
        <>
            {/* Snowfall Effect */}
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
                <style>{`
                    @keyframes snowfall {
                        0% { transform: translateY(-10vh) translateX(0); }
                        100% { transform: translateY(110vh) translateX(0); }
                    }
                    @keyframes swing {
                        0%, 100% { transform: translateX(0); }
                        50% { transform: translateX(20px); }
                    }
                    @keyframes twinkle {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                `}</style>

                {/* Snowflakes */}
                {snowflakes.map((flake) => (
                    <div
                        key={flake.id}
                        className="absolute text-white/80 select-none"
                        style={{
                            left: `${flake.left}%`,
                            fontSize: `${flake.size}em`,
                            opacity: flake.opacity,
                            animation: `snowfall ${flake.animationDuration}s linear infinite, swing ${flake.swingDuration}s ease-in-out infinite`,
                            animationDelay: `${flake.animationDelay}s`,
                            textShadow: '0 0 3px rgba(255, 255, 255, 0.8), 0 0 8px rgba(200, 220, 255, 0.5)'
                        }}
                    >
                        {flake.char}
                    </div>
                ))}
            </div>

            {/* Christmas Lights - Top decoration */}
            <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-12 overflow-hidden hidden md:block">
                <div className="flex justify-around items-start h-full">
                    {Array.from({ length: 15 }, (_, i) => (
                        <div key={i} className="relative">
                            {/* String/Wire */}
                            <div
                                className="w-px h-8 bg-gradient-to-b from-gray-600/40 to-transparent"
                                style={{
                                    transform: `rotate(${-15 + Math.sin(i * 0.5) * 10}deg)`,
                                    transformOrigin: 'top'
                                }}
                            />
                            {/* Light bulb */}
                            <div
                                className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-4 rounded-full"
                                style={{
                                    background: `radial-gradient(circle, ${['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94'][i % 5]} 0%, ${['#c92a2a', '#0ea5a3', '#ffa602', '#56ab91', '#d64545'][i % 5]} 100%)`,
                                    boxShadow: `0 0 10px ${['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94'][i % 5]}, 0 0 20px ${['#ff6b6b80', '#4ecdc480', '#ffe66d80', '#a8e6cf80', '#ff8b9480'][i % 5]}`,
                                    animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
                                    animationDelay: `${i * 0.2}s`
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Festive Corner Decorations */}
            <div className="pointer-events-none fixed top-4 left-4 z-40 hidden lg:block">
                <div
                    className="text-4xl filter drop-shadow-lg"
                    style={{
                        animation: 'float 3s ease-in-out infinite'
                    }}
                >
                    🎄
                </div>
            </div>

            <div className="pointer-events-none fixed top-4 right-4 z-40 hidden lg:block">
                <div
                    className="text-4xl filter drop-shadow-lg"
                    style={{
                        animation: 'float 3s ease-in-out infinite',
                        animationDelay: '1.5s'
                    }}
                >
                    ⛄
                </div>
            </div>

            {/* Subtle Sparkles */}
            <div className="pointer-events-none fixed inset-0 z-30">
                {Array.from({ length: 8 }, (_, i) => (
                    <div
                        key={`sparkle-${i}`}
                        className="absolute text-yellow-300/60"
                        style={{
                            left: `${10 + (i * 12)}%`,
                            top: `${20 + Math.sin(i) * 30}%`,
                            fontSize: '0.8em',
                            animation: 'twinkle 4s ease-in-out infinite',
                            animationDelay: `${i * 0.5}s`
                        }}
                    >
                        ✨
                    </div>
                ))}
            </div>

            {/* Festive Banner Text (subtle) */}
            <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-40 hidden md:block opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="bg-gradient-to-r from-red-500/10 via-green-500/10 to-red-500/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 shadow-lg">
                    <p className="text-sm font-medium bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
                        🎅 Gëzuar Krishtlindjet & Vitin e Ri! 🎄
                    </p>
                </div>
            </div>
        </>
    );
};
