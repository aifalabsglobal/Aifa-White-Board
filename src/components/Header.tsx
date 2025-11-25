'use client';

import Image from 'next/image';

export default function Header() {
    return (
        <header className="absolute top-6 left-6 z-40 flex items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            {/* AIFA Logo */}
            <div className="flex items-center bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200/30">
                <Image
                    src="/aifa-logo.png"
                    alt="AIFA Logo"
                    width={120}
                    height={60}
                    style={{ height: 'auto' }}
                    className="object-contain"
                    priority
                />
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            {/* Tagline */}
            <div className="flex flex-col">
                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Creative Canvas</p>
                <p className="text-sm text-indigo-600 font-semibold">by AIFA Labs</p>
            </div>
        </header>
    );
}
