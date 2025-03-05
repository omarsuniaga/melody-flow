import { defineComponent, h } from 'vue';

// Componente para ícono de ruta
export const RouteIcon = defineComponent({
  name: 'RouteIcon',
  props: {
    class: {
      type: String,
      default: 'h-5 w-5'
    }
  },
  setup(props) {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      class: props.class
    }, [
      h('path', { d: 'M3 17l2-5M5 12l3-2M8 10l3 1M11 11l3-3M14 8l4-1M18 7l3 3' }),
      h('circle', { cx: '3', cy: '17', r: '1' }),
      h('circle', { cx: '21', cy: '10', r: '1' })
    ]);
  }
});

// Componente para ícono de carretera
export const RoadIcon = defineComponent({
  name: 'RoadIcon',
  props: {
    class: {
      type: String,
      default: 'h-5 w-5'
    }
  },
  setup(props) {
    return () => h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      class: props.class
    }, [
      h('path', { d: 'M4 19L19 4' }),
      h('path', { d: 'M4 5h3' }),
      h('path', { d: 'M9 9h3' }),
      h('path', { d: 'M14 14h3' }),
      h('path', { d: 'M17 19h3' })
    ]);
  }
});

// También podemos crear íconos para los marcadores del mapa
export const mapIcons = {
  // URL para ícono de ubicación actual
  currentLocation: '/icons/current-location.png',
  // URL para ícono de destino
  destination: '/icons/destination.png'
}; 