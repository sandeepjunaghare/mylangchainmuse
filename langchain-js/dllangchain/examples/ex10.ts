import { ChatOpenAI } from '@langchain/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextSplitter } from 'langchain/text_splitter';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { NotionLoader } from 'langchain/document_loaders/fs/notion';
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';

import 'dotenv/config';

require('dotenv').config();

export const run = async () => {
  // pdf loader
  const pdfPath = './data/MachineLearning-Lecture01.pdf';
  const pdfloader = new PDFLoader(pdfPath);

  console.log('before pdfloader');
  const pages = await pdfloader.load();
  console.log('pages length: ', pages.length);
  console.log('after pdfloader');

  // split the document into pages
  const splitDocs = await TextSplitter.splitDocuments(pages);
  console.log('after splitDocs: ', pages);

  /*

  // You tube loader
  const url = 'https://www.youtube.com/watch?v=jGwO_UgTS7I';
  const save_dir = './data';

  const loader = YoutubeLoader.createFromUrl(url, {
    language: 'en',
    addVideoInfo: true,
  });
  const docs = await loader.load();
  console.log('docs: ', docs);

  // web base loader
  // CheerioLoader
  const cheerioLoader = new CheerioWebBaseLoader(
    'https://github.com/basecamp/handbook/blob/master/37signals-is-you.md'
  );

  const cheerioDocs = await cheerioLoader.load();
  console.log('cheerioDocs: ', cheerioDocs);

  // github loader
  const githubLoader = new GithubRepoLoader(
    'https://github.com/langchain-ai/langchainjs',
    {
      branch: 'main',
      recursive: false,
      unknown: 'warn',
      maxConcurrency: 5,
    }
  );
  const githubDocs = await githubLoader.load();
  console.log('githubDocs: ', githubDocs);
  
  // notion loader
  const directoryPath = './data/notion-data';
  const notionLoader = new NotionLoader(directoryPath);
  const notionDocs = await notionLoader.load();
  console.log('notionDocs: ', notionDocs);
  */
};
