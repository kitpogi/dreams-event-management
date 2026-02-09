import React from 'react';
import { Package, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui';
import Packages from '../../public/Packages';

const ClientPackages = () => {
    return (
        <div className="px-4 py-8 lg:px-6">
            {/* Dashboard Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Event Packages
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Browse and book amazing event packages
                        </p>
                    </div>
                </div>

                <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Discover our curated selection of event packages tailored to make your special day unforgettable.</span>
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
