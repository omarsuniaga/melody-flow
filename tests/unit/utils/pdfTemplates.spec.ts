import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getPendingEventsTemplate } from '../../../src/utils/pdfTemplates';
import { mockEvent } from '../../fixtures/events';

const state = vi.hoisted(() => ({
  auth: { user: { displayName: 'Omar Suniaga' } },
  user: { fullName: '', bankData: [] as any[] },
  currency: { settings: { nativeCurrency: { code: 'DOP', name: 'Peso dominicano' } } },
}));
vi.mock('../../../src/stores/authStore', () => ({ useAuthStore: () => state.auth }));
vi.mock('../../../src/stores/userStore', () => ({ useUserStore: () => state.user }));
vi.mock('../../../src/stores/currencyStore', () => ({ useCurrencyStore: () => state.currency }));

const options = { period: new Date(2026, 8, 1), issuedAt: new Date(2026, 8, 26, 12) };
const sample = [
  { ...mockEvent, id: '4', date: '2026-09-19', location: 'Hotel Ocean El Faro', description: 'Cocktail Hour', amount: 7000, time: null },
  { ...mockEvent, id: '3', date: '2026-09-18', location: 'Hotel Hyatt', description: 'Lobby · Dúo', amount: 12000, time: null },
  { ...mockEvent, id: '1', date: '2026-09-12', location: 'Hotel Occidental Punta Cana', description: 'Cocktail Hour', amount: 7000, time: null },
  { ...mockEvent, id: '2', date: '2026-09-17', location: 'Hotel Lopesan Caoba', description: 'Cena', amount: 7000, time: null },
];
// Recorre solo valores textuales del documento: no callbacks de layout.
const textOf = (node: any): string => {
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  if (!node || typeof node !== 'object') return '';
  return [typeof node.text === 'string' ? node.text : '', ...Object.entries(node)
    .filter(([key]) => key !== 'text').map(([, value]) => textOf(value))].join('\n');
};
const render = (definition: any): Promise<Buffer> => {
  pdfMake.vfs = (pdfFonts as any).vfs || pdfFonts;
  return new Promise(resolve => pdfMake.createPdf(definition).getBuffer(resolve));
};

beforeEach(() => {
  state.user.bankData = [];
  state.currency.settings.nativeCurrency = { code: 'DOP', name: 'Peso dominicano' };
});

describe('reporte_eventos', () => {
  it('conserva fecha local, ubicación, descripción, horas faltantes, importes y firma', () => {
    const doc = getPendingEventsTemplate('FJ', sample, options);
    const text = textOf(doc.content);
    expect(text).toContain('12 sep 2026');
    expect(text).toContain('Hotel Occidental Punta Cana');
    expect(text).toContain('Cocktail Hour');
    expect(text).toContain('No registrada');
    expect(text).not.toContain('00:00');
    expect(text).toContain('33,000.00');
    expect(text).toContain('Omar Suniaga');
    expect(text).toContain('SEPTIEMBRE 2026');
    expect(sample[0].id).toBe('4'); // no muta la selección
  });

  it('no confunde importe del período con saldo pendiente ni duplica futuros en totales', () => {
    const text = textOf(getPendingEventsTemplate('FJ', [
      { ...sample[0], paymentStatus: 'Pagado' },
      { ...sample[1], date: '2026-09-30', time: '17:00' },
    ], options).content);
    expect(text).toContain('19,000.00');
    expect(text).toContain('12,000.00');
    expect(text).not.toContain('24,000.00');
    expect(text).toContain('PRÓXIMAS ACTIVIDADES');
    expect(text).toContain('17:00');
  });

  it('usa moneda configurada y solo cuentas activas', () => {
    state.currency.settings.nativeCurrency = { code: 'EUR', name: 'Euro' };
    state.user.bankData = [
      { bankName: 'Banco activo', accountNumber: '123456', fullName: 'Omar', active: true },
      { bankName: 'Banco oculto', accountNumber: '654321', fullName: 'Omar', active: false },
    ];
    const text = textOf(getPendingEventsTemplate('FJ', sample, options).content);
    expect(text).toContain('EUR');
    expect(text).toContain('Banco activo');
    expect(text).not.toContain('Banco oculto');
    expect(text).not.toContain('RD$');
  });

  it('rechaza datos inválidos sin generar un total parcial y admite servicios gratuitos', () => {
    expect(() => getPendingEventsTemplate('FJ', [{ ...sample[0], date: '2026-02-30' }])).toThrow();
    expect(() => getPendingEventsTemplate('FJ', [{ ...sample[0], amount: NaN }])).toThrow();
    expect(() => getPendingEventsTemplate('FJ', [{ ...sample[0], amount: 0 }])).not.toThrow();
    expect(() => getPendingEventsTemplate(' ', sample)).toThrow();
    expect(() => getPendingEventsTemplate('FJ', [])).toThrow();
  });

  it('renderiza un PDF real y un reporte largo con tres cuentas activas', async () => {
    const normal = await render(getPendingEventsTemplate('FJ', sample, options));
    expect(normal.subarray(0, 5).toString()).toBe('%PDF-');
    state.user.bankData = Array.from({ length: 3 }, (_, i) => ({
      bankName: `Banco de prueba ${i + 1}`, accountNumber: `000000000${i}`, fullName: 'Omar Suniaga',
      idNumber: 'Documento de prueba', email: 'prueba@example.com', phone: 'Contacto de prueba', active: true,
    }));
    const long = await render(getPendingEventsTemplate('Cliente con nombre largo para verificar el ajuste del encabezado',
      Array.from({ length: 45 }, (_, i) => ({ ...sample[i % 4], id: String(i),
        location: 'Hotel con ubicación extensa en Punta Cana, salón de celebraciones y eventos',
        description: 'Presentación musical con violín, piano y guitarra para ceremonia y recepción',
      })), options));
    expect(long.length).toBeGreaterThan(normal.length);
    // Exportación opcional para QA visual, sin archivos generados en el repositorio.
    if (process.env.PDF_PREVIEW_DIR) {
      writeFileSync(`${process.env.PDF_PREVIEW_DIR}/reporte_eventos_muestra.pdf`, normal);
      writeFileSync(`${process.env.PDF_PREVIEW_DIR}/reporte_eventos_largo.pdf`, long);
    }
  }, 20000);
});
