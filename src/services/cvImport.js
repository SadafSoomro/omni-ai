export async function readCvFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'txt'].includes(extension)) throw new Error('Choose a PDF, Word (.docx), or text (.txt) file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose a CV smaller than 10 MB.');
  let text = '';
  if (extension === 'txt') text = await file.text();
  if (extension === 'docx') {
    const { default: mammoth } = await import('mammoth');
    text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
  }
  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    let pdf;
    try {
      pdf = await task.promise;
      if (pdf.numPages > 20) throw new Error('Please choose a CV with no more than 20 pages.');
      for (let index = 1; index <= pdf.numPages; index++) {
        const content = await (await pdf.getPage(index)).getTextContent();
        text += content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join('') + '\n';
      }
    } finally { await task.destroy(); }
  }
  text = text.trim();
  if (text.length < 30) throw new Error('No readable CV text found. For scanned PDFs, upload a text-based PDF or Word file instead.');
  if (text.length > 40000) throw new Error('This CV has too much text. Please upload a shorter version.');
  return text;
}
