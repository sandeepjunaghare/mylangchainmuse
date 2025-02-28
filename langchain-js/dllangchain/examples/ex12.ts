import 'dotenv/config';
require('dotenv').config();
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const run = async () => {
  console.log('start');

  const openaiApiKey = process.env.OPENAI_API_KEY;
  console.log('openaiApiKey: ', openaiApiKey);

  // pdf loader
  const pdfPath = './data/MachineLearning-Lecture01.pdf';
  const pdfloader = new PDFLoader(pdfPath);

  console.log('before pdfloader');
  const pages = await pdfloader.load();
  console.log('pages length: ', pages.length);
  console.log('after pdfloader');

  // split the document into pages
  const splitDocs = await RecursiveCharacterTextSplitter..splitDocuments(pages);
  console.log('after splitDocs: ', pages);

  console.log('end');
};
