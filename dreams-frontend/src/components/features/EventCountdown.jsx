import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card } from '../ui/card';

const EventCountdown = ({ eventDate }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!eventDate) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const event = new Date(eventDate).getTime();
            const difference = event - now;

            if (difference <= 0) {
                setIsExpired(true);
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            setIsExpired(false);
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [eventDate]);

    if (!eventDate) return null;

    if (isExpired) {
        return (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Event has passed</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Event In</p>
                    <div className="flex items-center gap-3">
                        {timeLeft.days > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {timeLeft.days}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">days</div>
                            </div>
                        )}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">hours</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">minutes</div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default EventCountdown;
