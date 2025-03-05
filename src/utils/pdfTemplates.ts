import { getActivePinia, setActivePinia, createPinia } from 'pinia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';

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

/**
 * Obtiene el bloque de información bancaria, mostrando todas las cuentas activas.
 * Las cuentas se muestran en columnas (hasta 3), adaptándose a la cantidad disponible.
 */
const getBankDataBlock = (): any[] => {
  const userStore = useUserStore();
  // Obtenemos solo las cuentas activas
  const activeBanks = (userStore.bankData || []).filter(bank => bank.active);
  
  if (activeBanks.length === 0) {
    return [];
  }
  
  // Determinamos el número de columnas según la cantidad de cuentas activas
  const numColumns = Math.min(activeBanks.length, 3);
  const columnWidth = Math.floor(100 / numColumns) + '%';
  const columnWidths = Array(numColumns).fill(columnWidth);
  
  // Creamos las celdas para cada cuenta bancaria
  const bankCells = activeBanks.map(bank => ({
    stack: [
      { text: `Banco: ${bank.bankName}`, fontSize: 9 },
      { text: `Cuenta: ${bank.accountNumber}`, fontSize: 9 },
      { text: `Documento: ${bank.idNumber}`, fontSize: 9 },
      { text: `Nombre: ${bank.fullName}`, fontSize: 9 },
      { text: `Correo: ${bank.email}`, fontSize: 9 },
      { text: `Teléfono: ${bank.phone}`, fontSize: 9 },
    ],
    margin: [5, 5, 5, 5]
  }));
  
  // Si hay menos de 3 cuentas, rellenamos con celdas vacías para mantener la estructura
  while (bankCells.length < numColumns) {
    bankCells.push({
      stack: [],
      margin: [5, 5, 5, 5]
    });
  }
  
  // Creamos un bloque que simula un recuadro con border y padding
  return [
    {
      text: 'Datos Bancarios',
      style: 'headerBank',
      margin: [0, 10, 0, 5]
    },
    {
      table: {
        widths: columnWidths,
        body: [bankCells]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: '#cccccc',
        vLineColor: '#cccccc',
        paddingLeft: () => 5,
        paddingRight: () => 5,
        paddingTop: () => 5,
        paddingBottom: () => 5
      },
      margin: [0, 0, 0, 10]
    }
  ];
};

/**
 * Template del PDF de eventos pendientes.
 * Se integra la información bancaria (si existe cuenta activa) justo después del párrafo final del resumen, antes de la firma.
 */
export const getPendingEventsTemplate = (provider: string, events: Event[]) => {
  const authStore = useAuthStore();
  const userStore = useUserStore();

  // Ordenar eventos por fecha
  const sortedEvents = [...events].sort(
    (a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const totalAmount = sortedEvents.reduce((sum, event) => sum + event.amount, 0);
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  // Obtener bloque bancario (array vacío si no hay cuenta activa)
  const bankDataBlock = getBankDataBlock();

  return {
    fileName: `${provider}_${currentDate}.pdf`,
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
              { text: formatCurrency(totalAmount), fontSize: 11, bold: true, color: '#059669', alignment: 'right' },
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
          hLineWidth: (i: number, node: any): number =>
            i === 0 || i === node.table.body.length ? 0 : 0.5,
          vLineWidth: (): number => 0,
          hLineColor: '#aaaaaa',
          paddingTop: () => 4,
          paddingBottom: () => 4
        },
        margin: [0, 0, 0, 30]
      },
      // Párrafo final del resumen de eventos pendientes
      {
        text: `Adjunto el resumen detallado de los eventos pendientes de pago, correspondiente al mes.

Quiero agradecer la confianza depositada en mis servicios musicales y espero seguir contando con su preferencia para futuros eventos.
Quedo atento a la gestión del pago correspondiente y a cualquier duda o aclaración adicional que pueda surgir.`,
        fontSize: 11,
        margin: [0, 20, 0, 10]
      },
      // Bloque informativo previo a los datos bancarios
      // Bloque de datos bancarios (se renderiza solo si existe cuenta activa)
      ...bankDataBlock,
      // Firma y pie de página
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              '\n\n_____________________',
              authStore.user?.displayName || 'Usuario',
              'Servicios Musicales',
              `${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`
            ],
            alignment: 'center',
            margin: [0, 10, 0, 0]
          },
          { width: '*', text: '' }
        ]
      }
    ],
    styles: {
      headerBank: {
        fontSize: 11,
        bold: true,
        color: '#374151'
      },
      boldLabel: {
        fontSize: 10,
        bold: true,
        margin: [0, 2, 0, 2]
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
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };
};
