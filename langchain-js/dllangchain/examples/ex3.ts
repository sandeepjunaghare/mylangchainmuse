// document loaders and splitters
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';
// peer dependency, used to support .gitignore syntax
import ignore from 'ignore';
// peer dependency
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import * as parse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { CharacterTextSplitter } from 'langchain/text_splitter';

export const run = async () => {
  console.log('here');
  require('dotenv').config();

  const loader = new GithubRepoLoader(
    'https://github.com/langchain-ai/langchainjs',
    { recursive: false, ignorePaths: ['*.md', 'yarn.lock'] }
  );

  const docs = await loader.load();

  console.log(docs.slice(0, 3));

  // pdf loader
  const pdfloader = new PDFLoader(
    './data/Sandeep presentation mental titans 3.pdf'
  );

  // splitter
  console.log('after pdfloader');
  const rawCS229Docs = await pdfloader.load();
  console.log('after rawCS229Docs');
  console.log(rawCS229Docs.slice(0, 5));

  // splitting
  const splitter = RecursiveCharacterTextSplitter.fromLanguage('js', {
    chunkSize: 32,
    chunkOverlap: 0,
  });

  const code = `function helloWorld() {
console.log("Hello, World!");
}
// Call the function
helloWorld();`;

  await splitter.splitText(code);
  console.log('after splitting' + splitter.splitText(code));

  const splitter1 = new CharacterTextSplitter({
    chunkSize: 32,
    chunkOverlap: 0,
    separator: ' ',
  });

  await splitter1.splitText(code);
  console.log(
    'after splitting using character text::' + splitter1.splitText(code)
  );

  const splitter3 = RecursiveCharacterTextSplitter.fromLanguage('js', {
    chunkSize: 64,
    chunkOverlap: 32,
  });
  await splitter3.splitText(code);

  const splitter4 = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
  });

  const splitDocs = await splitter4.splitDocuments(rawCS229Docs);

  console.log(splitDocs.slice(0, 5));
};
