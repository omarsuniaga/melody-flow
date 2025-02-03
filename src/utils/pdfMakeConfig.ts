import { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';

// Inicializar fuentes de forma dinámica
const initializePdfMake = async () => {
  if (typeof window !== 'undefined' && !pdfMake.vfs) {
    try {
      const pdfFonts = await import('pdfmake/build/vfs_fonts.js');
      Object.defineProperty(pdfMake, 'vfs', {
        value: pdfFonts.pdfMake.vfs,
        writable: false
      });
    } catch (error) {
      console.error('Error cargando fuentes:', error);
    }
  }
  return pdfMake;
};

export const createAndDownloadPdf = async (docDefinition: TDocumentDefinitions, fileName: string): Promise<void> => {
  try {
    const pdfInstance = await initializePdfMake();

    // Configurar estilos por defecto
    const finalDocDefinition = {
      ...docDefinition,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        ...docDefinition.defaultStyle
      }
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = pdfInstance.createPdf(finalDocDefinition);
        pdfDoc.getBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          resolve();
        });
      } catch (error) {
        reject(new Error('Error generando PDF: ' + error));
      }
    });
  } catch (error) {
    console.error('Error en createAndDownloadPdf:', error);
    throw error;
  }
};
