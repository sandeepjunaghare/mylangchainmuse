import {
  RecursiveCharacterTextSplitter,
  CharacterTextSplitter,
  TokenTextSplitter,
  MarkdownTextSplitter,
} from 'langchain/text_splitter';
import { NotionLoader } from 'langchain/document_loaders/fs/notion';
import { Document } from 'langchain/document';

import 'dotenv/config';
require('dotenv').config();

export const run = async () => {
  const chunk_size = 26;
  const chunk_overlap = 4;

  const r_splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunk_size,
    chunkOverlap: chunk_overlap,
  });

  const c_splitter = new CharacterTextSplitter({
    chunkSize: chunk_size,
    chunkOverlap: chunk_overlap,
  });
  // create documents
  const text =
    'Hello, \n\n\n   how are you? I am \n\n fine, thank \n you. f f f f How about you? I am also fine.';
  const split_text = await r_splitter.createDocuments([text]);
  // split documents
  const docOutput = await r_splitter.splitDocuments([
    new Document({ pageContent: text }),
  ]);

  console.log('split_text: ', split_text);
  console.log('docOutput: ', docOutput);

  const text1 = 'foo bar baz 123';
  const c_splitter1 = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 7,
    chunkOverlap: 3,
  });
  const output = await c_splitter1.createDocuments([text1]);
  console.log('output character text splitter: ', output);

  const text2 = 'abcdefghijklmnopqrstuvwxyz';
  const str2 = await r_splitter.splitText(text2);
  console.log('does not split: ', str2);

  const text3 = 'abcdefghijklmnopqrstuvwxyzabcdefg';
  const str3 = await r_splitter.splitText(text3);
  console.log('does split: ', str3);

  const text4 = 'a b c d e f g h i j k l m n o p q r s t u v w x y z';
  const str4 = await r_splitter.splitText(text4);
  console.log('does split: ', str4);

  const some_text =
    "When writing documents, writers will use document structure to group content. \
This can convey to the reader, which idea's are related. For example, closely related ideas \
are in sentances. Similar ideas are in paragraphs. Paragraphs form a document. \n\n  \
Paragraphs are often delimited with a carriage return or two carriage returns. \
Carriage returns are the" +
    'backslash n' +
    'you see embedded in this string. \
Sentences have a period at the end, but also, have a space.\
and words are separated by space.';

  console.log('some_text length: ', some_text.length);

  const c_splitter2 = new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 450,
    chunkOverlap: 0,
  });

  const r_splitter2 = new RecursiveCharacterTextSplitter({
    chunkSize: 450,
    chunkOverlap: 0,
    separators: ['\n\n', '\n', ' ', ''],
  });

  const str5 = await r_splitter2.splitText(some_text);
  console.log('str5: ', str5);
  const str6 = await c_splitter2.splitText(some_text);
  console.log('str6: ', str6);

  // token text splitter
  const text7 =
    'Hello, how are you? I am fine, thank you. How about you? I am also fine.';
  const token_splitter = new TokenTextSplitter({
    chunkSize: 1,
    chunkOverlap: 0,
  });
  const str7 = await token_splitter.splitText(text7);
  console.log('str7: ', str7);

  // markdown text splitter
  const markdown_document =
    ' # Title\n\n  ## Chapter 1\n\n \
Hi this is Jim\n\n Hi this is Joe\n\n \
### Section \n\n \
Hi this is Lance \n\n \
## Chapter 2\n\n \
Hi this is Molly';

  const headers_to_split_on = [
    ('#', 'Header 1'),
    ('##', 'Header 2'),
    ('###', 'Header 3'),
  ];

  const markdown_splitter = new MarkdownTextSplitter({
    headers_to_split_on: headers_to_split_on,
  });

  const str8 = await markdown_splitter.splitText(markdown_document);
  console.log('str8: ', str8);

  // notion loader
  const directoryPath = './data/notion-data';
  const notionLoader = new NotionLoader(directoryPath);
  const notionDocs = await notionLoader.load();
  const notionDoc = notionDocs[0];
  console.log('notionDocs: ', notionDocs);

  //  const notionDocSplit = await markdown_splitter.splitText(notionDoc);

  console.log('end of ex11.ts');
};
