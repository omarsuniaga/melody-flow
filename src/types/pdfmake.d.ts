declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export = pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: any;
  export const pdfMake: {
    vfs: any;
  };
}
