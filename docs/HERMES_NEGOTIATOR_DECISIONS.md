# Decisiones arquitectónicas — Hermes Negotiator

## 1. Repositorio correcto: `omarsuniaga/melody-flow` (apptividades)
Hubo confusión inicial con `omarsuniaga/melodyFlow` (camelCase), un scaffold
vacío sin relación con la app en producción. Se confirmó el repo correcto
comparando el `package.json` (`name: "apptividades"`) contra el sitio real
apptividades.netlify.app. Todo el trabajo de Hermes vive en `melody-flow`.

## 2. Cambio de proveedor de IA: Claude en vez de Gemini/Mistral
El repo ya tenía `geminiService.ts` y `mistralService.ts`, pero ambos
exponen su API key en el cliente (`VITE_GEMINI_API_KEY`/`VITE_MISTRAL_API_KEY`)
y `mistralService.ts` ni siquiera está conectado a nada. El usuario decidió
no seguir ese patrón y usar Claude. Esto obligó a crear la primera Netlify
Function real del proyecto (`netlify/functions/hermes-negotiate.mts`),
porque `netlify.toml` ya declaraba el directorio `netlify/functions` pero
nunca había existido — de hecho `geminiService.ts` llamaba a un endpoint
inexistente (`/api/process-event`) que fallaba silenciosamente en
producción.

## 3. No se reutilizó el pipeline NLP local (TensorFlow.js)
`LocalNLPService`/`ModelManager`/`TrainingManager` son una red muy simple
(vocabulario de 500 palabras) pensada para autocompletar un formulario de
eventos, no para razonar sobre una negociación comercial con contexto,
tono y estrategia. Se dejó intacto (sigue sirviendo a su propósito
original) y Hermes usa su propio analizador: primero Claude vía Netlify
Function, con `ConversationAnalyzerService.ts` (reglas/regex) como
respaldo determinístico si la IA falla.

## 4. Colecciones Firestore nuevas, sin tocar las existentes
`actividades` (eventos), `nlp_training` y `locations` quedan intactas.
Hermes usa `negotiation_conversations`, `negotiation_quotes`,
`negotiation_policies`, `negotiation_audit`.

## 5. No se tocó código legado fuera de alcance
`eventStoreBorrar.js`, `authStore.js`, los duplicados de `firebase/config`,
`MistralService` huérfano, etc. — detectados por la auditoría pero fuera
del alcance de este cambio. No se eliminan ni se corrigen aquí para no
mezclar refactors con la introducción de un subsistema nuevo.

## 6. Puntos que requieren acción del usuario, no solo código
- Configurar `ANTHROPIC_API_KEY` en el panel de Netlify (Site settings >
  Environment variables). Sin esto, `aiEnabled=true` simplemente hace que
  cada análisis caiga al respaldo de reglas (no rompe nada, pero no usa
  IA real hasta que la key exista).
- Decidir si en el futuro se arregla o retira `geminiService.ts`/
  `mistralService.ts` (riesgo de seguridad ya presente en producción,
  independiente de Hermes).
- Instalar Vitest para poder escribir los tests de negociación (Fase 13,
  casos A-G de la spec) — no había ningún framework de test en el repo.
