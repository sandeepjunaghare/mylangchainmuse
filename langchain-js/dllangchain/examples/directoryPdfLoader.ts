import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextSplitter } from 'langchain/text_splitter';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { DirectoryLoader } from 'langchain/dist/document_loaders/fs/directory';

import 'dotenv/config';
require('dotenv').config();

export const run = async () => {
  console.log('start');

  // load all pdfs from a specified directory
  const directoryLoader = new DirectoryLoader('./data', {
    '.pdf': (path1: string) => new PDFLoader(path1),
  });
  const docs1 = await directoryLoader.load();
  console.log({ docs1 });

  // Additional setps: Split text into chunks with any TextSplitter. you can then use it as context or sabe it to memory afterwards.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs1 = await textSplitter.splitDocuments(docs1);
  console.log({ splitDocs1 });

  console.log('end');
};
