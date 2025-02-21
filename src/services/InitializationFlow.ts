// InitializationFlow.ts
import * as tf from '@tensorflow/tfjs';
import { ModelManager } from './ModelManager';
import { FirestoreNLPService } from './FirestoreNLPService';
import { TrainingManager } from './TrainingManager';
import GeminiService from './geminiService';
import { ModelStorageService } from './ModelStorageService';

/**
 * Inicializa el modelo.
 * Si no se encuentra en IndexedDB, extrae los ejemplos de entrenamiento
 * desde Firestore y entrena un modelo inicial. Mientras tanto, si se solicita
 * una predicción, se usa GeminiService para generar un JSON y se almacena
 * para reentrenar el modelo posteriormente.
 */
export async function initializeOrTrainModel(): Promise<void> {
  try {
    await ModelManager.initializeModel();
    if (ModelManager.model) {
      console.log('Modelo encontrado en IndexedDB.');
      return;
    }
  } catch (error) {
    console.warn('No se encontró modelo en IndexedDB, iniciando entrenamiento.');
  }

  try {
    const firestoreData = await FirestoreNLPService.loadTrainingData(); // Implementar método en FirestoreNLPService
    if (firestoreData.length > 0) {
      console.log('Iniciando entrenamiento inicial con datos de Firestore.');
      // Crear un modelo ligero
      ModelManager.createLightweightModel();
      // Actualizar el vocabulario según los datos de entrenamiento
      await ModelManager.updateVocabulary(firestoreData);
      // Preparar tensores para el entrenamiento
      const { xs, ys } = TrainingManager.prepareTrainingTensors(firestoreData);
      // Entrenar el modelo
      const result = await ModelManager.model!.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
      });
      xs.dispose();
      ys.dispose();
      console.log('Entrenamiento inicial completado:', result.history);
      // Guardar el modelo usando MODEL_KEY de ModelManager
      await ModelManager.model!.save(`indexeddb://${ModelManager.MODEL_KEY}`);
      console.log('Modelo guardado en IndexedDB.');
    } else {
      console.warn('No se encontraron datos de entrenamiento en Firestore.');
    }
  } catch (error) {
    console.error('Error durante el entrenamiento inicial:', error);
  }
}

/**
 * Función para procesar una solicitud de predicción.
 * Mientras el modelo está en entrenamiento o si falla el procesamiento local,
 * se usa GeminiService para generar un JSON y se guarda ese ejemplo para entrenar
 * el modelo posteriormente.
 */
export async function processPrediction(message: string): Promise<any> {
  try {
    // Intenta usar el modelo local
    const inputTensor = tf.tensor([Number(message)]);
    const result = await ModelManager.model?.predict(inputTensor);
    inputTensor.dispose();
    // Si el resultado es válido, retornar la predicción
    if (result) {
      return result;
    }
  } catch (error) {
    console.error('Error usando el modelo local, se usará GeminiService:', error);
  }
  // Si falla el procesamiento local, usa GeminiService
  const geminiResult = await GeminiService.processEventText(message);
  // Aquí puedes guardar geminiResult en tu dataset para reentrenar
  await ModelStorageService.addTrainingExampleToFirestore({
    text: message,
    prediction: geminiResult,
    correction: geminiResult,
    reward: 1,
  });
  return geminiResult;
}
