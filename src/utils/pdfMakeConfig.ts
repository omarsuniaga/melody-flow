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
  onAudit?: (log: PdfAuditLog) => void;
}

interface PdfAuditLog {
  timestamp: string;
  action: 'created' | 'downloaded' | 'opened' | 'error';
  fileName: string;
  status: 'success' | 'failed';
  message?: string;
}

// Configuración inicial de fuentes
pdfMake.vfs = pdfFonts.vfs;

// Función para registrar auditoría
const auditLog = (log: PdfAuditLog) => {
  console.log(`[PDF AUDIT] ${log.timestamp} | ${log.action} | ${log.fileName} | ${log.status}${log.message ? ` | ${log.message}` : ''}`);
};

// Función principal para crear y descargar PDF
export async function createAndDownloadPdf(
  docDefinition: TDocumentDefinitions,
  options: PdfOptions = {}
): Promise<void> {
  const {
    fileName = 'documento.pdf',
    openInNewTab = false,
    compression = true,
    onAudit
  } = options;

  // Validación de entrada
  if (!docDefinition || !docDefinition.content) {
    const errorLog: PdfAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'created',
      fileName,
      status: 'failed',
      message: 'Definición de documento inválida'
    };
    onAudit?.(errorLog);
    auditLog(errorLog);
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
        subject: 'Reporte de Actividades Musicales',
        keywords: 'música, eventos, pagos',
        ...docDefinition.info
      }
    });

    const createdLog: PdfAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'created',
      fileName,
      status: 'success'
    };
    onAudit?.(createdLog);
    auditLog(createdLog);

    return new Promise((resolve, reject) => {
      try {
        if (openInNewTab) {
          pdfDoc.open({}, window);
          const openLog: PdfAuditLog = {
            timestamp: new Date().toISOString(),
            action: 'opened',
            fileName,
            status: 'success'
          };
          onAudit?.(openLog);
          auditLog(openLog);
          resolve();
        } else {
          pdfDoc.download(fileName, () => {
            const downloadLog: PdfAuditLog = {
              timestamp: new Date().toISOString(),
              action: 'downloaded',
              fileName,
              status: 'success'
            };
            onAudit?.(downloadLog);
            auditLog(downloadLog);
            resolve();
          });
        }
      } catch (error) {
        const pdfError = error as PdfError;
        pdfError.details = `Error al ${openInNewTab ? 'abrir' : 'descargar'} el PDF`;
        const errorLog: PdfAuditLog = {
          timestamp: new Date().toISOString(),
          action: openInNewTab ? 'opened' : 'downloaded',
          fileName,
          status: 'failed',
          message: pdfError.details
        };
        onAudit?.(errorLog);
        auditLog(errorLog);
        console.error(pdfError.details, pdfError);
        reject(pdfError);
      }
    });
  } catch (error) {
    const pdfError = error as PdfError;
    pdfError.details = 'Error al crear el PDF';
    const errorLog: PdfAuditLog = {
      timestamp: new Date().toISOString(),
      action: 'created',
      fileName,
      status: 'failed',
      message: pdfError.details
    };
    onAudit?.(errorLog);
    auditLog(errorLog);
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