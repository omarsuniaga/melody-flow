import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Inicializar pdfMake con las fuentes
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const createAndDownloadPdf = async (docDefinition: any, fileName: string): Promise<void> => {
  try {
    // Crear el documento PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // Forzar la descarga del archivo
    return new Promise((resolve, reject) => {
      try {
        pdfDoc.download(fileName, () => {
          console.log('PDF descargado correctamente');
          resolve();
        });
      } catch (error) {
        console.error('Error al descargar el PDF:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error al crear el PDF:', error);
    throw error;
  }
};
