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

// Función para formatear moneda usando la del usuario
const formatCurrency = (amount: number, currency?: string): string => {
  const userStore = useUserStore();
  const currencyCode = currency || userStore.settings?.nativeCurrency?.code || 'MXN';
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch {
    // Fallback si la moneda no es válida
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
};

/**
 * Obtiene el bloque de información bancaria, mostrando todas las cuentas activas.
 * Las cuentas se muestran en columnas (hasta 3), adaptándose a la cantidad disponible.
 * Estilo minimalista: sin cajas ni fondos, solo tipografía y una línea divisoria fina.
 */
const getBankDataBlock = (): any[] => {
  const userStore = useUserStore();
  const activeBanks = (userStore.bankData || []).filter(bank => bank.active);

  if (activeBanks.length === 0) {
    return [];
  }

  const muted = '#71717a';
  const faint = '#a1a1aa';
  const ink = '#18181b';
  const hairline = '#e4e4e7';

  const numColumns = Math.min(activeBanks.length, 3);
  const columnWidths = Array(numColumns).fill('*');

  const bankCells = activeBanks.map(bank => ({
    stack: [
      { text: bank.bankName, fontSize: 10, bold: true, color: ink, margin: [0, 0, 0, 4] },
      { text: bank.accountNumber, fontSize: 9, color: muted, margin: [0, 0, 0, 2] },
      { text: bank.fullName, fontSize: 9, color: muted, margin: [0, 0, 0, 2] },
      { text: bank.idNumber, fontSize: 8.5, color: faint, margin: [0, 0, 0, 2] },
      { text: bank.email, fontSize: 8.5, color: faint, margin: [0, 0, 0, 2] },
      { text: bank.phone, fontSize: 8.5, color: faint }
    ],
    margin: [0, 0, 16, 0]
  }));

  while (bankCells.length < numColumns) {
    bankCells.push({ stack: [], margin: [0, 0, 16, 0] });
  }

  return [
    {
      text: 'DATOS BANCARIOS',
      fontSize: 8,
      bold: true,
      color: faint,
      characterSpacing: 1,
      margin: [0, 0, 0, 10]
    },
    {
      table: {
        widths: columnWidths,
        body: [bankCells]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 4]
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: hairline }],
      margin: [0, 8, 0, 0]
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

  // Validar entrada
  if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
    throw new Error('El nombre del proveedor es requerido y debe ser válido');
  }

  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('Se requiere al menos un evento para generar el PDF');
  }

  // Validar campos requeridos en cada evento
  const validatedEvents = events.filter((event: Event) => {
    return event.date && event.location && event.amount && typeof event.amount === 'number';
  });

  if (validatedEvents.length === 0) {
    throw new Error('Ninguno de los eventos contiene los datos requeridos (fecha, ubicación, monto)');
  }

  // Ordenar eventos: primero por paymentStatus (Pendiente antes), luego por fecha descendente
  const sortedEvents = [...validatedEvents].sort((a: Event, b: Event) => {
    const statusOrder = a.paymentStatus === 'Pendiente' ? -1 : 1;
    if (statusOrder !== (b.paymentStatus === 'Pendiente' ? -1 : 1)) {
      return statusOrder - (b.paymentStatus === 'Pendiente' ? -1 : 1);
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalAmount = sortedEvents.reduce((sum, event) => sum + (event.amount || 0), 0);
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const currencyCode = userStore.settings?.nativeCurrency?.code || 'MXN';

  // Obtener bloque bancario (array vacío si no hay cuenta activa)
  const bankDataBlock = getBankDataBlock();

  // Log de auditoría
  console.log(`[PDF] Generando reporte para proveedor: ${provider}, eventos: ${sortedEvents.length}, monto total: ${formatCurrency(totalAmount, currencyCode)}`);

  // Paleta minimalista: tinta casi negra, grises neutros, un único acento sobrio
  const ink = '#18181b';       // texto principal
  const muted = '#71717a';     // texto secundario
  const faint = '#a1a1aa';     // texto terciario / metadata
  const hairline = '#e4e4e7';  // líneas divisorias
  const accent = '#18181b';    // acento (mismo tono que ink → look monocromático)
  const paidColor = '#16a34a';
  const pendingColor = '#b45309';

  return {
    fileName: `${provider}_${currentDate}.pdf`,
    pageSize: 'LETTER',
    pageMargins: [48, 70, 48, 56],
    header: () => ({
      stack: [
        {
          columns: [
            { text: 'MELODYFLOW', fontSize: 9, bold: true, color: ink, characterSpacing: 2 },
            { text: 'REPORTE DE ACTIVIDADES', fontSize: 8, color: faint, alignment: 'right', characterSpacing: 1 }
          ],
          margin: [48, 28, 48, 8]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: hairline }],
          margin: [48, 0, 48, 0]
        }
      ]
    }),
    footer: (currentPage: number, pageCount: number) => ({
      stack: [
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: hairline }],
          margin: [48, 0, 48, 6]
        },
        {
          columns: [
            { text: format(new Date(), "d 'de' MMMM, yyyy", { locale: es }), alignment: 'left', fontSize: 7.5, color: faint },
            { text: `${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 7.5, color: faint }
          ],
          margin: [48, 0, 48, 18]
        }
      ]
    }),
    content: [
      // Título del documento
      {
        text: 'Resumen de eventos pendientes',
        fontSize: 22,
        bold: true,
        color: ink,
        margin: [0, 4, 0, 2]
      },
      {
        text: `Preparado para ${provider}`,
        fontSize: 11,
        color: muted,
        margin: [0, 0, 0, 28]
      },

      // Fila de métricas clave (estilo "stat cards" minimalista)
      {
        columns: [
          {
            width: 'auto',
            stack: [
              { text: 'EVENTOS', fontSize: 8, color: faint, characterSpacing: 1, margin: [0, 0, 0, 3] },
              { text: sortedEvents.length.toString(), fontSize: 20, bold: true, color: ink }
            ]
          },
          {
            width: 40,
            text: ''
          },
          {
            width: 'auto',
            stack: [
              { text: 'MONTO TOTAL', fontSize: 8, color: faint, characterSpacing: 1, margin: [0, 0, 0, 3] },
              { text: formatCurrency(totalAmount, currencyCode), fontSize: 20, bold: true, color: ink }
            ]
          }
        ],
        margin: [0, 0, 0, 8]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: hairline }],
        margin: [0, 0, 0, 24]
      },

      // Tabla principal de eventos — sin rejilla, solo separadores finos
      {
        table: {
          headerRows: 1,
          widths: [62, '*', 40, 70, 75],
          body: [
            [
              { text: 'FECHA', style: 'tableHeader' },
              { text: 'UBICACIÓN', style: 'tableHeader' },
              { text: 'HORA', style: 'tableHeader' },
              { text: 'ESTADO', style: 'tableHeader' },
              { text: 'MONTO', style: 'tableHeader', alignment: 'right' }
            ],
            ...sortedEvents.map((event: Event) => [
              { text: format(new Date(event.date), 'dd MMM yyyy', { locale: es }), style: 'cell' },
              { text: event.description || event.location, style: 'cell' },
              { text: event.time || '—', style: 'cell' },
              {
                text: event.paymentStatus === 'Pagado' ? 'Pagado' : 'Pendiente',
                style: 'cell',
                color: event.paymentStatus === 'Pagado' ? paidColor : pendingColor
              },
              { text: formatCurrency(event.amount, currencyCode), style: 'cell', alignment: 'right', bold: true }
            ])
          ]
        },
        layout: {
          hLineWidth: (i: number, node: any): number =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.75 : 0.5,
          vLineWidth: (): number => 0,
          hLineColor: (i: number): string => (i === 0 || i === 1 ? ink : hairline),
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 8,
          paddingBottom: () => 8
        },
        margin: [0, 0, 0, 4]
      },

      // Total final alineado a la derecha, a modo de cierre de tabla
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [[
                { text: 'TOTAL', fontSize: 8, color: faint, characterSpacing: 1, alignment: 'right', border: [false, false, false, false] },
                { text: formatCurrency(totalAmount, currencyCode), fontSize: 13, bold: true, color: ink, alignment: 'right', border: [false, false, false, false] }
              ]]
            },
            layout: 'noBorders',
            margin: [0, 10, 0, 0]
          }
        ],
        margin: [0, 0, 0, 32]
      },

      // Nota final — breve y discreta
      {
        text: 'Gracias por la confianza depositada en estos servicios musicales. Quedo atento a la gestión del pago correspondiente.',
        fontSize: 9.5,
        color: muted,
        italics: true,
        margin: [0, 0, 0, bankDataBlock.length ? 20 : 4]
      },

      // Datos bancarios (solo si existen cuentas activas)
      ...bankDataBlock,

      // Firma
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 180,
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5, lineColor: hairline }], margin: [0, 36, 0, 6] },
              { text: authStore.user?.displayName || 'Usuario', fontSize: 10, bold: true, color: ink, alignment: 'center' },
              { text: 'Servicios Musicales', fontSize: 8.5, color: muted, alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: {
      headerBank: {
        fontSize: 8,
        bold: true,
        color: faint,
        characterSpacing: 1
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: faint,
        characterSpacing: 1
      },
      cell: {
        fontSize: 9.5,
        color: ink
      }
    },
    defaultStyle: {
      font: 'Roboto',
      color: ink
    }
  };
};
