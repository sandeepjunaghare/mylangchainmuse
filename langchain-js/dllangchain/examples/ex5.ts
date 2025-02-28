import 'dotenv/config';
import { loadAndSplitChunks } from './lib/helpers';
import { initializeVectorstoreWithDocuments } from './lib/helpers';
import { RunnableSequence } from 'langchain/runnables';
import { Document } from 'langchain/document';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableMap } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

require('dotenv').config();

export const run = async () => {
  const splitDocs = await loadAndSplitChunks({
    chunkSize: 1536,
    chunkOverlap: 128,
  });

  const vectorstore = await initializeVectorstoreWithDocuments({
    documents: splitDocs,
  });

  const retriever = vectorstore.asRetriever();

  // Document retrieval in a chain
  const convertDocsToString = (documents: Document[]): string => {
    return documents
      .map((document) => {
        return `<doc>\n${document.pageContent}\n</doc>`;
      })
      .join('\n');
  };

  /*
question: "What is the cost of Mental Titans?"
*/

  const documentRetrievalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ]);

  const results = await documentRetrievalChain.invoke({
    question: 'What is the cost of Mental Titans?',
  });

  console.log('RESULTS:');
  console.log(results);

  // Synthesize a response

  const TEMLATE_STRING = ` You are an experiece researcher, expert at interpreting and asnwering questions based on 
  provided sources. Using the provided constext, answer the user's question to the best of your ability using only
  the resources provided. Be Verbose!
  <context>
  {context}
  </context>
  Now, answer this question using the above context:
  {question}`;

  const answerGenerationPrompt =
    ChatPromptTemplate.fromTemplate(TEMLATE_STRING);

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
  console.log('### ANSWER:');
  console.log(answer);

  const followupAnswer = await retrievalChain.invoke({
    question: 'Can you list them in bullet point form?',
  });
  console.log('### FOLLOWUP ANSWER:');
  console.log(followupAnswer);

  const docs = await documentRetrievalChain.invoke({
    question: 'Can you list them in bullet point form?',
  });
  console.log('### DOCS:');
  console.log(docs);

  console.log('end');
};
