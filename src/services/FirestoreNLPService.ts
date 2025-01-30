import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export class FirestoreNLPService {
  private static readonly COLLECTION = 'nlp_training';

  // ==========================
  // PESOS DEL MODELO
  // ==========================
  static async saveModelWeights(weights: any): Promise<void> {
    const modelDoc = doc(db, this.COLLECTION, 'model_weights');
    await setDoc(modelDoc, {
      weights,
      timestamp: Date.now()
    }, { merge: true });
  }

  static async loadModelWeights(): Promise<any> {
    const modelDoc = doc(db, this.COLLECTION, 'model_weights');
    const snapshot = await getDoc(modelDoc);
    return snapshot.exists() ? snapshot.data()?.weights : null;
  }

  // ==========================
  // VOCABULARIO COMO SET
  // ==========================
  static async saveVocabulary(vocabulary: Set<string>): Promise<void> {
    const vocabDoc = doc(db, this.COLLECTION, 'vocabulary');
    await setDoc(vocabDoc, {
      words: Array.from(vocabulary),
      timestamp: Date.now()
    }, { merge: true });
  }

  static async loadVocabulary(): Promise<Set<string>> {
    const vocabDoc = doc(db, this.COLLECTION, 'vocabulary');
    const snapshot = await getDoc(vocabDoc);
    if (!snapshot.exists()) return new Set();
    return new Set(snapshot.data()?.words ?? []);
  }

  // ==========================
  // VOCABULARIO COMO ARRAY
  // ==========================
  /**
   * Guardar un arreglo de palabras. Útil si manejas tu vocabulario
   * como un array indexado para luego construir un map { word -> index }.
   */
  static async saveVocabularyArray(words: string[]): Promise<void> {
    const vocabDoc = doc(db, this.COLLECTION, 'vocabulary_array');
    await setDoc(vocabDoc, {
      words,
      timestamp: Date.now()
    }, { merge: true });
  }

  /**
   * Carga el vocabulario como arreglo de strings.
   */
  static async loadVocabularyArray(): Promise<string[]> {
    const vocabDoc = doc(db, this.COLLECTION, 'vocabulary_array');
    const snapshot = await getDoc(vocabDoc);
    if (!snapshot.exists()) return [];
    return snapshot.data()?.words ?? [];
  }

  // ==========================
  // MÉTRICAS DE ENTRENAMIENTO
  // ==========================
  static async updateTrainingMetrics(metrics: any): Promise<void> {
    const metricsDoc = doc(db, this.COLLECTION, 'training_metrics');
    await updateDoc(metricsDoc, {
      ...metrics,
      timestamp: Date.now()
    });
  }
}
