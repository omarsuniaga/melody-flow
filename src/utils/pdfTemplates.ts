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
export const getPendingEventsTemplate = async (provider: string, events: Event[]) => {
  const eventStore = useEventStore();
  const totalAmount = events.reduce((sum, event) => sum + event.amount, 0);

  // Obtener el total histórico de eventos con este proveedor
  const allProviderEvents = eventStore.events.filter(e => e.provider === provider);

  const letterContent = await generateLetter(
    provider,
    totalAmount
  );

  return {
    content: [
      {
        text: 'Reporte de Eventos Pendientes',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: `Estimado/a: ${provider}`,
        style: 'subheader',
        margin: [0, 0, 0, 10]
      },
      {
        text: `Fecha de generación: ${format(new Date(), 'dd/MM/yyyy')}`,
        margin: [0, 0, 0, 20]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', 'auto', 'auto'],
          body: [
            ['Fecha', 'Lugar', 'Descripción', 'Hora', 'Monto'],
            ...events.map(event => [
              format(new Date(event.date), 'dd/MM/yyyy'),
              event.location,
              event.description,
              event.time,
              formatCurrency(event.amount)
            ])
          ]
        }
      },
      {
        text: `Monto Total Pendiente: ${formatCurrency(totalAmount)}`,
        style: 'total',
        margin: [0, 20, 0, 0]
      },
      {
        text: letterContent,
        margin: [0, 20, 0, 20],
        alignment: 'justify'
      },
    ],
    styles
  };
};
