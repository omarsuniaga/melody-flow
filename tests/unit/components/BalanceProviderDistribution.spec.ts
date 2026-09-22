import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BalanceProviderDistribution from '../../../src/components/BalanceProviderDistribution.vue';
import { mockEvent1, mockEvent2 } from '../../fixtures/events';

describe('BalanceProviderDistribution.vue', () => {
  const mockProviders = [
    { name: 'Orquesta Sinfónica', eventCount: 3, percentage: '60.0' },
    { name: 'Banda Jazz', eventCount: 2, percentage: '40.0' }
  ];

  it('renderiza nombres y porcentajes de proveedores correctamente', () => {
    const wrapper = mount(BalanceProviderDistribution, {
      props: {
        providerDistribution: mockProviders,
        showProviderDistribution: true,
        events: [mockEvent1, mockEvent2]
      }
    });

    expect(wrapper.text()).toContain('Orquesta Sinfónica');
    expect(wrapper.text()).toContain('60.0%');
    expect(wrapper.text()).toContain('Banda Jazz');
    expect(wrapper.text()).toContain('40.0%');
  });

  it('emite "toggleProviderDistribution" al hacer click en el header', async () => {
    const wrapper = mount(BalanceProviderDistribution, {
      props: {
        providerDistribution: mockProviders,
        showProviderDistribution: false,
        events: []
      }
    });

    const header = wrapper.find('div.cursor-pointer');
    await header.trigger('click');

    expect(wrapper.emitted('toggleProviderDistribution')).toBeTruthy();
  });

  it('no muestra la lista detallada cuando showProviderDistribution es false', () => {
    const wrapper = mount(BalanceProviderDistribution, {
      props: {
        providerDistribution: mockProviders,
        showProviderDistribution: false,
        events: []
      }
    });

    expect(wrapper.text()).not.toContain('60.0%');
  });
});
