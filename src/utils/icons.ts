import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronLeft,
  faChevronRight,
  faEye,
  faPen,
  faTrash,
  faCircleCheck,
  faClock,
  faLocationDot,
  faPlus,
  faChartColumn,
  faChevronDown,
  faArrowsRotate,
  faCircleUser,
  faVolumeHigh,
  faBell,
  faRightFromBracket,
  faCalendar,
  faUser,
  faEnvelope,
  faLock,
  faEyeSlash,
  faRightToBracket,
  faUserPlus,
  faMusic // Añadir esta importación
} from '@fortawesome/free-solid-svg-icons';

// Agregar todos los iconos a la biblioteca
library.add(
  faChevronLeft,
  faChevronRight,
  faEye,
  faPen,
  faTrash,
  faCircleCheck,
  faClock,
  faLocationDot,
  faPlus,
  faChartColumn,
  faChevronDown,
  faArrowsRotate,
  faCircleUser,
  faVolumeHigh,
  faBell,
  faRightFromBracket,
  faCalendar,
  faUser,
  faEnvelope,
  faLock,
  faEyeSlash,
  faRightToBracket,
  faUserPlus,
  faMusic // Añadir aquí también
);

// Exportar un objeto con los nombres de los iconos para mantener consistencia
export const icons = {
  ChevronLeftIcon: 'fa-solid fa-chevron-left',
  ChevronRightIcon: 'fa-solid fa-chevron-right',
  EyeIcon: 'fa-solid fa-eye',
  PencilIcon: 'fa-solid fa-pen',
  TrashIcon: 'fa-solid fa-trash',
  CheckCircleIcon: 'fa-solid fa-circle-check',
  ClockIcon: 'fa-solid fa-clock',
  MapPinIcon: 'fa-solid fa-location-dot',
  PlusIcon: 'fa-solid fa-plus',
  ChartBarIcon: 'fa-solid fa-chart-column',
  ChevronDownIcon: 'fa-solid fa-chevron-down',
  ArrowPathIcon: 'fa-solid fa-arrows-rotate',
  UserCircleIcon: 'fa-solid fa-circle-user',
  SpeakerWaveIcon: 'fa-solid fa-volume-high',
  BellIcon: 'fa-solid fa-bell',
  ArrowRightOnRectangleIcon: 'fa-solid fa-right-from-bracket',
  CalendarIcon: 'fa-solid fa-calendar',
  UserIcon: 'fa-solid fa-user',
  MusicIcon: 'fa-solid fa-music' // Añadir esta línea
};

export default icons;
