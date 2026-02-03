import React from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Card } from '../../../components/ui';
import Reviews from '../../public/Reviews';

const ClientReviews = () => {
    return (
        <div className="px-4 py-8 lg:px-6">
            {/* Dashboard Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Client Reviews
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Read what our clients say about their events
                        </p>
                    </div>
                </div>

                <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>See real experiences from couples who trusted us with their special day.</span>
                    </div>
                </Card>
            </div>

            {/* Reviews Component */}
            <div className="mt-6">
                <Reviews />
            </div>
        </div>
    );
};

export default ClientReviews;
