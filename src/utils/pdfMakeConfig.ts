import { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as pdfMake from 'pdfmake/build/pdfmake';

// Configuración inicial de pdfMake y sus fuentes
const configurePdfMake = async () => {
  if (typeof window !== 'undefined') {
    try {
      // Importar las fuentes dinámicamente solo cuando se necesiten
      const pdfFonts = await import('pdfmake/build/vfs_fonts');
      
      // Configurar pdfMake
      if (!pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      }
    } catch (error) {
      console.error('Error cargando las fuentes:', error);
    }
  }
  return pdfMake;
};

export const createAndDownloadPdf = async (docDefinition: TDocumentDefinitions, fileName: string): Promise<void> => {
  try {
    // Inicializar pdfMake con las fuentes
    const pdfMakeInstance = await configurePdfMake();

    // Asegurar que el documento use la fuente predeterminada
    docDefinition.defaultStyle = {
      ...docDefinition.defaultStyle,
      font: 'Roboto'
    };

    return new Promise((resolve, reject) => {
      try {
        const pdf = pdfMakeInstance.createPdf(docDefinition);
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
      } catch (error) {
        console.error('Error generando PDF:', error);
        reject(new Error('Error al generar el PDF: ' + error));
      }
    });
  } catch (error) {
    console.error('Error en createAndDownloadPdf:', error);
    throw error;
  }
};
