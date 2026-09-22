import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BalanceEventsMetrics from '../../../src/components/BalanceEventsMetrics.vue';
import { mockEvent1, mockEvent2 } from '../../fixtures/events';

vi.mock('../../../src/components/BalanceTotalEventsPanel.vue', () => ({
  default: {
    name: 'BalanceTotalEventsPanel',
    props: ['totalEvents', 'events', 'showTotalEvents'],
    emits: ['toggleTotalEvents'],
    template: '<div data-testid="total-events-panel"><button @click="$emit(\'toggleTotalEvents\')">Toggle</button></div>'
  }
}));

vi.mock('../../../src/components/BalanceProviderBreakdown.vue', () => ({
  default: {
    name: 'BalanceProviderBreakdown',
    template: '<div data-testid="provider-breakdown"></div>'
  }
}));

vi.mock('../../../src/components/BalanceAverageEventPanel.vue', () => ({
  default: {
    name: 'BalanceAverageEventPanel',
    template: '<div data-testid="average-event-panel"></div>'
  }
}));

describe('BalanceEventsMetrics.vue', () => {
  const defaultProps = {
    monthlyStats: {
      totalEvents: 2,
      totalRevenue: 400,
      averagePerEvent: 200
    },
    events: [mockEvent1, mockEvent2],
    showTotalEvents: false,
    showProviderRevenue: false,
    showPendingPayments: false,
    showCompletedPayments: false,
    expandedProvider: null,
    totalPendingAmount: 250,
    totalCompletedAmount: 150,
    groupedPendingPayments: {
      'Orquesta Sinfónica': [mockEvent1]
    },
    groupedCompletedPayments: {
      'Banda Jazz': [mockEvent2]
    },
    sortedProviderStatsByRevenue: [
      { name: 'Orquesta Sinfónica', revenue: 250 },
      { name: 'Banda Jazz', revenue: 150 }
    ],
    sortedEvents: [mockEvent1, mockEvent2]
  };

  it('se monta sin errores con las métricas recibidas', () => {
    const wrapper = mount(BalanceEventsMetrics, {
      props: defaultProps,
      global: {
        stubs: {
          LazyTotalEventsPanel: true,
          LazyProviderBreakdown: true,
          LazyAverageEventPanel: true
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('propaga evento toggleTotalEvents desde el panel hijo', async () => {
    const wrapper = mount(BalanceEventsMetrics, {
      props: defaultProps,
      global: {
        stubs: {
          LazyTotalEventsPanel: {
            template: '<button @click="$emit(\'toggleTotalEvents\')">Toggle</button>'
          },
          LazyProviderBreakdown: true,
          LazyAverageEventPanel: true
        }
      }
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('toggleTotalEvents')).toBeTruthy();
  });
});
