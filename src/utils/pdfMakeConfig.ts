console.log("pdfMakeConfig (absolute) loaded");
import pdfMake from "pdfmake/build/pdfmake";
// Se cambia la importación por defecto en lugar de "import * as pdfFonts"
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";

// Definición de tipos personalizados
interface PdfError extends Error {
  code?: string;
  details?: string;
}

interface PdfOptions {
  fileName?: string;
  openInNewTab?: boolean;
  compression?: boolean;
}

// Configuración inicial de fuentes
pdfMake.vfs = pdfFonts.vfs;

// Función principal para crear y descargar PDF
export async function createAndDownloadPdf(
  docDefinition: TDocumentDefinitions,
  options: PdfOptions = {}
): Promise<void> {
  const {
    fileName = 'documento.pdf',
    openInNewTab = false,
    compression = true
  } = options;

  // Validación de entrada
  if (!docDefinition || !docDefinition.content) {
    throw new Error('Se requiere un docDefinition válido con contenido');
  }

  try {
    // Configuración del documento
    const pdfDoc = pdfMake.createPdf({
      ...docDefinition,
      compress: compression,
      info: {
        title: fileName.replace('.pdf', ''),
        creator: 'MelodyFlow',
        producer: 'MelodyFlow PDF Generator',
        ...docDefinition.info
      }
    });

    return new Promise((resolve, reject) => {
      try {
        if (openInNewTab) {
          pdfDoc.open({}, window);
          resolve();
        } else {
          pdfDoc.download(fileName, () => {
            console.log(`PDF ${fileName} generado y descargado correctamente`);
            resolve();
          });
        }
      } catch (error) {
        const pdfError = error as PdfError;
        pdfError.details = `Error al ${openInNewTab ? 'abrir' : 'descargar'} el PDF`;
        console.error(pdfError.details, pdfError);
        reject(pdfError);
      }
    });
  } catch (error) {
    const pdfError = error as PdfError;
    pdfError.details = 'Error al crear el PDF';
    console.error(pdfError.details, pdfError);
    throw pdfError;
  }
}

// Función auxiliar para previsualizar PDF
export async function previewPdf(
  docDefinition: TDocumentDefinitions
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBase64((base64) => {
        const dataUrl = `data:application/pdf;base64,${base64}`;
        resolve(dataUrl);
      });
    } catch (error) {
      const pdfError = error as PdfError;
      pdfError.details = 'Error al generar vista previa del PDF';
      reject(pdfError);
    }
  });
}

// Función para generar PDF en buffer (útil para almacenamiento)
export async function generatePdfBuffer(
  docDefinition: TDocumentDefinitions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      const pdfError = error as PdfError;
      pdfError.details = 'Error al generar buffer del PDF';
      reject(pdfError);
    }
  });
}