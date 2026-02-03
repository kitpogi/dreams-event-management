import React, { useState, useEffect } from 'react';
import {
    DataTable,
    Button,
    Badge,
    Card
} from '../../ui';
import {
    FileText,
    Download,
    Eye,
    Search,
    AlertCircle
} from 'lucide-react';
import { invoiceService } from '../../../api/services/invoiceService';
import InvoiceModal from './InvoiceModal';
import { useToast } from '../../../hooks/use-toast';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.getAll();
            setInvoices(response.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast({
                title: 'Error',
                description: 'Failed to load invoices. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setShowModal(true);
    };

    const handleDownloadInvoice = async (invoice) => {
        try {
            setIsDownloading(true);
            toast({
                title: 'Downloading...',
                description: 'Your invoice is being generated.',
            });

            const blob = await invoiceService.download(invoice.id);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast({
                title: 'Success',
                description: 'Invoice downloaded successfully.',
            });
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to download invoice.',
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(false);
        }
    };

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

    if (loading && invoices.length === 0) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <DataTable
                data={invoices}
                columns={[
                    {
                        accessor: 'invoice_number',
                        header: 'Invoice #',
                        sortable: true,
                        render: (row) => (
                            <div className="font-mono font-medium text-gray-900 dark:text-white">
                                {row.invoice_number}
                            </div>
                        ),
                    },
                    {
                        accessor: 'booking',
                        header: 'Booking',
                        sortable: false,
                        render: (row) => (
                            <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">
                                    {row.booking?.eventPackage?.package_name || 'Event Booking'}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                    {row.booking?.event_date && new Date(row.booking.event_date).toLocaleDateString()}
                                </div>
                            </div>
                        ),
                    },
                    {
                        accessor: 'amount',
                        header: 'Amount',
                        sortable: true,
                        render: (row) => (
                            <div className="font-medium text-gray-900 dark:text-white">
                                ₱{parseFloat(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        ),
                    },
                    {
                        accessor: 'issued_date',
                        header: 'Issued Date',
                        sortable: true,
                        render: (row) => new Date(row.issued_date).toLocaleDateString(),
                    },
                    {
                        accessor: 'due_date',
                        header: 'Due Date',
                        sortable: true,
                        render: (row) => (
                            <div className={new Date(row.due_date) < new Date() && row.status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                                {new Date(row.due_date).toLocaleDateString()}
                            </div>
                        ),
                    },
                    {
                        accessor: 'status',
                        header: 'Status',
                        sortable: true,
                        render: (row) => getStatusBadge(row.status),
                    },
                    {
                        accessor: 'actions',
                        header: 'Actions',
                        sortable: false,
                        render: (row) => (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewInvoice(row)}
                                    title="View Details"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(row)}
                                    disabled={isDownloading}
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        ),
                    },
                ]}
                searchable
                searchPlaceholder="Search invoices..."
                pagination
                pageSize={10}
                emptyState={
                    <div className="text-center py-12">
                        <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No invoices found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Invoices will appear here once they are generated for your bookings.
                        </p>
                    </div>
                }
            />

            <InvoiceModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                invoice={selectedInvoice}
                onDownload={() => handleDownloadInvoice(selectedInvoice)}
            />
        </div>
    );
};

export default InvoiceList;
