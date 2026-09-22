import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CalendarDay from '../../../src/components/CalendarDay.vue';
import { mockEvent1, mockEvent2 } from '../../fixtures/events';

describe('CalendarDay.vue', () => {
  const testDate = new Date(2026, 3, 15); // 15 de abril de 2026

  it('renderiza el número de día correctamente', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: testDate,
        events: [],
        isCurrentMonth: true,
        isMobile: false
      }
    });

    expect(wrapper.text()).toContain('15');
  });

  it('emite "click-day" con la fecha al hacer click', async () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: testDate,
        events: [],
        isCurrentMonth: true,
        isMobile: false
      }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click-day')).toBeTruthy();
    expect(wrapper.emitted('click-day')![0]).toEqual([testDate]);
  });

  it('aplica opacidad reducida cuando no es del mes actual', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: testDate,
        events: [],
        isCurrentMonth: false,
        isMobile: false
      }
    });

    expect(wrapper.classes()).toContain('opacity-50');
  });

  it('asigna color de fondo rosa cuando hay eventos con pago pendiente', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: testDate,
        events: [mockEvent1], // mockEvent1 tiene paymentStatus: 'Pendiente'
        isCurrentMonth: true,
        isMobile: false
      }
    });

    expect(wrapper.classes()).toContain('bg-pink-100');
  });

  it('asigna color de fondo verde cuando todos los eventos están pagados', () => {
    const wrapper = mount(CalendarDay, {
      props: {
        date: testDate,
        events: [mockEvent2], // mockEvent2 tiene paymentStatus: 'Pagado'
        isCurrentMonth: true,
        isMobile: false
      }
    });

    expect(wrapper.classes()).toContain('bg-green-100');
  });
});
