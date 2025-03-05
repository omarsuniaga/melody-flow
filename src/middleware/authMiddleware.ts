import { auth } from '../firebase/config';
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

export async function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  // Esperar a que Firebase Auth inicialice
  await new Promise<void>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve();
    });
  });

  if (auth.currentUser) {
    // Usuario autenticado, permitir acceso
    next();
  } else {
    // Usuario no autenticado, redirigir a login
    next({ 
      path: '/login', 
      query: { redirect: to.fullPath } 
    });
  }
}

// Verificar token para operaciones críticas
export async function verifyAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error al verificar token:', error);
    throw new Error('Error de autenticación');
  }
} 