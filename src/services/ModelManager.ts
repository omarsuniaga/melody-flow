// ModelManager.ts
import * as tf from '@tensorflow/tfjs';
import { FirestoreNLPService } from './FirestoreNLPService';

export type VocabMap = Record<string, number>;

export class ModelManager {
  // Modelo de TensorFlow.js
  public static model: tf.Sequential | null = null; // Modelo de TensorFlow.js
  public static vocabMap: VocabMap = {}; // Mapeo de palabras a índices
  public static readonly MODEL_KEY = 'nlp-model'; // Nueva propiedad

  public static readonly SEQUENCE_LENGTH = 30; // Longitud de la secuencia de entrada   
  public static readonly EMBEDDING_DIM = 16; // Dimensión del embedding
  public static readonly MAX_VOCAB_SIZE = 500; // Tamaño máximo del vocabulario

  public static async initializeModel(): Promise<void> {
    // Si el modelo ya está cargado, no hacer nada
    if (this.model) return;
    // Intentar cargar el modelo de IndexedDB
    try {
      // Usar MODEL_KEY para cargar
      this.model = (await tf.loadLayersModel(`indexeddb://${this.MODEL_KEY}`)) as tf.Sequential;
      console.log('Modelo cargado de IndexedDB');
      const vocabArr = await FirestoreNLPService.loadVocabularyArray();// Se asume que este método se implementa
      this.buildVocabMap(vocabArr); // Construir el mapeo de palabras
      console.log(`Vocabulario cargado con ${vocabArr.length} palabras`);
    } catch (err) {
      console.warn('No se encontró modelo en IndexedDB, creando uno nuevo...', err);
      this.createLightweightModel();
    }
  }

  public static createLightweightModel(): void {
    this.model = tf.sequential();
    this.model.add(tf.layers.embedding({
      inputDim: this.MAX_VOCAB_SIZE,
      outputDim: this.EMBEDDING_DIM,
      inputLength: this.SEQUENCE_LENGTH,
      embeddingsInitializer: 'truncatedNormal',
    }));
    this.model.add(tf.layers.globalAveragePooling1d());
    this.model.add(tf.layers.dense({ units: 6, activation: 'sigmoid' }));
    this.model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });
    this.vocabMap = {}; // Inicializa el vocabulario vacío
    console.log('Modelo ligero creado (Embedding + GlobalAveragePooling + Dense)');
  }

  public static buildVocabMap(vocabArr: string[]): void {
    this.vocabMap = {};
    vocabArr.forEach((word, i) => {
      if (i < this.MAX_VOCAB_SIZE) {
        this.vocabMap[word] = i;
      }
    });
  }

  public static async updateVocabulary(trainingData: any[]): Promise<void> {
    const newWords = new Set<string>();
    for (const example of trainingData) {
      const tokens = example.text.toLowerCase().split(/\s+/);
      tokens.forEach((tk: string) => {
        if (!(tk in this.vocabMap) && Object.keys(this.vocabMap).length < this.MAX_VOCAB_SIZE) {
          newWords.add(tk);
        }
      });
    }
    let currentSize = Object.keys(this.vocabMap).length;
    newWords.forEach((w) => {
      if (currentSize < this.MAX_VOCAB_SIZE) {
        this.vocabMap[w] = currentSize++;
      }
    });
    await FirestoreNLPService.saveVocabularyArray(Object.keys(this.vocabMap));
  }
}
