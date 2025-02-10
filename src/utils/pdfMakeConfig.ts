import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Asignar vfs usando la exportación de pdfFonts
pdfMake.vfs = pdfFonts.vfs;

/**
 * Crea un documento PDF a partir de docDefinition y fuerza su descarga con el nombre fileName.
 */
export async function createAndDownloadPdf(docDefinition: any, fileName: string): Promise<void> {
  try {
    const pdfDoc = pdfMake.createPdf(docDefinition);
    return new Promise((resolve, reject) => {
      try {
        pdfDoc.download(fileName, () => {
          console.log("PDF descargado correctamente");
          resolve();
        });
      } catch (error) {
        console.error("Error al descargar el PDF:", error);
        reject(error);
      }
    });
  } catch (error) {
    console.error("Error al crear el PDF:", error);
    throw error;
  }
}
