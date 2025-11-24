'use client';

import Image from 'next/image';

export default function Header() {
    return (
        <header className="absolute top-6 left-6 z-40 flex items-center gap-4 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-2 rounded-xl border border-teal-200/30">
                <Image
                    src="/logo.png"
                    alt="AIM Logo"
                    width={100}
                    height={50}
                    style={{ height: 'auto' }}
                    className="object-contain"
                    priority
                />
            </div>
            <div className="flex flex-col border-l border-gray-200 pl-4">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">MultiFinger Board</h1>
                <p className="text-sm text-teal-600 font-medium">AIM Whiteboard</p>
            </div>
        </header>
    );
}
