import { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configuración inicial de pdfMake y sus fuentes
(() => {
  try {
    if (typeof window !== 'undefined') {
      // Asignar fuentes directamente
      (window as any).pdfMake = pdfMake;
      (window as any).pdfMake.vfs = pdfFonts.pdfMake.vfs;
    }
  } catch (error) {
    console.error('Error inicializando pdfMake:', error);
  }
})();

export const createAndDownloadPdf = async (docDefinition: TDocumentDefinitions, fileName: string): Promise<void> => {
  try {
    // Asegurarse de que el documento use Roboto como fuente predeterminada
    docDefinition.defaultStyle = {
      ...docDefinition.defaultStyle,
      font: 'Roboto'
    };

    // Crear y descargar el PDF
    return new Promise((resolve, reject) => {
      try {
        const pdf = pdfMake.createPdf(docDefinition);
        pdf.getBlob((blob) => {
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
      } catch (downloadError) {
        console.error('Error al descargar el PDF:', downloadError);
        reject(new Error('Error al generar el PDF: ' + downloadError.message));
      }
    });
  } catch (error) {
    console.error('Error en createAndDownloadPdf:', error);
    throw error;
  }
};
