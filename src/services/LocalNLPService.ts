// LocalNLPService.ts
import * as tf from '@tensorflow/tfjs';
// import type { ParsedEventData } from '../types/event';
// import { FirestoreNLPService } from './FirestoreNLPService';
import { ModelStorageService } from './ModelStorageService';
import { useEventStore } from '../stores/eventStore';
import { ModelManager } from './ModelManager';
import { TextPreprocessor } from './TextPreprocessor';
import { DataExtractor, ImprovedParsedEventData } from './DataExtractor';
import { TrainingManager } from './TrainingManager';

export class LocalNLPService {
  // Umbrales de confianza para cada campo
  private static readonly CONFIDENCE_THRESHOLDS = {
    provider: 0.5,
    description: 0.5,
    location: 0.5,
    date: 0.5,
    time: 0.5,
    amount: 0.5,
  };

  /**
   * Recibe un texto, lo procesa y retorna los datos extraídos.
   */
  static async parseText(text: string): Promise<ImprovedParsedEventData> {
    try {
      await ModelManager.initializeModel();
      if (!ModelManager.model) throw new Error('Modelo no inicializado');

      const inputTensor = TextPreprocessor.textToTensor(text);
      const predictionTensor = ModelManager.model.predict(inputTensor) as tf.Tensor<tf.Rank>;
      const scores = (await predictionTensor.data()) as Float32Array;

      inputTensor.dispose();
      predictionTensor.dispose();

      let extractedData = DataExtractor.extractDataWithRegex(text, scores, this.CONFIDENCE_THRESHOLDS);

      // Si no se detectó fecha, interpretar "hoy" o "mañana"
      if (!extractedData.date) {
        extractedData = DataExtractor.interpretRelativeDays(text, extractedData);
      }

      const finalPrediction = await LocalNLPService.enrichPredictionAndLearn(extractedData, text);
      return finalPrediction;
    } catch (error) {
      console.error('Error en parseText:', error);
      return DataExtractor.createErrorResponse('No se pudo procesar el texto automáticamente.');
    }
  }

  private static async enrichPredictionAndLearn(data: ImprovedParsedEventData, originalText: string): Promise<ImprovedParsedEventData> {
    const eventStore = useEventStore();
    const historicalEvents = eventStore.events || [];
    const trainingData = await ModelStorageService.loadTrainingDataLocal();

    let finalData = this.enrichPredictionWithTrainingData(data, trainingData);
    finalData = this.enrichPrediction(finalData, historicalEvents);
    finalData = DataExtractor.fallbackAmount(originalText, finalData);
    finalData = TrainingManager.titleCasePrediction(finalData);
    return finalData;
  }

  // Aquí se puede implementar la lógica de enriquecimiento usando datos de entrenamiento.
  private static enrichPredictionWithTrainingData(data: ImprovedParsedEventData, trainingData: any[]): ImprovedParsedEventData {
    // Utilizamos trainingData para evitar error por variable no leída.
    return data;
  }

  private static enrichPrediction(eventData: ImprovedParsedEventData, historicalEvents: any[]): ImprovedParsedEventData {
    const context = TrainingManager.buildContextFromEvents(historicalEvents);

    // Validar proveedor
    if (eventData.provider) {
      const provCandidate = context.provider.find(p =>
        p.toLowerCase() === eventData.provider!.toLowerCase() ||
        eventData.provider!.toLowerCase().includes(p.toLowerCase()) ||
        p.toLowerCase().includes(eventData.provider!.toLowerCase())
      );
      if (provCandidate) {
        eventData.provider = provCandidate;
      }
    } else {
      if (context.provider.length > 0) {
        eventData.provider = context.provider[0];
      }
    }

    // Validar ubicación
    if (eventData.location) {
      const locCandidate = context.location.find(loc =>
        loc.toLowerCase() === eventData.location!.toLowerCase() ||
        eventData.location!.toLowerCase().includes(loc.toLowerCase()) ||
        loc.toLowerCase().includes(eventData.location!.toLowerCase())
      );
      if (locCandidate) {
        eventData.location = locCandidate;
      }
    }

    // Validar descripción
    if (eventData.description) {
      const descCandidate = context.description.find(desc =>
        desc.toLowerCase() === eventData.description!.toLowerCase() ||
        eventData.description!.toLowerCase().includes(desc.toLowerCase()) ||
        desc.toLowerCase().includes(eventData.description!.toLowerCase())
      );
      if (descCandidate) {
        eventData.description = descCandidate;
      }
    }
    return eventData;
  }

  // Expone el método de aprendizaje para registrar correcciones
  static async learn(originalText: string, correctedData: ImprovedParsedEventData, originalPrediction: ImprovedParsedEventData): Promise<void> {
    await TrainingManager.learn(originalText, correctedData, originalPrediction);
  }
}