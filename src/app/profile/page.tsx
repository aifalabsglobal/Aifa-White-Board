'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/workspaces');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
                <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}
