'use client';

import React, { useState } from 'react';
import { PaymentAlert } from './PaymentAlert';
import { InvoiceListModal } from './InvoiceListModal';
import { useInvoices } from '../../hooks/useInvoices';
import { useSession } from 'next-auth/react';

interface PaymentManagerProps {
  className?: string;
  showAlertOnly?: boolean;
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({
  className = '',
  showAlertOnly = false
}) => {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    invoices,
    pendingInvoices,
    isLoading,
    totalPendingAmount,
    payInvoice,
    payAllInvoices,
    refreshInvoices
  } = useInvoices(session?.user?._id);

  const handlePayClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePayInvoice = async (invoiceId: string) => {
    const success = await payInvoice(invoiceId);
    if (success) {
      // Refrescar la lista después de un pago exitoso
      setTimeout(() => {
        refreshInvoices();
      }, 1000);
    }
  };

  const handlePayAll = async () => {
    const success = await payAllInvoices();
    if (success) {
      // Refrescar la lista después de un pago exitoso
      setTimeout(() => {
        refreshInvoices();
        setIsModalOpen(false);
      }, 1000);
    }
  };

  // No mostrar nada si no hay sesión
  if (!session?.user?._id) {
    return null;
  }

  return (
    <>
      <PaymentAlert
        invoiceCount={pendingInvoices.length}
        totalAmount={totalPendingAmount}
        onPayClick={handlePayClick}
        className={className}
      />
      
      {!showAlertOnly && (
        <InvoiceListModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          invoices={invoices}
          onPayInvoice={handlePayInvoice}
          onPayAll={handlePayAll}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default PaymentManager;