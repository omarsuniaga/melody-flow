import { LocalNLPService } from './LocalNLPService';
import type { ImprovedParsedEventData } from './DataExtractor';

export class CorrectionService {
  static async correctAndLearn(
    originalText: string,
    originalPrediction: ImprovedParsedEventData,
    correctedData: ImprovedParsedEventData
  ): Promise<void> {
    try {
      await LocalNLPService.learn(originalText, correctedData, originalPrediction);
      console.log('Corrección registrada y modelo actualizado.');
    } catch (error) {
      console.error('Error al registrar la corrección:', error);
      throw error;
    }
  }
}
