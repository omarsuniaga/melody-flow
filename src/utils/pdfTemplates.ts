import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
  // obtener normbre del usuario desde authStore
  const user = useAuthStore();
  console.log(user.user?.displayName);

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

// Nueva función para generar el mensaje estático
const generateStaticLetter = (provider: string, totalAmount: number): string => {
  return `
    Estimado/a ${provider},

    Adjunto el resumen detallado de los eventos pendientes de pago, que ascienden a un total de ${formatCurrency(totalAmount)}. 
    Agradezco la confianza depositada en mis servicios musicales y espero seguir contando con su preferencia para futuros eventos.

    Quedo atento a la gestión del pago correspondiente.

    Saludos Cordiales,
    ${user.user?.displayName || 'Usuario'}
  `.trim();
};

// Configuración del PDF de eventos pendientes
export const getPendingEventsTemplate = async (provider: string, events: Event[] = []): Promise<TDocumentDefinitions> => {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('No hay eventos para generar el reporte');
  }

  const totalAmount = events.reduce((sum, event) => sum + (Number(event?.amount) || 0), 0);
  // Usar el mensaje estático en lugar de Gemini
  const letterContent = generateStaticLetter(provider, totalAmount);



  // Calcular estadísticas
  const locationStats = events.reduce((acc, event) => {
    acc[event.location] = (acc[event.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    pageSize: 'LETTER',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Encabezado
      {
        text: 'REPORTE DE EVENTOS PENDIENTES',
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
        text: `Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`,
        margin: [0, 0, 0, 20]
      },

      // Resumen General
      {
        text: 'RESUMEN GENERAL',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Total de Eventos', events.length.toString()],
            ['Monto Total', formatCurrency(totalAmount)],
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Estadísticas por Ubicación
      {
        text: 'DISTRIBUCIÓN POR UBICACIÓN',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Ubicación', 'Cantidad de Eventos'],
            ...Object.entries(locationStats).map(([location, count]) => [
              location,
              count.toString()
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Detalle de Eventos
      {
        text: 'DETALLE DE EVENTOS',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10]
      },
      {
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

      // Monto Total y Mensaje
      {
        text: `Monto Total Pendiente: ${formatCurrency(totalAmount)}`,
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
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#2563eb',
        margin: [0, 20, 0, 10]
      },
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
      // Cambiar Helvetica por Roboto que viene por defecto en pdfmake
      font: 'Roboto',
      fontSize: 10
    },
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      margin: [0, 20]
    })
  };
};
