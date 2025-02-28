import 'dotenv/config';
import { loadAndSplitChunks } from './lib/helpers';
import { initializeVectorstoreWithDocuments } from './lib/helpers';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { Document } from 'langchain/document';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableMap } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { MessagesPlaceholder } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { RunnablePassthrough } from '@langchain/core/runnables';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

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

  const convertDocsToString = (documents: Document[]): string => {
    return documents
      .map((document) => {
        return `<doc>\n${document.pageContent}\n</doc>`;
      })
      .join('\n');
  };

  const documentRetrievalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ]);

  const TEMPLATE_STRING = ` You are an experiece researcher, expert at interpreting and asnwering questions based on
  provided sources. Using the provided constext, answer the user's question to the best of your ability using only
  the resources provided. Be Verbose!
  <context>
  {context}
  </context>
  Now, answer this question using the above context:
  {question}`;

  const answerGenerationPrompt =
    ChatPromptTemplate.fromTemplate(TEMPLATE_STRING);

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

  // Adding History
  const REPHARE_QUESTION_SYSTEM_TEMPLATE = `Given the following conversations and a follow up question,
  rephase the follow up question to be a standalone question.`;

  const rephraseQuestionChainPrompt = ChatPromptTemplate.fromMessages([
    'system',
    REPHARE_QUESTION_SYSTEM_TEMPLATE,
    new MessagesPlaceholder('history'),
    [
      'human',
      'Rephrase the following question as a standalone question; \n{question}',
    ],
  ]);

  const rephraseQuestionChain = RunnableSequence.from([
    rephraseQuestionChainPrompt,
    new ChatOpenAI({ temperature: 0.1, modelName: 'gpt-3.5-turbo-1106' }),
    new StringOutputParser(),
  ]);

  const originalQuestion = 'What is the cost of Mental Titans?';
  const originalAnswer = await retrievalChain.invoke({
    question: originalQuestion,
  });
  console.log('### original answer:');
  console.log(originalAnswer);

  const chatHistory = [
    new HumanMessage(originalQuestion),
    new AIMessage(originalAnswer),
  ];

  await rephraseQuestionChain.invoke({
    question: 'Can you list them in bullet point form?',
    history: chatHistory,
  });

  //Putting it all together
  const convertDocsToString1 = (documents: Document[]): string => {
    return documents
      .map((document) => {
        return `<doc>\n${document.pageContent}\n</doc>`;
      })
      .join('\n');
  };
  const documentRetrievalChain1 = RunnableSequence.from([
    (input) => input.standalone_question,
    retriever,
    convertDocsToString1,
  ]);

  const ANSWER_CHAIN_SYSTEM_TEMPLATE = `You are an experienced researcher, 
expert at interpreting and answering questions based on provided sources.
Using the below provided context and chat history, 
answer the user's question to the best of 
your ability 
using only the resources provided. Be verbose!

<context>
{context}
</context>`;

  const answerGenerationPrompt1 = ChatPromptTemplate.fromMessages([
    ['system', ANSWER_CHAIN_SYSTEM_TEMPLATE],
    new MessagesPlaceholder('history'),
    [
      'human',
      'Now, answer this question using the previous context and chat history: \n{standalone_question}',
    ],
  ]);

  await answerGenerationPrompt1.formatMessages({
    context: 'fake retrieved content',
    standalone_question: 'Why is the sky blue?',
    history: [
      new HumanMessage('How are you?'),
      new AIMessage('Fine, thank you.'),
    ],
  });

  const conversationalRetrievalChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      standalone_question: rephraseQuestionChain,
    }),
    RunnablePassthrough.assign({
      context: documentRetrievalChain,
    }),
    answerGenerationPrompt1,
    new ChatOpenAI({ modelName: 'gpt-3.5-turbo' }),
    new StringOutputParser(),
  ]);

  const messageHistory = new ChatMessageHistory();

  const finalRetrievalChain = new RunnableWithMessageHistory({
    runnable: conversationalRetrievalChain,
    getMessageHistory: (_sessionId) => messageHistory,
    historyMessagesKey: 'history',
    inputMessagesKey: 'question',
  });

  const originalQuestion1 = await finalRetrievalChain.invoke(
    {
      question: originalQuestion,
    },
    {
      configurable: { sessionId: 'test' },
    }
  );

  const finalResult = await finalRetrievalChain.invoke(
    {
      question: 'What is the best example of using the Mental Titans program?',
    },
    {
      configurable: { sessionId: 'test' },
    }
  );

  console.log('### final result:');
  console.log(finalResult);

  console.log('Done');
};
