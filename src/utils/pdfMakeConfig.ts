import { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Inicializar pdfMake con las fuentes
if (typeof window !== 'undefined') {
  pdfMake.vfs = pdfFonts.pdfMake?.vfs;
}

export const createAndDownloadPdf = async (docDefinition: TDocumentDefinitions, fileName: string): Promise<void> => {
  try {
    // Verificación adicional de las fuentes
    if (!pdfMake.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake?.vfs;
    }

    return new Promise((resolve, reject) => {
      try {
        const pdf = pdfMake.createPdf(docDefinition);
        pdf.getBlob((blob) => {
          // Crear un enlace temporal para descargar el PDF
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
        reject(new Error('Error al generar el PDF: ' + error));
      }
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
};
