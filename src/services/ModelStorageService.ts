import * as tf from '@tensorflow/tfjs';

/**
 * Maneja almacenamiento en IndexedDB (modelo TensorFlow)
 * y en localStorage (vocabulario y datos de entrenamiento).
 */
export class ModelStorageService {
  private static readonly MODEL_KEY = 'nlp_model';
  private static readonly VOCAB_KEY = 'nlp_vocabulary';
  private static readonly TRAINING_DATA_KEY = 'nlp_training_data';

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
   * Carga el modelo desde IndexedDB. Si no existe, retorna null.
   */
  static async loadModel(): Promise<tf.LayersModel | null> {
    try {
      const model = await tf.loadLayersModel(`indexeddb://${this.MODEL_KEY}`);
      console.log('Modelo cargado exitosamente de IndexedDB');
      return model;
    } catch (error) {
      console.warn('No se encontró un modelo guardado en IndexedDB');
      return null;
    }
  }

  /**
   * Guarda el vocabulario (arreglo de palabras) en localStorage.
   * 
   * @param vocabulary - Arreglo de palabras.
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
   * 
   * @param data - Arreglo con objetos de ejemplo: { text, prediction, correction, reward, ... } 
   */
  static saveTrainingData(data: any[]): void {
    try {
      localStorage.setItem(this.TRAINING_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar datos de entrenamiento:', error);
    }
  }

  /**
   * Carga los datos de entrenamiento desde localStorage.
   */
  static loadTrainingData(): any[] {
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
   * ordenadas por mayor recompensa.
   */
  static getLastPredictions(count: number = 5): any[] {
    const data = this.loadTrainingData();
    return data
      .filter(item => item.reward > 0.7)     // sólo predicciones exitosas
      .sort((a, b) => b.reward - a.reward)   // orden descendente por reward
      .slice(0, count);                      // tomar las primeras 'count'
  }

  /**
   * Agrega un nuevo ejemplo de entrenamiento y lo persiste en localStorage.
   */
  static addTrainingExample(example: any): void {
    const trainingData = this.loadTrainingData();
    trainingData.push(example);
    this.saveTrainingData(trainingData);
  }

  /**
   * (Opcional) Limpia todo el almacenamiento local (modelo, vocabulario, training).
   * Útil para debug o reinicio completo.
   */
  static async clearAll(): Promise<void> {
    try {
      // Borrar modelo en IndexedDB
      await tf.io.removeModel(`indexeddb://${this.MODEL_KEY}`);
      console.log('Modelo borrado de IndexedDB');
    } catch (error) {
      console.warn('No se pudo borrar el modelo de IndexedDB:', error);
    }
    // Borrar keys de localStorage
    localStorage.removeItem(this.VOCAB_KEY);
    localStorage.removeItem(this.TRAINING_DATA_KEY);
  }
}
