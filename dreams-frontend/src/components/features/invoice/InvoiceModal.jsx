import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Badge,
    Separator
} from '../../ui';
import { Download, Calendar, CreditCard, FileText } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, invoice, onDownload }) => {
    if (!invoice) return null;

    const getStatusBadge = (status) => {
        const statuses = {
            paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            void: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };

        return (
            <Badge className={statuses[status] || statuses.void}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-600" />
                            Invoice {invoice.invoice_number}
                        </DialogTitle>
                        {getStatusBadge(invoice.status)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Issued Date</p>
                            <p className="font-medium flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(invoice.issued_date).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Due Date</p>
                            <p className="font-medium flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Booking Details */}
                    <div>
                        <h4 className="font-semibold mb-3">Booking Details</h4>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Package:</span>
                                <span className="font-medium">{invoice.booking?.eventPackage?.package_name || 'Event Package'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Event Date:</span>
                                <span className="font-medium">{invoice.booking?.event_date ? new Date(invoice.booking.event_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Venue:</span>
                                <span className="font-medium">{invoice.booking?.event_venue || 'TBD'}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Amount Details */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-primary-600">₱{parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-300">
                            <strong>Note:</strong> {invoice.notes}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={onDownload}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceModal;
