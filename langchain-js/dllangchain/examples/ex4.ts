import 'dotenv/config';
//import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { similarity } from 'ml-distance';
import * as parse from 'pdf-parse';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import {
  Runnable,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

require('dotenv').config();

export const run = async () => {
  console.log('here');

  const embeddings = new OpenAIEmbeddings();

  const res = await embeddings.embedQuery('Hello, world!');

  console.log(res);

  // compare similarities
  const vector1 = await embeddings.embedQuery(
    'What are vectors useful for in machine learning?'
  );

  const unrelatedVecctor = await embeddings.embedQuery(
    
      const res2 = similarity.cosine(vector1, unrelatedVecctor);
      console.log(res2);
    'What is the capital of France?'
  );

  const similarVector = await embeddings.embedQuery(
    'Vectors are representations of data in a multi-dimensional space.'
  );

  const res3 = similarity.cosine(vector1, similarVector);
  console.log(res3);

  // pdf loader
  const pdfloader = new PDFLoader(
    './data/Sandeep presentation mental titans 3.pdf'
  );

  console.log('after pdfloader');
  const rawCS229Docs = await pdfloader.load();
  console.log('after rawCS229Docs');

// splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1536,
    chunkOverlap: 128,
  });

  const splitDocs = await splitter.splitDocuments(rawCS229Docs);

  // memory vector store
  const vectorstore = new MemoryVectorStore(embeddings);

  await vectorstore.addDocuments(splitDocs);

  const retrievedDocs = await vectorstore.similaritySearch(
    'what is cost of the service?',
    2
  );

  const pageContents = retrievedDocs.map((doc) => doc.pageContent);
  console.log(pageContents);

  const retriever = vectorstore.asRetriever();

  const outputRetriever = await retriever.invoke(
    'what is cost of the service?'
  );
  console.log(outputRetriever);

  // Document retrieval in a chain

  const convertDocsToString = (documents: Document[]): string => {
    return documents
      .map((document) => {
        return `<doc>\n${document.pageContent}\n</doc>`;
      })
      .join('\n');
  };

  /*
  {
    question: "What is the cost of Mental Titans?",
  }
*/

  const documentRetrievalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ]);

  const results = await documentRetrievalChain.invoke({
    question: 'What is the cost of Mental Titans?',
  });

  console.log(results);

  // Synthesizing a response
  const TEMPLATE_STRING = `You ar an expereienced researcher, expert at interepreting and answering questions based on provided sources.
  Using the provided constext, answer the user's question
  to the bes of your ability using only the resources provided.Be verbose!
  <context>
  {context}
  Now, answer this question using the above context:
  {question}`;

  const answerGenerationPrompt =
    ChatPromptTemplate.fromTemplate(TEMPLATE_STRING);

  const runnableMap = RunnableMap.from({
    context: documentRetrievalChain,
    question: (input) => input.question,
  });

  await runnableMap.invoke({
    question: 'What is the best example of using the Mental Titans program?',
  });

  // Augmented generation

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-1106',
  });

  const retrievalChain = RunnableSequence.from([
    {
      context: documentRetrievalChain,
      question: (input) => input.question,
    },
    answerGenerationPrompt,
    model,
    new StringOutputParser(),
  ]);

  const answer = await retrievalChain.invoke({
    question: 'What is the best example of using the Mental Titans program?',
  });

  console.log(answer);

  const follupAnswer = await retrievalChain.invoke({
    question: 'Can you list them in bullet point form?',
  });

  console.log(follupAnswer);

  const docs = await documentRetrievalChain.invoke({
    question: 'Can you list them in bullet point form?',
  });
console.log(docs);
  


};


// Question and answering

