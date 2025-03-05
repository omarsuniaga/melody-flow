import { z } from 'zod';

// Esquema para validar datos de eventos
export const eventFormSchema = z.object({
  id: z.string().optional(),
  activityType: z.enum(['Eventual', 'Fija']),
  paymentStatus: z.enum(['Pendiente', 'Pagado']),
  provider: z.string().min(1, "El proveedor es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  location: z.string().min(1, "La ubicación es obligatoria"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  amount: z.number().positive("El monto debe ser mayor a cero"),
  userId: z.string().min(1, "ID de usuario requerido")
});

// Tipo derivado del esquema
export type ValidatedEventForm = z.infer<typeof eventFormSchema>;

// Función de validación
export function validateEventForm(data: unknown): { 
  success: boolean; 
  data?: ValidatedEventForm; 
  error?: string 
} {
  try {
    const validated = eventFormSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(", ") 
      };
    }
    return { success: false, error: "Error de validación desconocido" };
  }
} 