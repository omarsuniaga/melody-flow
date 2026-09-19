# Hermes Negotiator

Subsistema comercial/negociador de Melody Flow (repo `apptividades`, la
versión 1 real, deployada en apptividades.netlify.app). Ayuda a convertir
conversaciones de contratación musical en eventos confirmados, con
autonomía graduada y aprobación humana obligatoria para decisiones
económicas relevantes.

## Estado del proyecto base (auditoría, Fase 0)

Vue 3.4 (mezcla Options/Composition API) + TypeScript + Pinia + Firebase +
Netlify. Ya tenía una capa de IA propia (`geminiService.ts`,
`mistralService.ts`) y un pipeline NLP local con TensorFlow.js
(`LocalNLPService`, `DataExtractor`, `ModelManager`, `TrainingManager`)
para parsear texto y autocompletar el formulario de eventos. Hallazgos
críticos de la auditoría:

- **Las API keys de Gemini y Mistral estaban expuestas en el cliente**
  (`import.meta.env.VITE_GEMINI_API_KEY` / `VITE_MISTRAL_API_KEY`),
  visibles en el bundle público. Hermes Negotiator NO repite este patrón.
- `netlify.toml` declaraba `netlify/functions` pero el directorio no
  existía — `geminiService.ts` llamaba a un endpoint (`/api/process-event`)
  que nunca se implementó. Hermes crea el directorio real por primera vez.
- El pipeline NLP local es un modelo de juguete (vocabulario de 500
  palabras) pensado para completar un formulario, no para razonar sobre
  una negociación comercial. No se reutiliza como motor de Hermes.
- No existe modelo de cliente/proveedor (es un `string` embebido en cada
  evento) ni de facturación. Hermes no toca `actividades`, `nlp_training`
  ni `locations` — usa colecciones nuevas `negotiation_*`.
- Fuerte duplicación `.js`/`.ts` en el repo. El activo confirmado es:
  router `src/router/index.js`, firebase config `src/firebase/config.ts`
  (importado por `../firebase/config` en todo el código activo).

Ver `docs/HERMES_NEGOTIATOR_DECISIONS.md` para el detalle de decisiones.

## Decisión de LLM: Claude, no Gemini/Mistral

El usuario decidió cambiar de proveedor: Hermes usa **Claude (Anthropic)**
como motor de razonamiento, vía una Netlify Function nueva
(`netlify/functions/hermes-negotiate.mts`) que mantiene la API key
(`ANTHROPIC_API_KEY`) exclusivamente server-side. El cliente nunca ve la
key — llama a `/.netlify/functions/hermes-negotiate` vía
`HermesAIService.ts`, que además cae automáticamente a un analizador
basado en reglas (`ConversationAnalyzerService.ts`) si la IA falla o si
`aiEnabled` está apagado, para que el sandbox nunca se quede sin responder.

## Arquitectura

```
src/
  types/negotiation.ts           # modelos de dominio
  domain/
    pricing/PricingEngine.ts     # cálculo determinístico de tarifas (sin IA)
    negotiation/NegotiationStateMachine.ts
  services/
    HermesAIService.ts           # llama a la Netlify Function (Claude), con fallback a reglas
    ConversationAnalyzerService.ts  # analizador de respaldo basado en reglas
    PolicyService.ts             # políticas de tarifas/negociación (Firestore)
    NegotiationService.ts        # orquesta análisis + pricing + persistencia
    AuditService.ts              # audit log (negotiation_audit)
  stores/negotiationStore.ts
  views/negotiator/NegotiatorSandboxView.vue
  config/featureFlags.ts
netlify/functions/
  hermes-negotiate.mts           # proxy seguro a Claude (Anthropic SDK + zod)
```

## Colecciones de Firestore

- `negotiation_conversations`, `negotiation_quotes`, `negotiation_policies`,
  `negotiation_audit` — nuevas, sin colisión con `actividades`,
  `nlp_training` o `locations`.
- `negotiation_clients`, `negotiation_outcomes` — pendientes (fases
  posteriores: memoria de cliente y learning from outcomes).

## Pricing Engine

Determinístico, sin IA (spec sección 32: la IA nunca decide reglas
críticas de precio). Tarifas y márgenes vienen de `NegotiationPolicy`
(Firestore, editable). Ninguna cifra universal hardcodeada.

## AI layer

`netlify/functions/hermes-negotiate.mts` llama a `claude-opus-5` con un
system prompt que fuerza salida JSON validada contra un esquema `zod`
(mismo contrato que `ConversationAnalysis`). Si el JSON no valida, la
función devuelve 502 y el cliente cae al analizador de reglas. Nunca se
confía ciegamente en la salida del LLM (spec sección 34): todo campo no
explícito en el texto debe quedar `UNKNOWN`.

## Variables de entorno nuevas

- `ANTHROPIC_API_KEY` — **solo** en el panel de Netlify (Environment
  variables), nunca con prefijo `VITE_`. Ver `.env.example`.

## Feature flags

`src/config/featureFlags.ts`. Todo lo autónomo apagado por defecto excepto
`aiEnabled` (necesario para que el sandbox use Claude en vez de reglas);
`autoReplyEnabled`, `autoNegotiationEnabled`, `whatsappEnabled`,
`autoFollowUpEnabled` siguen en `false`.

## Audit log

Cada acción relevante (`AI_RECOMMENDATION`, `QUOTE_CREATED`, `QUOTE_CHANGED`,
`MESSAGE_SUGGESTED`, `MESSAGE_SENT`, `PRICE_CHANGED`, `DISCOUNT_GRANTED`,
`USER_APPROVED`, `BOOKING_CONFIRMED`, `BOOKING_DECLINED`, `POLICY_CHANGED`)
se registra en `negotiation_audit` con
`{timestamp, actor, source, before, after, reason, conversationId}`.

## WhatsApp (pendiente)

No implementado. El repo no tenía ninguna integración previa. Se diseñará
como puerto abstracto cuando el sandbox esté validado con uso real.

## Pendientes explícitos

- Configurar `ANTHROPIC_API_KEY` en Netlify (acción del usuario, fuera del
  código).
- Decidir si se corrige o retira el patrón inseguro de `geminiService.ts`/
  `mistralService.ts` (quedó fuera de alcance de este cambio: no se tocó
  código existente fuera de Hermes).
- Instalar Vitest para los tests de negociación (casos A-G de la spec) —
  el repo no tiene ningún framework de test instalado.
