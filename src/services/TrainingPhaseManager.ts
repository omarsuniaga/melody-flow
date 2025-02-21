import { ModelManager } from './ModelManager';
import { TrainingManager } from './TrainingManager';
import { FirestoreNLPService } from './FirestoreNLPService';
import GeminiService from './geminiService';

export class TrainingPhaseManager {
  // Verifica si existe un modelo en IndexedDB y, en su defecto,
  // inicia la fase de entrenamiento extrayendo datos de Firestore o utilizando GeminiService.
  public static async ensureModel(): Promise<void> {
    // Intentar cargar el modelo existente
    try {
      await ModelManager.initializeModel();
      if (ModelManager.model) {
        console.log('Modelo existente en IndexedDB');
        return;
      }
    } catch (err) {
      console.warn('Modelo no encontrado en IndexedDB, se inicia fase de entrenamiento.');
    }
    // Si llega acá, el modelo no existe
    // Intentar extraer el dataset desde Firestore (se asume que este método se implementa)
    let trainingData: any[] = [];
    const firestoreNLPService = new FirestoreNLPService();
    if ((firestoreNLPService as any).loadTrainingDataset) {
      trainingData = await (firestoreNLPService as any).loadTrainingDataset();
    }
    // Si no se encontró dataset en Firestore, usar GeminiService para generar un JSON de entrenamiento
    if (trainingData.length === 0) {
      console.warn('No se encontró dataset en Firestore. Usando GeminiService para obtener datos de entrenamiento.');
      const sampleResponse = await GeminiService.processEventText('ejemplo de datos para entrenamiento');
      trainingData.push({
        text: 'ejemplo de datos para entrenamiento',
        correction: sampleResponse,
      });
    }
    // Reentrenar el modelo con los datos obtenidos
    await TrainingManager.retrainWithReinforcement(trainingData);
    console.log('Fase de entrenamiento completada.');
  }
}
