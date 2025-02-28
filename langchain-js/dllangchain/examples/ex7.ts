import 'dotenv/config';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import {
  createDocumentretrievalChain,
  createRephraseQuestionChain,
} from './lib/helpers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { GithubRepoLoader } from 'langchain/document_loaders/web/github';

import http, { IncomingMessage, ServerResponse } from 'http';
import fetch, { Response } from 'node-fetch';

require('dotenv').config();
require('util').TextDecoder;

export const run = async () => {
  console.log('running ex7.ts');
  const documentRetrievalChain = await createDocumentretrievalChain();
  console.log('after documentRetrievalChain');
  const rephraseQuestionChain = await createRephraseQuestionChain();
  console.log('after rephraseQuestionChain');

  const ANSWER_CHAIN_SYSTEM_TEMPLATE = `You are an experienced researcher, expert at interpreting and answering questions based on provided sources. 
  Using the provided context, answer the user's question to the best of your ability using only the resources provided. Be verbose!
  <context>
  {context}
  </context>`;

  const answerGenerationChainPrompt = ChatPromptTemplate.fromMessages([
    ['system', ANSWER_CHAIN_SYSTEM_TEMPLATE],
    new MessagesPlaceholder('history'),
    [
      'human',
      `Now, answer this question using the previous context and chat history: \n
      {standalone_question}`,
    ],
  ]);

  const conversationalRetrievalChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      standalone_question: rephraseQuestionChain,
    }),

    RunnablePassthrough.assign({
      context: documentRetrievalChain,
    }),
    answerGenerationChainPrompt,
    new ChatOpenAI({ modelName: 'gpt-3.5-turbo-1106' }),
  ]);

  const httpResponseOutputParser = new HttpResponseOutputParser({
    contentType: 'text/plain',
  });

  const messageHistory = new ChatMessageHistory();

  const finalRetrievalChain = new RunnableWithMessageHistory({
    runnable: conversationalRetrievalChain,
    getMessageHistory: (_sessionId) => messageHistory,
    historyMessagesKey: 'history',
    inputMessagesKey: 'question',
  }).pipe(httpResponseOutputParser);

  const messageHistories = {};
  const getMessageHistoryForSession = (sessionId) => {
    if (messageHistories[sessionId] !== undefined) {
      return messageHistories[sessionId];
    }

    const newChatMessageHistory = new ChatMessageHistory();
    messageHistories[sessionId] = newChatMessageHistory;
    return newChatMessageHistory;
  };

  const finalRetrievalChainWithSession = new RunnableWithMessageHistory({
    runnable: conversationalRetrievalChain,
    getMessageHistory: getMessageHistoryForSession,
    historyMessagesKey: 'history',
    inputMessagesKey: 'question',
  }).pipe(httpResponseOutputParser);

  console.log('Begin run');

  // Define the handler type
  type RequestHandler = (
    request: IncomingMessage,
    response: ServerResponse
  ) => Promise<void>;

  // Create an HTTP Server that takes a handler as a parameter
  const createServer = (handler: RequestHandler) => {
    console.log('Creating server');
    const server = http.createServer(async (req, res) => {
      try {
        console.log('Handling request');
        await handler(req, res);
        console.log('Request handled');
      } catch (error) {
        console.error('Error:', error);
        res.statusCode = 500;
        res.end('Ahoy, its Internal Server Error');
      }
    });

    return server;
  };

  // Example usage:
  const url = 'http://localhost';
  const port = 8087;

  const ahandler: RequestHandler = async (
    request: IncomingMessage,
    response: ServerResponse
  ) => {
    console.log('Handling request:aHandler', request.method);
    if (request.method == 'POST') {
      const body = await new Response(request).json();
      console.log('received json data:', body);

      const stream = await finalRetrievalChainWithSession.stream(
        {
          question: body.question,
        },
        {
          configurable: { sessionId: body.session_id },
        }
      );
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } else {
      console.log('Bad Request');
      response.statusCode = 400;
      response.end('Bad Request');
    }
  };

  console.log('create example server');
  const server = createServer(ahandler);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  /*
  const http = require('http');
  const fetch = require('node-fetch');
  const { Request, Response } = require('node-fetch');

  const port = 8087;
  */
  /*
  const handler = async (request: Request): Response => {
    const body = request.json();
    const stream = await finalRetrievalChainWithSession.stream(
      {
        question: body.question,
      },
      { configurable: { sessionId: body.session_id } }
    );

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  };

  
  const handler = async (request: Request, response: Response) => {
    const body = await request.json();
    const stream = await finalRetrievalChainWithSession.stream(
      {
        question: body.question,
      },
      { configurable: { sessionId: body.session_id } }
    );

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  };
*/
  /*
  console.log('Listening on port', port);

  const server = http.createServer(handler);
  server.listen(port);
  console.log('server listening on port', port);

*/

  console.log('create a decoder instance');
  const decoder = new TextDecoder();

  console.log('readChunks');
  function readChunks(reader: ReadableStreamDefaultReader) {
    return {
      async *[Symbol.asyncIterator]() {
        let readResult = await reader.read();
        while (!readResult.done) {
          yield decoder.decode(readResult.value);
          readResult = await reader.read();
        }
      },
    };
  }

  console.log('Begin sleep');
  const sleep = async () => {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  console.log('after sleep');
  // response 1
  console.log('response 1 begin');
  const response1 = await fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'What is the best example of using the Mental Titans program?',
      session_id: '1',
    }),
  });

  console.log('response 1 end:: reader 1 begin');

  // response.body is a ReadableStream
  const reader1 = response1.body?.getReader();

  for await (const chunk of readChunks(reader1)) {
    console.log('CHUNK:', chunk);
  }

  await sleep();

  console.log('begin response 2');
  // response 2
  const response2 = await fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'Who do I contact to purchase Mental Titan program?',
      session_id: '2',
    }),
  });

  // response.body is a ReadableStream
  const reader2 = response2.body?.getReader();

  for await (const chunk of readChunks(reader2)) {
    console.log('CHUNK:', chunk);
  }

  await sleep();

  console.log('Done');
};
