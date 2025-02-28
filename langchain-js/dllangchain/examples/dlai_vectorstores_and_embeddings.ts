import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextSplitter } from 'langchain/text_splitter';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DirectoryLoader } from 'langchain/dist/document_loaders/fs/directory';

import 'dotenv/config';
require('dotenv').config();

export const run = async () => {
  console.log('start');

  const openaiApiKey = process.env.OPENAI_API_KEY;
  console.log('openaiApiKey: ', openaiApiKey);

  /*
  console.log('before single loader');
  const singleLoader = new PDFLoader('./data/MachineLearning-Lecture01.pdf');
  const singleDoc = await singleLoader.load();
  console.log(singleDoc);
  console.log('after single doc end');
*/
  // pdf loader
  const filenameArray: string[] = [
    './data/MachineLearning-Lecture01.pdf',
    './data/Lecture2.pdf',
    './data/Lecture3.pdf',
    './data/Lecture4.pdf',
    './data/Lecture5.pdf',
  ];

  let docs: any = [];

  console.log('before loop');
  // create a loop

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  filenameArray.forEach(async function (value) {
    console.log(value);
    const pdfLoader = new PDFLoader(value);
    console.log('after creating pdfLoader' + pdfLoader.filePathOrBlob);

    docs = await pdfLoader.load();

    console.log('last line loop:');
  });

  delay(3000);
  //console.log(docs);

  //console.log('before pdfloader');
  //const pages = await pdfloader.load();
  //console.log('pages length: ', pages.length);
  //console.log('after pdfloader');

  // split the document into pages
  const text_splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 150,
  });

  const splitDocs = await text_splitter.splitDocuments(docs);
  console.log('after splitDocs: ', splitDocs);

  /*
  // load all pdfs from a specified directory
  const directoryLoader = new DirectoryLoader('data', {
    '.pdf': (pathStr: string) => new PDFLoader(pathStr),
  });

  
  const docs1 = await directoryLoader.load();
  console.log({ docs });

  // Additional setps: Split text into chunks with any TextSplitter. you can then use it as context or sabe it to memory afterwards.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs1 = await textSplitter.splitDocuments(docs1);
  console.log({ splitDocs1 });
*/
  console.log('end');
};
