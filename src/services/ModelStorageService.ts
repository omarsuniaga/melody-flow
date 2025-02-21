// ModelStorageService.ts
import * as tf from '@tensorflow/tfjs';

import { collection, getFirestore, addDoc, getDocs } from 'firebase/firestore';

export interface TrainingExample {
  text: string;
  prediction: any; // Puede ser ParsedEventData o similar
  correction: any;
  reward: number;
  timestamp?: Date;
}

export class ModelStorageService {
  // Claves para IndexedDB y localStorage
  private static readonly MODEL_KEY = 'nlp_model';
  private static readonly VOCAB_KEY = 'nlp_vocabulary';
  private static readonly TRAINING_DATA_KEY = 'nlp_training_data';

  // Colección en Firestore para ejemplos de entrenamiento
  private static firestoreCollection = collection(getFirestore(), 'nlp_training');

  // --- Métodos Firestore (entrenamiento en la nube) ---

  /**
   * Agrega un ejemplo de entrenamiento a Firestore.
   */
  static async addTrainingExampleToFirestore(example: TrainingExample): Promise<void> {
    example.timestamp = new Date();
    await addDoc(this.firestoreCollection, example);
  }

  /**
   * Carga los ejemplos de entrenamiento desde Firestore.
   */
  static async loadTrainingDataFromFirestore(): Promise<TrainingExample[]> {
    const snapshot = await getDocs(this.firestoreCollection);
    const trainingData: TrainingExample[] = [];
    snapshot.forEach(doc => {
      trainingData.push(doc.data() as TrainingExample);
    });
    return trainingData;
  }

  // --- Métodos IndexedDB (almacenar el modelo) ---

  /**
   * Guarda el modelo en IndexedDB usando la clave MODEL_KEY.
   */
  static async saveModel(model: tf.LayersModel): Promise<void> {
    try {
      await model.save(`indexeddb://${this.MODEL_KEY}`);
      console.log('Modelo guardado exitosamente en IndexedDB');
    } catch (error) {
      console.error('Error al guardar el modelo:', error);
      throw error;
    }
  }

  /**
   * Elimina el modelo almacenado en IndexedDB.
   */
  static async clearModel(): Promise<void> {
    try {
      await tf.io.removeModel(`indexeddb://${this.MODEL_KEY}`);
      console.log('Modelo borrado de IndexedDB');
    } catch (error) {
      console.warn('No se pudo borrar el modelo de IndexedDB:', error);
    }
  }

  // --- Métodos localStorage (almacenar vocabulario y datos de entrenamiento local) ---

  /**
   * Guarda el vocabulario (arreglo de palabras) en localStorage.
   */
  static saveVocabulary(vocabulary: string[]): void {
    try {
      localStorage.setItem(this.VOCAB_KEY, JSON.stringify(vocabulary));
    } catch (error) {
      console.error('Error al guardar vocabulario:', error);
    }
  }

  /**
   * Carga el vocabulario desde localStorage y lo retorna como arreglo.
   */
  static loadVocabulary(): string[] {
    try {
      const stored = localStorage.getItem(this.VOCAB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al cargar vocabulario:', error);
      return [];
    }
  }

  /**
   * Guarda los datos de entrenamiento en localStorage.
   * @param data - Arreglo de ejemplos de entrenamiento.
   */
  static saveTrainingDataLocal(data: any[]): void {
    try {
      localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar datos de entrenamiento:', error);
    }
  }

  /**
   * Carga los datos de entrenamiento desde localStorage.
   */
  static loadTrainingDataLocal(): any[] {
    try {
      const stored = localStorage.getItem(this.TRAINING_DATA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error al cargar datos de entrenamiento:', error);
      return [];
    }
  }

  /**
   * Retorna las últimas 'count' predicciones con reward > 0.7,
   * ordenadas de mayor a menor recompensa.
   */
  static getLastPredictionsLocal(count: number = 5): any[] {
    const data = this.loadTrainingDataLocal();
    return data
      .filter((item: any) => item.reward > 0.7)
      .sort((a: any, b: any) => b.reward - a.reward)
      .slice(0, count);
  }

  /**
   * Agrega un nuevo ejemplo de entrenamiento a los datos almacenados en localStorage.
   */
  static addTrainingExampleLocal(example: any): void {
    const trainingData = this.loadTrainingDataLocal();
    trainingData.push(example);
    this.saveTrainingDataLocal(trainingData);
  }

  /**
   * Limpia todo el almacenamiento:
   * - Elimina el modelo de IndexedDB.
   * - Borra el vocabulario y los datos de entrenamiento de localStorage.
   */
  static async clearAll(): Promise<void> {
    await this.clearModel();
    localStorage.removeItem(this.VOCAB_KEY);
    localStorage.removeItem(this.TRAINING_DATA_KEY);
  }
}
