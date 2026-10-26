import { getActivePinia, setActivePinia, createPinia } from 'pinia';
import { format, isValid, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { useCurrencyStore } from '../stores/currencyStore';
import type { AppEvent } from '../types/event';

if (!getActivePinia()) setActivePinia(createPinia());

const colors = {
  navy: '#19354D', teal: '#10A6A2', ink: '#24374B', muted: '#6E8094',
  pale: '#EEF7F7', line: '#D8E3EC', stripe: '#F4F7FA', amber: '#B45309',
};
const pageWidth = 595.28;
const margin = 36;
const contentWidth = pageWidth - margin * 2;

export interface EventsReportOptions {
  /** Mes seleccionado en Balance; evita confundirlo con el mes de emisión. */
  period?: Date;
  issuedAt?: Date;
}

/** Cada fila conserva ubicación y descripción como datos independientes. */
const eventsTable = (events: AppEvent[], money: (amount: number) => string): Content => ({
  table: {
    headerRows: 1,
    dontBreakRows: true,
    // El ancho disponible incluye el padding de las seis columnas.
    widths: [55, '*', '*', 48, 80, 49],
    body: [
      ['FECHA', 'LUGAR / UBICACIÓN', 'DESCRIPCIÓN', 'HORA', 'MONTO', 'ESTADO'].map((text, i) => ({
        text, style: 'tableHeader', alignment: i === 4 ? 'right' : 'left',
      })),
      ...events.map(event => [
        { text: format(parseISO(event.date!), 'dd MMM yyyy', { locale: es }) },
        { text: event.location?.trim() || 'Sin ubicación' },
        { text: event.description?.trim() || 'Sin descripción' },
        { text: event.time?.trim() || 'No registrada', color: colors.muted },
        { text: money(event.amount), alignment: 'right', bold: true },
        { text: event.paymentStatus, color: event.paymentStatus === 'Pagado' ? '#15803D' : colors.amber },
      ] as TableCell[]),
    ],
  },
  layout: {
    hLineWidth: () => 0.4,
    vLineWidth: () => 0,
    hLineColor: () => colors.line,
    fillColor: (row: number) => row === 0 ? colors.navy : row % 2 === 0 ? colors.stripe : '#FFFFFF',
    paddingLeft: () => 7,
    paddingRight: () => 7,
    paddingTop: () => 9,
    paddingBottom: () => 9,
  },
  fontSize: 8,
  margin: [0, 0, 0, 12],
});

const getBankDataBlock = (): Content[] => {
  const banks = useUserStore().bankData.filter(bank => bank.active);
  if (!banks.length) return [];
  const columns = Math.min(banks.length, 3);
  const cells: TableCell[] = banks.map(bank => ({
    stack: [
      { text: bank.bankName, bold: true, color: colors.navy, margin: [0, 0, 0, 4] },
      ...[bank.accountNumber, bank.fullName, bank.idNumber, bank.email, bank.phone]
        .filter(Boolean).map(text => ({ text, color: colors.muted, margin: [0, 0, 0, 2] as [number, number, number, number] })),
    ],
  }));
  const rows: TableCell[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    const row = cells.slice(i, i + columns);
    while (row.length < columns) row.push({ text: '' });
    rows.push(row);
  }
  return [{
    stack: [
      { text: 'DATOS PARA EL PAGO', style: 'label', margin: [0, 0, 0, 8] },
      { table: { widths: Array(columns).fill('*'), body: rows, dontBreakRows: true }, layout: 'noBorders', fontSize: 8 },
    ],
    margin: [0, 16, 0, 0],
  }];
};

/** PDF vectorial con texto seleccionable; no depende de la imagen de la propuesta. */
export const getPendingEventsTemplate = (
  provider: string,
  events: AppEvent[],
  options: EventsReportOptions = {},
): TDocumentDefinitions => {
  if (typeof provider !== 'string' || !provider.trim()) {
    throw new Error('El nombre del proveedor es requerido y debe ser válido');
  }
  if (!Array.isArray(events) || !events.length) {
    throw new Error('Se requiere al menos un evento para generar el PDF');
  }
  // No omitir silenciosamente servicios: un reporte parcial alteraría sus totales.
  if (events.some(event => !event.date || !isValid(parseISO(event.date)) ||
      typeof event.amount !== 'number' || !Number.isFinite(event.amount))) {
    throw new Error('Hay eventos con fecha o monto inválido. Corrígelos antes de generar el PDF.');
  }
  const issuedAt = options.issuedAt ?? new Date();
  const sortedEvents = [...events].sort((a, b) =>
    a.date!.localeCompare(b.date!) || (a.time || '').localeCompare(b.time || ''));
  const firstDate = parseISO(sortedEvents[0].date!);
  const lastDate = parseISO(sortedEvents[sortedEvents.length - 1].date!);
  const monthLabel = (date: Date) => format(date, 'MMMM yyyy', { locale: es });
  const period = options.period ? monthLabel(options.period) :
    monthLabel(firstDate) === monthLabel(lastDate) ? monthLabel(firstDate) :
      `${monthLabel(firstDate)} - ${monthLabel(lastDate)}`;
  const currency = useCurrencyStore().settings.nativeCurrency;
  const money = (amount: number) => new Intl.NumberFormat('es-DO', {
    style: 'currency', currency: currency.code, minimumFractionDigits: 2,
  }).format(amount);
  const pending = sortedEvents.filter(event => event.paymentStatus === 'Pendiente');
  const total = sortedEvents.reduce((sum, event) => sum + event.amount, 0);
  const pendingTotal = pending.reduce((sum, event) => sum + event.amount, 0);
  // Solo se muestran próximas actividades presentes en la selección del usuario.
  // No se agregan otros clientes ni se incorporan de nuevo a los totales.
  const upcoming = sortedEvents.filter(event => parseISO(event.date!) > startOfDay(issuedAt));
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const issuer = authStore.user?.displayName?.trim() || userStore.fullName?.trim() ||
    userStore.bankData.find(bank => bank.active)?.fullName?.trim() || 'Servicios Musicales';
  const line = (): Content => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 0.5, lineColor: colors.line }] });
  const metric = (value: string, label: string): Content => ({
    stack: [
      { text: value, fontSize: 19, bold: true, color: colors.navy, margin: [0, 0, 0, 5] },
      { text: label, fontSize: 7, color: colors.muted, characterSpacing: 0.5 },
    ], margin: [12, 12, 8, 12],
  });

  return {
    pageSize: 'A4',
    pageMargins: [margin, 30, margin, 48],
    info: { title: `Resumen de servicios musicales - ${provider} - ${period}`, author: issuer },
    footer: (currentPage, pageCount) => ({
      stack: [line(), {
        columns: [
          { text: `Servicios musicales · ${period}`, width: '*', fontSize: 7, color: colors.muted },
          { text: `${currentPage} / ${pageCount}`, width: 40, alignment: 'right', fontSize: 7, color: colors.muted },
        ], margin: [0, 7, 0, 0],
      }], margin: [margin, 8, margin, 0],
    }),
    content: [
      {
        table: { widths: ['*'], body: [[{
          stack: [
            { text: `${issuer.toLocaleUpperCase('es')} · SERVICIOS MUSICALES`, fontSize: 8, color: '#A2DDDA', characterSpacing: 1, margin: [0, 0, 0, 15] },
            { columns: [
              { width: '*', stack: [
                { text: 'Resumen mensual', fontSize: 26, bold: true, color: '#FFFFFF' },
                { text: 'de servicios musicales', fontSize: 21, color: '#FFFFFF' },
              ] },
              { width: 90, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="55" viewBox="0 0 90 55"><g stroke="#568299" stroke-width="0.6"><path d="M0 15h90M0 22h90M0 29h90M0 36h90M0 43h90"/></g><g fill="#6C9BAC"><ellipse cx="30" cy="37" rx="6" ry="4"/><ellipse cx="65" cy="30" rx="6" ry="4"/></g><path d="M35 37V8l35 -7v29M35 8l35 -7" fill="none" stroke="#6C9BAC" stroke-width="2"/></svg>' },
            ] },
            { text: period.toLocaleUpperCase('es'), fontSize: 9, color: '#A2DDDA', characterSpacing: 1.5, margin: [0, 16, 0, 0] },
          ], margin: [18, 16, 18, 18], fillColor: colors.navy,
        }]] }, layout: 'noBorders', margin: [0, 0, 0, 20],
      },
      {
        columns: [
          { width: '*', stack: [
            { text: 'PREPARADO PARA', style: 'label' },
            { text: provider.trim(), fontSize: 17, bold: true, margin: [0, 5, 0, 0] },
          ] },
          { width: 175, stack: [
            { text: 'FECHA DE EMISIÓN', style: 'label' },
            { text: format(issuedAt, 'dd MMM yyyy', { locale: es }), fontSize: 12, margin: [0, 5, 0, 0] },
          ] },
        ], margin: [0, 0, 0, 18],
      },
      {
        table: { widths: ['*', '*', '*'], body: [[
          metric(String(sortedEvents.length), 'SERVICIOS DEL PERÍODO'),
          metric(String(pending.length), 'PENDIENTES DE PAGO'),
          metric(money(pendingTotal), 'SALDO PENDIENTE'),
        ]] },
        layout: { ...{ hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 }, fillColor: () => colors.pale },
        margin: [0, 0, 0, 18],
      },
      { text: 'Detalle de servicios del período', fontSize: 12, bold: true, margin: [0, 0, 0, 9] },
      eventsTable(sortedEvents, money),
      {
        unbreakable: true,
        columns: [
          { width: '*', stack: [
            { text: `Moneda: ${currency.name} (${currency.code})`, fontSize: 8, color: colors.muted },
            { text: `Importe del período: ${money(total)}`, fontSize: 8, color: colors.muted, margin: [0, 5, 0, 0] },
          ], margin: [0, 8, 12, 0] },
          { width: 205, table: { widths: ['*'], body: [[{
            stack: [
              { text: 'TOTAL PENDIENTE DE PAGO', style: 'label', alignment: 'right' },
              { text: money(pendingTotal), fontSize: 22, bold: true, alignment: 'right', margin: [0, 7, 0, 0] },
            ], fillColor: colors.pale, margin: [12, 10, 12, 10],
          }]] }, layout: 'noBorders' },
        ], margin: [0, 0, 0, 18],
      },
      { text: 'PRÓXIMAS ACTIVIDADES', style: 'label', margin: [0, 0, 0, 8] },
      ...(upcoming.length ? [
        { text: 'Incluidas en este reporte; sus importes ya forman parte del resumen.', fontSize: 8, color: colors.muted, margin: [0, 0, 0, 8] } as Content,
        eventsTable(upcoming, money),
      ] : [{ text: 'No hay actividades posteriores a la fecha de emisión en la selección del reporte.', fontSize: 8.5, color: colors.muted, margin: [0, 0, 0, 16] } as Content]),
      {
        unbreakable: true,
        stack: [
          { text: 'Gracias por hacerme parte de sus momentos especiales.', fontSize: 12, bold: true, color: colors.navy, margin: [0, 0, 0, 7] },
          { text: 'Agradezco la confianza en mis servicios musicales. Es un placer acompañar cada encuentro con música y dedicación. Quedo a su disposición para coordinar próximas presentaciones y dar seguimiento a los servicios detallados.', fontSize: 9, color: colors.muted, lineHeight: 1.2 },
        ], margin: [0, 4, 0, 0],
      },
      ...getBankDataBlock(),
      {
        unbreakable: true,
        stack: [
          { text: issuer, fontSize: 12, bold: true, alignment: 'right' },
          { text: 'Servicios Musicales', fontSize: 9, color: colors.muted, alignment: 'right', margin: [0, 3, 0, 0] },
        ], margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      label: { fontSize: 7.5, bold: true, characterSpacing: 0.8, color: colors.muted },
      tableHeader: { fontSize: 7, bold: true, color: '#FFFFFF' },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: colors.ink },
  };
};
