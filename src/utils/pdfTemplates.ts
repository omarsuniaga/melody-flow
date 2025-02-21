import { getActivePinia, setActivePinia, createPinia } from 'pinia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';

// Inicializar Pinia si es necesario
if (!getActivePinia()) {
  setActivePinia(createPinia());
}

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

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// Template del PDF
export const getPendingEventsTemplate = (provider: string, events: Event[]) => {
  const user = useAuthStore();
  // Ordenar eventos por fecha (asumiendo que event.date es un string en formato reconocible por Date)
  const sortedEvents = [...events].sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalAmount = sortedEvents.reduce((sum, event) => sum + event.amount, 0);
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  return {
    fileName: `${provider}_${currentDate}.pdf`, // Nombre del archivo con proveedor y fecha de emisión
    pageSize: 'LETTER',
    pageMargins: [40, 80, 40, 60],
    header: () => ({
      columns: [
        {
          text: 'REPORTE DE ACTIVIDADES MUSICALES',
          alignment: 'center',
          fontSize: 20,
          bold: true,
          color: '#2563eb',
          margin: [0, 20]
        }
      ]
    }),
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: format(new Date(), 'dd/MM/yyyy HH:mm:ss'), alignment: 'left', fontSize: 8 },
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 8 }
      ],
      margin: [40, 20]
    }),
    content: [
      // Encabezado con información del proveedor
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: `Estimado/a: ${provider}`, fontSize: 16, bold: true, color: '#1e40af' },
              { text: 'Proveedor de Servicios Musicales', fontSize: 10, color: '#6b7280', margin: [0, 0, 0, 20] }
            ]
          },
          {
            width: 'auto',
            stack: [
              { text: formatCurrency(totalAmount), fontSize: 18, bold: true, color: '#059669', alignment: 'right' },
              { text: 'Total Pendiente', fontSize: 10, color: '#6b7280', alignment: 'right' }
            ]
          }
        ],
        margin: [0, 0, 0, 30]
      },

      // Resumen de eventos
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Total de Eventos', events.length.toString()],
            ['Promedio por Evento', formatCurrency(totalAmount / events.length)],
            ['Monto Total', formatCurrency(totalAmount)]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 30]
      },

     
     

      // Tabla principal de eventos
      {
        table: {
          headerRows: 1,
          widths: [80, 120, 50, '*', 70],
          body: [
        [
          { text: 'FECHA', style: 'tableHeader' },
          { text: 'UBICACIÓN', style: 'tableHeader' },
          { text: 'HORA', style: 'tableHeader' },
          { text: 'DESCRIPCIÓN', style: 'tableHeader' },
          { text: 'MONTO', style: 'tableHeader' }
        ],
        ...sortedEvents.map((event: Event, i: number) => [
          { text: event.date, style: i % 2 === 0 ? 'evenRow' : 'oddRow' },
          { text: event.location, style: i % 2 === 0 ? 'evenRow' : 'oddRow' },
          { text: event.time || 'N/A', style: i % 2 === 0 ? 'evenRow' : 'oddRow' },
          { text: event.description, style: i % 2 === 0 ? 'evenRow' : 'oddRow' },
          { 
            text: formatCurrency(event.amount), 
            alignment: 'right',
            style: i % 2 === 0 ? 'evenRow' : 'oddRow'
          }
        ])
          ]
        },
        layout: {
          hLineWidth: function (i: number, node: any): number {
        return (i === 0 || i === node.table.body.length) ? 0 : 0.5;
          },
          vLineWidth: function (): number {
            return 0;
          },
          hLineColor: '#aaaaaa',
          paddingTop: function() { return 4; },
          paddingBottom: function() { return 4; }
        },
        margin: [0, 0, 0, 30]
      },
       // Nuevo bloque de texto con el mensaje solicitado
       {
        text: `Adjunto el resumen detallado de los eventos pendientes de pago, que ascienden a un total de ${formatCurrency(totalAmount)}.
        
        Agradezco la confanza depositada en mis servicios musicales y espero seguir contando con su preferencia para futuros eventos.
Quedo atento a la gestión del pago correspondiente y a cualquier duda o aclaración adicional que pueda surgir.

Saludos Cordiales,
`,
        fontSize: 12,
        margin: [0, 20, 0, 30]
      },
      // Firma y pie de página
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              '\n\n_____________________',
              user.user?.displayName || 'Usuario',
              'Servicios Musicales',
              `Fecha: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`
            ],
            alignment: 'center',
            margin: [0, 30, 0, 0]
          },
          { width: '*', text: '' }
        ]
      }
    ],
    styles: {
      label: {
        fontSize: 10,
        color: '#6b7280'
      },
      value: {
        fontSize: 12,
        bold: true
      },
      totalAmount: {
        fontSize: 20,
        bold: true,
        color: '#059669'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: 'white',
        fillColor: '#2563eb',
        alignment: 'center',
        padding: 8
      },
      evenRow: {
        fontSize: 9,
        padding: 6,
        fillColor: '#f8fafc'
      },
      oddRow: {
        fontSize: 9,
        padding: 6,
        fillColor: 'white'
      },
      totalToPay: {
        fontSize: 14,
        bold: true,
        color: '#059669'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };
};
