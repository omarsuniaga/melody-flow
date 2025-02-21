# Apptividades

**Apptividades** es una aplicación web progresiva (PWA) para la gestión de eventos musicales, diseñada para músicos, agrupaciones y organizadores de eventos. La aplicación permite administrar eventos, controlar horarios, gestionar pagos y mucho más, ofreciendo una experiencia de usuario óptima y escalable.

---

## Objetivos

- Facilitar la administración y planificación de eventos musicales.
- Permitir gestión de usuarios con autenticación segura.
- Ofrecer vistas intuitivas (calendario, dashboard, etc.) para la organización de actividades.
- Integrar módulos de pagos y notificaciones para una gestión integral.
- Ser una aplicación escalable, modular y de alto rendimiento.

---

## Características Principales

- **Gestión de Usuarios**  
  - Registro, inicio y cierre de sesión.
  - Actualización de perfil y contraseña.
  
- **Gestión de Eventos**  
  - Creación, edición y eliminación de eventos.
  - Visualización en calendario (mensual y semanal) y vistas detalladas.
  
- **Módulo de Pagos**  
  - Registro y control de pagos (pendientes, confirmados, vencidos).
  - Reportes y estadísticas de ingresos y gastos.

- **Notificaciones y PWA**  
  - Notificaciones en tiempo real para recordatorios y cambios.
  - Instalación como PWA para acceso en dispositivos móviles.

- **Dashboard y Reportes**  
  - Estadísticas de eventos, usuarios y pagos.
  - Reportes gráficos para facilitar la toma de decisiones.

---

## Módulos y Vistas

- **Módulo de Autenticación:** Gestión de inicios de sesión, registro y recuperación de contraseñas.  
- **Módulo de Eventos:** Vistas para visualizar el calendario y detalles de eventos.  
- **Módulo de Pagos:** Panel para ver y gestionar los estados de pago.  
- **Dashboard:** Sección de estadísticas y reportes generales.  
- **Notificaciones:** Servicio para alertas y mensajería en tiempo real.

---

## Tecnologías Utilizadas

- **Vue 3** con Composition API  
- **Vite** para el build de la aplicación  
- **Pinia** para el manejo del estado global  
- **Firebase** para autenticación y almacenamiento de datos  
- **Netlify** para despliegue y gestión de cabeceras de seguridad CSP  
- **Vite Plugin PWA** para integración de funcionalidad PWA  
- **Tailwind CSS** para estilos y diseño responsivo  

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/melodyflow.git
   cd melodyflow
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Para compilar en producción:
   ```bash
   npm run build
   ```

---

## Uso

- Inicia sesión o regístrate para acceder a las funcionalidades protegidas.
- Utiliza el calendario para gestionar tus eventos y evitar solapamientos.
- Accede al módulo de pagos para visualizar el estado de cada transacción.
- Aprovecha el dashboard para obtener estadísticas y reportes en tiempo real.
- Como PWA, instala la aplicación en tu dispositivo móvil para acceso rápido.

---

## Contribuciones

Las contribuciones son bienvenidas.  
Si deseas colaborar:
- Realiza un **fork** del repositorio.
- Crea una **branch** para tu funcionalidad o corrección.
- Envía un **pull request** con una descripción detallada.

---

## Licencia

Este proyecto está licenciado bajo la [Licencia MIT](./LICENSE).  
Se permite el uso, modificación y distribución, siempre y cuando se mantenga la atribución original.

---

¡Gracias por utilizar **MelodyFlow**!  
Disfruta de una experiencia optimizada para la gestión de tus eventos musicales.