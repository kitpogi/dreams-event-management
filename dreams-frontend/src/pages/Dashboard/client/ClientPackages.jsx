import React from 'react';
import { Package, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui';
import Packages from '../../public/Packages';

const ClientPackages = () => {
    return (
        <div className="px-4 py-8 lg:px-6 w-full">
            {/* Dashboard Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl shadow-blue-500/20">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Event Packages
                        </h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Browse and book amazing event packages
                        </p>
                    </div>
                </div>

                <Card className="p-4 bg-white/80 dark:bg-[#111b2e]/80 backdrop-blur-xl border border-blue-100 dark:border-blue-900/30 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 relative z-10">
                        <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                        </div>
                        <span className="font-medium italic">Discover our curated selection of event packages tailored to make your special day unforgettable.</span>
                    </div>
                </Card>
            </div>

            {/* Packages Component */}
            <div className="mt-6">
                <Packages hideHeader={true} compact={true} />
            </div>
        </div>
    );
};

export default ClientPackages;
