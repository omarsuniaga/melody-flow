// TrainingManager.ts
import * as tf from '@tensorflow/tfjs';
import { ModelStorageService } from './ModelStorageService';
import type { ParsedEventData } from '../types/event';
import { TextPreprocessor } from './TextPreprocessor';
import { ImprovedParsedEventData } from './DataExtractor';
import { ModelManager } from './ModelManager';

export class TrainingManager {
  private static trainingInProgress = false;

  public static async learn(originalText: string, correctedData: ImprovedParsedEventData, originalPrediction: ImprovedParsedEventData): Promise<void> {
    try {
      if (!originalText || !correctedData || !originalPrediction) {
        throw new Error('Datos de entrenamiento incompletos');
      }
      const reward = this.calculateReward(originalPrediction, correctedData);
      await ModelStorageService.addTrainingExampleLocal({
        text: originalText,
        prediction: this.convertToOldParsedEventData(originalPrediction),
        correction: this.convertToOldParsedEventData(correctedData),
        reward,
      });
      const trainingData = await ModelStorageService.loadTrainingDataLocal();
      if (trainingData.length >= 5) {
        await this.retrainWithReinforcement(trainingData);
      }
    } catch (error) {
      console.error('Error en el proceso de aprendizaje:', error);
      throw error;
    }
  }

  private static convertToOldParsedEventData(data: ImprovedParsedEventData): ParsedEventData {
    return {
      provider: data.provider,
      description: data.description,
      location: data.location,
      date: data.date,
      time: data.time,
      amount: data.amount?.value ?? null,
    };
  }

  public static async retrainWithReinforcement(trainingData: any[]): Promise<void> {
    console.log("Reentrenamiento iniciado con", trainingData.length, "ejemplos de entrenamiento.");
  if (this.trainingInProgress) {
    console.warn('Entrenamiento ya en curso. Se omite este llamado.');
    return;
  }
  this.trainingInProgress = true;
  try {
    await ModelManager.initializeModel();
    if (!ModelManager.model) throw new Error('Modelo no cargado');

    if (!ModelManager.model.optimizer) {
      console.log('Recompilando modelo para entrenamiento...');
      ModelManager.model.compile({
        optimizer: tf.train.adam(0.0005),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });
    }
    await ModelManager.updateVocabulary(trainingData);

    const { xs, ys } = this.prepareTrainingTensors(trainingData);
    const result = await ModelManager.model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
    });
    xs.dispose();
    ys.dispose();
    console.log('Reentrenamiento completado:', result.history);
    await ModelManager.model.save('indexeddb://nlp-model');
    console.log('Modelo guardado en IndexedDB'); 

    } catch (error) {
      console.error('Error en reentrenamiento:', error);
      throw error;
    } finally {
      this.trainingInProgress = false;
    }

  }

  public static prepareTrainingTensors(trainingData: any[]): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
    const xsArr: tf.Tensor2D[] = [];
    const ysArr: tf.Tensor2D[] = [];
    for (const example of trainingData) {
      const x = TextPreprocessor.textToTensor(example.text);
      const yVec = this.labelsToVector(example.correction);
      const y = tf.tensor2d([yVec], [1, 6]);
      xsArr.push(x);
      ysArr.push(y);
    }
    const xs = tf.concat(xsArr);
    const ys = tf.concat(ysArr);
    return { xs, ys };
  }

  private static labelsToVector(labels: ParsedEventData): number[] {
    return [
      labels.provider ? 1 : 0,
      labels.description ? 1 : 0,
      labels.location ? 1 : 0,
      labels.date ? 1 : 0,
      labels.time ? 1 : 0,
      labels.amount ? 1 : 0,
    ];
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const removeStopWords = (s: string) =>
      s.toLowerCase().split(/\s+/).filter((word) => !['en', 'de', 'la', 'el'].includes(word)).join(' ');
    const s1 = removeStopWords(str1);
    const s2 = removeStopWords(str2);
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    const commonChars = s1.split('').filter((c) => s2.includes(c));
    return commonChars.length / Math.max(s1.length, s2.length);
  }

  private static calculateReward(prediction: ImprovedParsedEventData, correction: ImprovedParsedEventData): number {
    let totalReward = 0;
    const REWARD_WEIGHTS = {
      provider: 0.4,
      description: 0.3,
      location: 0.2,
      date: 0.1,
      time: 0.05,
      amount: 0.05,
    };

    for (const field of Object.keys(REWARD_WEIGHTS) as (keyof typeof REWARD_WEIGHTS)[]) {
      const predictionValue = field === 'amount' ? prediction.amount?.value : prediction[field];
      const correctionValue = field === 'amount' ? correction.amount?.value : correction[field];
      if (predictionValue !== null && correctionValue !== null && predictionValue !== undefined && correctionValue !== undefined) {
        if (typeof predictionValue === 'string' && typeof correctionValue === 'string') {
          const sim = this.calculateStringSimilarity(predictionValue.toLowerCase(), correctionValue.toLowerCase());
          totalReward += sim * REWARD_WEIGHTS[field];
        } else if (typeof predictionValue === 'number' && typeof correctionValue === 'number') {
          const sim = predictionValue === correctionValue ? 1 : 0;
          totalReward += sim * REWARD_WEIGHTS[field];
        } else {
          const sim = String(predictionValue).toLowerCase() === String(correctionValue).toLowerCase() ? 1 : 0;
          totalReward += sim * REWARD_WEIGHTS[field];
        }
      }
    }
    return totalReward / Object.keys(REWARD_WEIGHTS).length;
  }

  public static titleCasePrediction(prediction: ImprovedParsedEventData): ImprovedParsedEventData {
    const toTitleCase = (str: string | null): string | null => {
      if (!str) return null;
      return str
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    return {
      ...prediction,
      provider: toTitleCase(prediction.provider),
      location: toTitleCase(prediction.location),
      description: toTitleCase(prediction.description),
    };
  }

  public static buildContextFromEvents(events: any[]): { [key: string]: any[] } {
    const context: { [key: string]: Set<any> } = {
      provider: new Set(),
      location: new Set(),
      description: new Set(),
      date: new Set(),
      time: new Set(),
      amount: new Set(),
    };
    events.forEach((event) => {
      if (event.provider) context.provider.add(event.provider);
      if (event.location) context.location.add(event.location);
      if (event.description) context.description.add(event.description);
      if (event.date) context.date.add(event.date);
      if (event.time) context.time.add(event.time);
      if (event.amount) context.amount.add(event.amount);
    });
    return {
      provider: Array.from(context.provider),
      location: Array.from(context.location),
      description: Array.from(context.description),
      date: Array.from(context.date),
      time: Array.from(context.time),
      amount: Array.from(context.amount),
    };
  }
}
