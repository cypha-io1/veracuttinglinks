'use client';

import { useRef } from 'react';
import { FiPrinter } from 'react-icons/fi';

interface OrderItem {
  id: string;
  name: string;
  size: string;
  crust?: string;
  toppings: string[];
  notes?: string;
  quantity: number;
}

interface KitchenTicketProps {
  orderNumber: string;
  type: 'delivery' | 'pickup' | 'dine-in';
  branch: string;
  items: OrderItem[];
  placedAt: Date;
  priority?: boolean;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export default function PrintableKitchenTicket({
  orderNumber,
  type,
  branch,
  items,
  placedAt,
  priority = false,
  customerName,
  customerPhone,
  deliveryAddress,
  specialInstructions,
}: KitchenTicketProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printableRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printableRef.current.outerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatTime = () => {
    return placedAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-bold transition-colors"
      >
        <FiPrinter size={18} />
        Print Ticket
      </button>

      {/* Hidden Printable Content */}
      <div
        ref={printableRef}
        className="hidden"
        style={{
          width: '80mm',
          padding: '0',
          fontFamily: 'monospace',
        }}
      >
        <style>{`
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
              color: black;
            }
            .kitchen-ticket {
              width: 80mm;
              padding: 0;
              margin: 0;
              background: white;
              color: black;
              font-family: 'Courier New', monospace;
              line-height: 1.2;
            }
          }
        `}</style>

        <div className="kitchen-ticket p-0" style={{ width: '80mm' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid black', padding: '5mm' }}>
            <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>PIZZA CITY</div>
            <div style={{ fontSize: '9pt', marginTop: '2mm' }}>KITCHEN TICKET</div>
          </div>

          {/* Order Info */}
          <div style={{ padding: '3mm 5mm', borderBottom: '1px solid black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>ORDER {orderNumber}</div>
                <div style={{ fontSize: '8pt' }}>{formatTime()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {type}
                </div>
                <div style={{ fontSize: '8pt' }}>{branch}</div>
              </div>
            </div>

            {priority && (
              <div
                style={{
                  marginTop: '2mm',
                  padding: '2mm',
                  backgroundColor: '#000',
                  color: '#fff',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '9pt',
                }}
              >
                ★ PRIORITY ORDER
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ padding: '3mm 5mm', borderBottom: '1px solid black' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '2mm' }}>ITEMS:</div>
            {items.map((item, index) => (
              <div key={index} style={{ marginBottom: '3mm', paddingBottom: '2mm', borderBottom: '1px dotted #999' }}>
                <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>
                  {item.quantity}x {item.name.toUpperCase()}
                </div>
                <div style={{ fontSize: '8pt', color: '#333' }}>
                  {item.size}
                  {item.crust ? ` ${item.crust}` : ''}
                </div>

                {item.toppings.length > 0 && (
                  <div
                    style={{
                      fontSize: '8pt',
                      color: '#666',
                      marginTop: '1mm',
                    }}
                  >
                    + {item.toppings.join(', ')}
                  </div>
                )}

                {item.notes && (
                  <div
                    style={{
                      fontSize: '8pt',
                      fontWeight: 'bold',
                      color: '#000',
                      marginTop: '1mm',
                      padding: '1mm',
                      backgroundColor: '#ffff99',
                    }}
                  >
                    * {item.notes.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Special Instructions */}
          {specialInstructions && (
            <div style={{ padding: '3mm 5mm', borderBottom: '1px solid black', backgroundColor: '#ffffcc' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>SPECIAL INSTRUCTIONS:</div>
              <div style={{ fontSize: '9pt', marginTop: '1mm', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {specialInstructions}
              </div>
            </div>
          )}

          {/* Customer Info (for delivery/pickup) */}
          {(type === 'delivery' || type === 'pickup') && (
            <div style={{ padding: '3mm 5mm', borderBottom: '1px solid black' }}>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2mm' }}>
                {type === 'delivery' ? 'DELIVERY' : 'PICKUP'} INFO:
              </div>
              {customerName && (
                <div style={{ fontSize: '9pt' }}>Name: {customerName}</div>
              )}
              {customerPhone && (
                <div style={{ fontSize: '9pt' }}>Phone: {customerPhone}</div>
              )}
              {deliveryAddress && type === 'delivery' && (
                <div style={{ fontSize: '8pt', marginTop: '1mm', whiteSpace: 'pre-wrap' }}>
                  Address:
                  <br />
                  {deliveryAddress}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '3mm 5mm', textAlign: 'center' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold', marginBottom: '2mm' }}>
              ★ PREPARE & ORGANIZE ★
            </div>
            <div style={{ fontSize: '8pt', color: '#666' }}>
              Print Time: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
