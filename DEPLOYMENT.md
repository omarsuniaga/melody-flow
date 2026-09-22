# Guía de Despliegue y Operaciones — MelodyFlow (Apptividades)

Este documento define la arquitectura y el flujo único oficial de despliegue para la aplicación.

---

## 1. Infraestructura de Producción

- **Proveedor Oficial**: [Netlify](https://www.netlify.com/)
- **URL de Producción**: [https://apptividades.netlify.app](https://apptividades.netlify.app)
- **Repositorio**: `omarsuniaga/melody-flow`
- **Rama Principal (Producción)**: `main`
- **Configuración de Build**:
  - **Base Directory**: `/`
  - **Build Command**: `npm run build` (`vue-tsc --noEmit && vite build`)
  - **Publish Directory**: `dist`
  - **Functions Directory**: `netlify/functions`
  - **Node.js Runtime**: `18.18.0`

---

## 2. Variables de Entorno en Netlify

Configurar en el panel de Netlify: **Site settings > Environment variables**:

### Variables de Cliente (Inyectadas en el bundle)
- `VITE_FIREBASE_API_KEY`: API Key web de Firebase
- `VITE_FIREBASE_AUTH_DOMAIN`: Dominio de autenticación de Firebase (`apptividades-5b66f.firebaseapp.com`)
- `VITE_FIREBASE_PROJECT_ID`: ID del proyecto Firebase (`apptividades-5b66f`)
- `VITE_FIREBASE_STORAGE_BUCKET`: Bucket de Firebase Storage (`apptividades-5b66f.appspot.com`)
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: ID del remitente de mensajería Cloud
- `VITE_FIREBASE_APP_ID`: ID de aplicación web Firebase
- `VITE_FIREBASE_MEASUREMENT_ID`: ID de Analytics (opcional)
- `VITE_FIREBASE_VAPIDKEY`: Clave pública VAPID para Web Push Notifications

### Variables Server-Side (Solo accesibles en Netlify Functions)
- `ANTHROPIC_API_KEY`: API Key de Claude para el subsistema Hermes Negotiator (`netlify/functions/hermes-negotiate.mts`). **Nunca prefijar con `VITE_`**.

---

## 3. Estrategia de Ramas y Despliegue Continuo

```
[ Rama feature/fix ]  --->  Pull Request  --->  Netlify Deploy Preview (Testing visual y smoke tests)
                                |
                             Merge
                                v
[ Rama main ]        --->  Deploy Automático a Producción (apptividades.netlify.app)
```

1. **Deploy Previews**: Cada Pull Request contra `main` genera automáticamente una URL efímera de preview en Netlify.
2. **Producción**: El merge a `main` activa el build y despliegue inmediato al dominio público.

---

## 4. Acciones Operativas y Tareas Administrativas

### A. Despliegue de Reglas de Seguridad de Firestore
Las reglas de seguridad están versionadas en [firestore.rules](firestore.rules). Para desplegarlas en la base de datos de producción:

```bash
# Requiere sesión iniciada en Firebase CLI
firebase login
firebase deploy --only firestore:rules
```

### B. Checklist de Purga de Sitios Netlify Duplicados
> **Estado**: *PENDIENTE DE EJECUCIÓN ADMINISTRATIVA* (A ejecutar desde el panel web de Netlify o mediante sesión con Netlify MCP).

Existe duplicidad histórica de proyectos conectados al mismo repositorio. Mantener únicamente `apptividades`:

- [ ] Acceder a la cuenta de Netlify y listar los sitios vinculados al repositorio `omarsuniaga/melody-flow`.
- [ ] **Eliminar**: Sitio `apptividad-demo`
- [ ] **Eliminar**: Sitio `apptividades-ultimate`
- [ ] **Eliminar**: Sitio `apptividades-ultimate-2`
- [ ] **Verificar**: Que únicamente el sitio `apptividades` conserve la vinculación de webhook y continuous deployment con la rama `main`.
