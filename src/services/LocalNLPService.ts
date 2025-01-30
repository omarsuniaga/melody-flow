import * as tf from '@tensorflow/tfjs';
import type { ParsedEventData } from '../types/event';
import { FirestoreNLPService } from './FirestoreNLPService';
import { ModelStorageService } from './ModelStorageService';
import { useEventStore } from '../stores/eventStore';

type VocabMap = Record<string, number>;

export class LocalNLPService {
  // ------------ CONFIGURACIÓN DEL MODELO ------------
  private static model: tf.Sequential | null = null;
  private static vocabMap: VocabMap = {};

  // Máx tokens por input (texto corto)
  private static readonly SEQUENCE_LENGTH = 30;
  // Dimensión del embedding (pequeño)
  private static readonly EMBEDDING_DIM = 16;
  // Tamaño máx del vocabulario
  private static readonly MAX_VOCAB_SIZE = 5000;

  // Pesos de recompensa
  private static readonly REWARD_WEIGHTS = {
    provider: 0.2,
    description: 0.2,
    location: 0.2,
    date: 0.15,
    time: 0.15,
    amount: 0.1
  };

  // Expresiones regulares
  private static readonly patterns = {
    provider: /(?:(?:que|para|con|proveedor|a traves|presente)\s+)([A-Za-zá-úÁ-Ú\s]+)/i,
    date: /(?:este|próximo|siguiente)?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|viernes|sábado|domingo|lunes|martes|miércoles|jueves)/i,
    time: /(?:a las|desde las|@)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|h|hrs)?/i,
    amount: /(?:por|cobro|precio|costo|pago)?\s*\$?\s*(\d{4,})(?:\s*(?:dolares|pesos|usd|\$))?/i,
    location: /(?:en|at|lugar|local|salón|hotel)\s+(?:el|la|los|las)?\s*([^,\.]+?)(?=\s*(?:,|\.|$|a las|\d|por\s*\$))/i,
    event_type: /(boda|matrimonio|fiesta|ceremonia|evento|celebración|cumpleaños|aniversario)/i,
    // Patrones para la "description"
    description: /(?:en\s+(?:el|la|los|las)\s+)?(?:area\s+de\s+)?(?:restaurant(?:e)?|lobby|terraza|piscina|jardín|jardines|salón|sala)(?:\s+(?:del|de la|principal|vip))?\s*([A-Z][a-zá-úÁ-Ú\s]*)?/i,
    areaKeywords: /(restaurant(?:e)?|lobby|terraza|piscina|jardín|jardines|salón|sala)/i,
    properName: /[A-Z][a-zá-úÁ-Ú]+(?:\s+[A-Z][a-zá-úÁ-Ú]+)*/
  };

  /**
   * Inicializa o carga el modelo desde IndexedDB.
   * Reconstruye `vocabMap` con la data de Firestore.
   */
  private static async initializeModel(): Promise<void> {
    if (this.model) return;

    try {
      // 1) Intentar cargar modelo existente
      this.model = (await tf.loadLayersModel('indexeddb://nlp-model')) as tf.Sequential;
      console.log("Modelo cargado de IndexedDB");

      // 2) Cargar vocabulario y reconstruir map
      const vocabArr = await FirestoreNLPService.loadVocabularyArray();
      this.buildVocabMap(vocabArr);
      console.log("Vocabulario cargado con", vocabArr.length, "palabras");
    } catch (err) {
      console.warn("No se encontró modelo en IndexedDB, creando uno nuevo...");

      // ============== MODELO LIGERO ==============
      this.model = tf.sequential() as tf.Sequential;

      // Capa de Embedding (dimensión pequeña)
      this.model.add(tf.layers.embedding({
        inputDim: this.MAX_VOCAB_SIZE,
        outputDim: this.EMBEDDING_DIM,
        inputLength: this.SEQUENCE_LENGTH,
        embeddingsInitializer: 'truncatedNormal'
      }));

      // GlobalAveragePooling1D en lugar de LSTM/GRU
      this.model.add(tf.layers.globalAveragePooling1d());

      // Capa densa final con 6 salidas (provider, desc, loc, date, time, amount)
      this.model.add(tf.layers.dense({
        units: 6,
        activation: 'sigmoid'
      }));

      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Map de vocab vacío
      this.vocabMap = {};
      console.log("Modelo ligero creado (Embedding + GlobalAveragePooling + Dense)");
    }
  }

  /**
   * Construye el map palabra->índice (vocabMap).
   */
  private static buildVocabMap(vocabArr: string[]) {
    this.vocabMap = {};
    vocabArr.forEach((word, i) => {
      if (i < this.MAX_VOCAB_SIZE) {
        this.vocabMap[word] = i;
      }
    });
  }

  // =================================================
  // == MÉTODO PRINCIPAL: parsear texto con NN + Regex
  // =================================================
  static async parseText(text: string): Promise<ParsedEventData> {
    try {
      await this.initializeModel();
      if (!this.model) throw new Error('Modelo no inicializado');

      // 1) Convertir texto a tensor [1, SEQUENCE_LENGTH]
      const inputTensor = this.textToTensor(text);

      // 2) Predicción
      const prediction = this.model.predict(inputTensor) as tf.Tensor<tf.Rank>;
      const scores = (await prediction.data()) as Float32Array;
      // Por ejemplo: [0.8, 0.1, 0.6, 0.05, 0.9, 0.3]

      // 3) Liberar tensores
      inputTensor.dispose();
      prediction.dispose();

      // 4) Extraer datos con Regex + fallback
      const extractedData = this.extractDataWithRegex(text, scores);

      // 5) Enriquecer con store + training
      const finalPrediction = await this.enrichPredictionAndLearn(extractedData, text);

      return finalPrediction;
    } catch (error) {
      console.error('Error en parseText:', error);
      return {
        provider: '',
        description: '',
        location: '',
        date: null,
        time: null,
        amount: null,
        error: true,
        message: 'No se pudo procesar el texto automáticamente.'
      };
    }
  }

  /**
   * Extrae datos con Regex, ajustando según scores.
   */
  private static extractDataWithRegex(text: string, scores: Float32Array): ParsedEventData {
    // Map: provider->scores[0], description->scores[1], location->scores[2], date->scores[3], time->scores[4], amount->scores[5]
    const providerMatch = text.match(this.patterns.provider);
    const dateMatch = text.toLowerCase().match(this.patterns.date);
    const timeMatch = text.toLowerCase().match(this.patterns.time);
    const amountMatch = text.toLowerCase().match(this.patterns.amount);
    const locationMatch = text.toLowerCase().match(this.patterns.location);

    let data: ParsedEventData = {
      provider: providerMatch ? this.cleanText(providerMatch[1]) : null,
      location: locationMatch ? this.cleanText(locationMatch[1]) : null,
      date: dateMatch ? this.processDate(dateMatch[1]) : null,
      time: timeMatch ? this.processTime(timeMatch) : null,
      amount: amountMatch ? parseInt(amountMatch[1]) : null,
      description: 'Evento' // base por defecto
    };

    // Ajustar con scores
    if (scores[0] < 0.5) data.provider = null;
    if (scores[2] < 0.5) data.location = null;
    if (scores[3] < 0.5) data.date = null;
    if (scores[4] < 0.5) data.time = null;
    if (scores[5] < 0.5) data.amount = null;

    // Para "description"
    const desc = this.extractDescription(text, '');
    if (scores[1] < 0.5) {
      data.description = null;  // ignoramos si score < 0.5
    } else {
      data.description = desc;
    }

    return data;
  }

  /**
   * Enriquecer con datos del store e historial.
   */
  private static async enrichPredictionAndLearn(data: ParsedEventData, originalText: string): Promise<ParsedEventData> {
    const eventStore = useEventStore();
    const historicalEvents = eventStore.events || [];

    // 1) Enriquecer con trainingData
    const trainingData = await ModelStorageService.loadTrainingData();
    let finalData = this.enrichPredictionWithTrainingData(data, trainingData);

    // 2) Enriquecer con store
    finalData = this.enrichPrediction(finalData, historicalEvents);

    // 3) Fallback amount >= 1000
    finalData = this.fallbackAmount(originalText, finalData);

    // 4) Capitalizar
    finalData = this.titleCasePrediction(finalData);

    return finalData;
  }

  // ============= ENTRENAMIENTO =============
  static async learn(originalText: string, correctedData: ParsedEventData, originalPrediction: ParsedEventData): Promise<void> {
    try {
      if (!originalText || !correctedData || !originalPrediction) {
        throw new Error('Datos de entrenamiento incompletos');
      }

      const reward = this.calculateReward(originalPrediction, correctedData);

      await ModelStorageService.addTrainingExample({
        text: originalText,
        prediction: originalPrediction,
        correction: correctedData,
        reward
      });

      const trainingData = await ModelStorageService.loadTrainingData();
      if (trainingData.length >= 5) {
        await this.retrainWithReinforcement(trainingData);
      }
    } catch (error) {
      console.error('Error en el proceso de aprendizaje:', error);
      throw error;
    }
  }

  /**
   * Reentrena el modelo con datos de entrenamiento.
   */
  private static async retrainWithReinforcement(trainingData: any[]): Promise<void> {
    try {
      await this.initializeModel();
      if (!this.model) throw new Error("Modelo no cargado");

      // Actualizar vocabMap
      const newWords = new Set<string>();
      for (const example of trainingData) {
        const tokens = example.text.toLowerCase().split(/\s+/);
        for (const tk of tokens) {
          if (!(tk in this.vocabMap) && Object.keys(this.vocabMap).length < this.MAX_VOCAB_SIZE) {
            newWords.add(tk);
          }
        }
      }
      let currentSize = Object.keys(this.vocabMap).length;
      newWords.forEach(w => {
        if (currentSize < this.MAX_VOCAB_SIZE) {
          this.vocabMap[w] = currentSize++;
        }
      });
      // Guardar vocab en Firestore
      await FirestoreNLPService.saveVocabularyArray(Object.keys(this.vocabMap));

      // Preparar tensores
      const xsArr: tf.Tensor2D[] = [];
      const ysArr: tf.Tensor2D[] = [];

      for (const example of trainingData) {
        const x = this.textToTensor(example.text);
        const yVec = this.labelsToVector(example.correction);
        const y = tf.tensor2d([yVec], [1, 6]);
        xsArr.push(x);
        ysArr.push(y);
      }
      const xs = tf.concat(xsArr);
      const ys = tf.concat(ysArr);

      // Fit
      const result = await this.model.fit(xs, ys, {
        epochs: 5,
        batchSize: 32,
        validationSplit: 0.2
      });

      xs.dispose();
      ys.dispose();

      console.log("Reentrenamiento completado:", result.history);

      // Guardar en IndexedDB
      await this.model.save('indexeddb://nlp-model');
      console.log("Modelo guardado en IndexedDB");
    } catch (error) {
      console.error('Error en reentrenamiento:', error);
      throw error;
    }
  }

  private static labelsToVector(labels: ParsedEventData): number[] {
    // Orden => provider(0), description(1), location(2), date(3), time(4), amount(5)
    return [
      labels.provider ? 1 : 0,
      labels.description ? 1 : 0,
      labels.location ? 1 : 0,
      labels.date ? 1 : 0,
      labels.time ? 1 : 0,
      labels.amount ? 1 : 0
    ];
  }

  // =======================
  //   Preprocesar texto
  // =======================
  private static textToTensor(text: string): tf.Tensor2D {
    const tokens = text.toLowerCase().trim().split(/\s+/);

    const sequence: number[] = tokens
      .map(token => this.vocabMap[token] || 0)
      .slice(0, this.SEQUENCE_LENGTH);

    while (sequence.length < this.SEQUENCE_LENGTH) {
      sequence.push(0);
    }

    return tf.tensor2d([sequence], [1, this.SEQUENCE_LENGTH]);
  }

  // =======================
  // MÉTODOS DE PARSEO
  // =======================

  private static cleanText(text: string): string {
    return text.trim()
      .replace(/^\s*(el|la|los|las)\s+/i, '')
      .replace(/\s+/g, ' ');
  }

  private static processDate(dateStr: string): string {
    if (!dateStr) return '';

    const lower = dateStr.toLowerCase();
    const weekdays: Record<string, number> = {
      domingo: 0, lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6
    };
    if (weekdays[lower] !== undefined) {
      const today = new Date();
      let daysToAdd = weekdays[lower] - today.getDay();
      if (daysToAdd < 0) daysToAdd += 7;
      today.setDate(today.getDate() + daysToAdd);
      return this.toYYYYMMDD(today);
    }
    // Formato "YYYY-MM-DD" o "YYYY/MM/DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
      // Convertir a "YYYY-MM-DD"
      return dateStr.replace(/\//g, '-');
    }
    return '';
  }

  private static processTime(match: RegExpMatchArray | null): string | null {
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] || '00';
    const period = match[3]?.toLowerCase();
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  private static toYYYYMMDD(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }

  private static extractDescription(text: string, eventType: string): string {
    // 1. Buscar área específica con posible nombre propio
    const descriptionMatch = text.match(this.patterns.description);
    
    if (descriptionMatch) {
      const fullMatch = descriptionMatch[0];
      
      // Extraer el área base (restaurant, lobby, etc.)
      const areaMatch = text.match(this.patterns.areaKeywords);
      const areaType = areaMatch ? areaMatch[0] : '';
      
      // Analizar el texto que sigue después del área
      const afterArea = text.slice(text.indexOf(fullMatch) + areaType.length).trim();
      
      // Buscar un nombre propio en el texto siguiente
      const properNameMatch = afterArea.match(this.patterns.properName);
      
      if (properNameMatch && !this.isExcludedName(properNameMatch[0])) {
        // Combinar área + nombre propio
        return this.cleanText(`${areaType} ${properNameMatch[0]}`);
      }
      
      // Si no hay nombre válido, usar solo el área
      return this.cleanText(areaType);
    }

    return eventType || 'Evento';
  }

  private static excludedWords: string[] = [];

  private static isExcludedName(name: string): boolean {
    // 1. Lista de palabras excluidas actualizada
    const excludedWords = [
      ...this.excludedWords,
      'Hotel', 'Plaza', 'Centro', 'Events', 'Productions',
      // Nombres comunes que no son nombres de áreas
      'Principal', 'Central', 'Exterior', 'Interior'
    ];

    // 2. Verificar si es parte de otra propiedad ya extraída
    const text = name.toLowerCase();
    if (this.currentContext?.provider?.toLowerCase().includes(text) ||
        this.currentContext?.location?.toLowerCase().includes(text)) {
      return true;
    }

    // 3. Verificar exclusiones directas
    return excludedWords.some(word => 
      name.toLowerCase().includes(word.toLowerCase())
    );
  }

  private static validateDescriptionWithTensor(
    description: string,
    text: string,
    scores: Float32Array
  ): string {
    // Usar el score de confianza para description
    const descriptionConfidence = scores[1]; // Índice 1
  }

  private static fallbackAmount(originalText: string, data: ParsedEventData): ParsedEventData {
    if (data.amount && data.amount >= 1000) return data;
    const tokens = originalText.split(/[\s,]+/).filter(Boolean);
    const usedTokens = [
      data.provider?.toLowerCase(),
      data.location?.toLowerCase(),
      data.date,
      data.time,
      data.description?.toLowerCase()
    ].filter(Boolean);

    const leftoverTokens = tokens.filter(tk => !usedTokens.includes(tk.toLowerCase()));
    for (const leftover of leftoverTokens) {
      const numericCandidate = leftover.replace(/\$/g, '');
      if (/^\d{4,}$/.test(numericCandidate)) {
        data.amount = parseInt(numericCandidate, 10);
        break;
      }
    }
    return data;
  }

  private static enrichPredictionWithTrainingData(
    currentPrediction: ParsedEventData,
    trainingData: any[]
  ): ParsedEventData {
    // Ejemplo: no cambia la predicción
    return currentPrediction;
  }

  private static enrichPrediction(eventData: ParsedEventData, historicalEvents: any[]): ParsedEventData {
    // Ejemplo simplificado
    return eventData;
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    const commonChars = str1.split('').filter(c => str2.includes(c));
    return commonChars.length / Math.max(str1.length, str2.length);
  }

  private static calculateReward(prediction: ParsedEventData, correction: ParsedEventData): number {
    let totalReward = 0;
    const fields: (keyof typeof this.REWARD_WEIGHTS)[] = [
      'provider','description','location','date','time','amount'
    ];
    for (const field of fields) {
      if (prediction[field] && correction[field]) {
        if (typeof prediction[field] === 'string') {
          const sim = this.calculateStringSimilarity(
            (prediction[field] as string).toLowerCase(),
            (correction[field] as string).toLowerCase()
          );
          totalReward += sim * (this.REWARD_WEIGHTS[field] || 0.1);
        } else {
          const sim = prediction[field] === correction[field] ? 1 : 0;
          totalReward += sim * (this.REWARD_WEIGHTS[field] || 0.1);
        }
      }
    }
    return totalReward / fields.length;
  }

  private static titleCasePrediction(prediction: ParsedEventData): ParsedEventData {
    const toTitleCase = (str: string) =>
      str
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

    return {
      ...prediction,
      provider: prediction.provider ? toTitleCase(prediction.provider) : null,
      location: prediction.location ? toTitleCase(prediction.location) : null,
      description: prediction.description ? toTitleCase(prediction.description) : null,
    };
  }
}
