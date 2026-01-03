'use client';

/**
 * PresenceIndicator - Shows who else is viewing/editing the board
 */

import React, { useState } from 'react';
import { useRealTime } from '@/components/providers/RealTimeProvider';
import { Users, Wifi, WifiOff } from 'lucide-react';

export default function PresenceIndicator() {
    const { isConnected, remoteUsers, myColor } = useRealTime();
    const [showDetails, setShowDetails] = useState(false);

    const totalUsers = remoteUsers.length + 1; // +1 for self

    return (
        <div className="relative">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isConnected
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                title={isConnected ? `${totalUsers} user(s) online` : 'Connecting...'}
            >
                {isConnected ? (
                    <Wifi size={14} className="text-green-500" />
                ) : (
                    <WifiOff size={14} className="text-gray-400 animate-pulse" />
                )}

                {/* User Avatars */}
                <div className="flex -space-x-1.5">
                    {/* Self */}
                    <div
                        className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: myColor || '#3B82F6' }}
                        title="You"
                    >
                        U
                    </div>

                    {/* Remote users (show up to 3) */}
                    {remoteUsers.slice(0, 3).map((user) => (
                        <div
                            key={user.socketId}
                            className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: user.userColor }}
                            title={user.userName}
                        >
                            {user.userName.charAt(0).toUpperCase()}
                        </div>
                    ))}

                    {/* Overflow count */}
                    {remoteUsers.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-medium text-gray-600">
                            +{remoteUsers.length - 3}
                        </div>
                    )}
                </div>

                <span className="hidden sm:inline">
                    {isConnected ? `${totalUsers} online` : 'Offline'}
                </span>
            </button>

            {/* Dropdown with user details */}
            {showDetails && isConnected && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <Users size={12} className="inline mr-1.5" />
                        Collaborators ({totalUsers})
                    </div>

                    {/* Self */}
                    <div className="px-3 py-2 flex items-center gap-2">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: myColor || '#3B82F6' }}
                        >
                            U
                        </div>
                        <span className="text-sm text-gray-700 font-medium">You</span>
                        <span className="ml-auto text-xs text-green-500 font-medium">● Active</span>
                    </div>

                    {/* Remote users */}
                    {remoteUsers.map((user) => (
                        <div key={user.socketId} className="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: user.userColor }}
                            >
                                {user.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 truncate flex-1">{user.userName}</span>
                            <span className="text-xs text-green-500">●</span>
                        </div>
                    ))}

                    {remoteUsers.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400 italic">
                            No other collaborators yet
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDetails && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDetails(false)}
                />
            )}
        </div>
    );
}
