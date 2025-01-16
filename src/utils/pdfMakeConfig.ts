let pdfMakeInstance: any = null;

// Declarar el tipo global para window
declare global {
  interface Window {
    pdfMake: any;
  }
}

async function initializePdfMake() {
  const pdfMake = await import('pdfmake/build/pdfmake');
  const pdfFonts = await import('pdfmake/build/vfs_fonts');

  // Asegurarse de que pdfMake está disponible
  if (!window.pdfMake) {
    window.pdfMake = pdfMake.default;
    window.pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
  }

  return window.pdfMake;
}

// Una sola exportación
export { initializePdfMake };
