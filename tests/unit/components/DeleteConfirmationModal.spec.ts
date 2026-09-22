import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DeleteConfirmationModal from '../../../src/components/DeleteConfirmationModal.vue';
import { mockEvent1, mockEvent2 } from '../../fixtures/events';

describe('DeleteConfirmationModal.vue', () => {
  it('emite evento "cancel" al accionar cancelar', async () => {
    const wrapper = mount(DeleteConfirmationModal, {
      props: {
        modelValue: true,
        event: mockEvent1,
        isDeleting: false
      },
      global: {
        stubs: {
          ModalComponent: {
            template: '<div><slot /><slot name="footer" /></div>'
          }
        }
      }
    });

    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.find(b => b.text().includes('Cancelar'));
    expect(cancelButton).toBeDefined();

    await cancelButton!.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emite evento "delete" con modo "single" para evento eventual', async () => {
    const wrapper = mount(DeleteConfirmationModal, {
      props: {
        modelValue: true,
        event: mockEvent1, // activityType: 'Eventual'
        isDeleting: false
      },
      global: {
        stubs: {
          ModalComponent: {
            template: '<div><slot /><slot name="footer" /></div>'
          }
        }
      }
    });

    const buttons = wrapper.findAll('button');
    const deleteButton = buttons.find(b => b.text().includes('Eliminar'));
    expect(deleteButton).toBeDefined();

    await deleteButton!.trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')![0]).toEqual([mockEvent1, 'single']);
  });

  it('muestra opciones de eliminación única y de serie para evento de actividad fija', () => {
    const wrapper = mount(DeleteConfirmationModal, {
      props: {
        modelValue: true,
        event: mockEvent2, // activityType: 'Fija'
        isDeleting: false
      },
      global: {
        stubs: {
          ModalComponent: {
            template: '<div><slot /><slot name="footer" /></div>'
          }
        }
      }
    });

    const text = wrapper.text();
    expect(text).toContain('Este evento');
    expect(text).toContain('Todos');
  });
});
