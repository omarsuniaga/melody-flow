import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { format } from 'date-fns';
import { generateLetter } from '../services/geminiService';
import { useEventStore } from '../stores/eventStore';

// Tipos
interface Event {
  date: string;
  location: string;
  time: string;
  amount: number;
  description: string;
  provider: string;
  paymentStatus: string;
}

interface PdfStyles {
  [key: string]: {
    fontSize?: number;
    bold?: boolean;
    alignment?: string;
  }
}

// Estilos del PDF
const styles: PdfStyles = {
  header: {
    fontSize: 18,
    bold: true,
  },
  subheader: {
    fontSize: 14,
    bold: true,
  },
  total: {
    fontSize: 14,
    bold: true,
    alignment: 'right',
  }
};

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Configuración del PDF de eventos pendientes
export const getPendingEventsTemplate = async (provider: string, events: Event[] = []): Promise<TDocumentDefinitions> => {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('No hay eventos para generar el reporte');
  }

  const totalAmount = events.reduce((sum, event) => sum + (Number(event?.amount) || 0), 0);
  const letterContent = await generateLetter(provider, totalAmount);

  return {
    pageSize: 'LETTER',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        text: 'Reporte de Eventos Pendientes',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: `Proveedor: ${provider}`,
        style: 'subheader',
        margin: [0, 0, 0, 10]
      },
      {
        text: `Fecha de generación: ${format(new Date(), 'dd/MM/yyyy')}`,
        margin: [0, 0, 0, 20]
      },
      {
        layout: 'lightHorizontalLines',
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', 'auto', 'auto'],
          body: [
            [
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Lugar', style: 'tableHeader' },
              { text: 'Descripción', style: 'tableHeader' },
              { text: 'Hora', style: 'tableHeader' },
              { text: 'Monto', style: 'tableHeader' }
            ],
            ...events.map(event => [
              format(new Date(event.date), 'dd/MM/yyyy'),
              event.location || 'N/A',
              event.description || 'Sin descripción',
              event.time || 'N/A',
              formatCurrency(Number(event.amount) || 0)
            ])
          ]
        }
      },
      {
        text: `Monto Total: ${formatCurrency(totalAmount)}`,
        style: 'total',
        margin: [0, 20, 0, 20]
      },
      {
        text: letterContent,
        style: 'content',
        margin: [0, 20, 0, 20]
      }
    ],
    styles: {
      ...styles,
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#2563eb',
        fillColor: '#f3f4f6'
      },
      content: {
        fontSize: 11,
        alignment: 'justify'
      }
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10
    }
  };
};
