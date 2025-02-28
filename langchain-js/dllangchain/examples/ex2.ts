import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

import 'dotenv/config';

export const run = async () => {
  console.log('here');

  require('dotenv').config();

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-1106',
  });
  const res = async () => {
    await model.invoke([new HumanMessage('Tell me a joke.')]);
  };

  console.log({ res });

  const prompt = await ChatPromptTemplate.fromTemplate(
    `What area three good names for a company that makes {product}?`
  );

  await prompt.format({ product: 'colorful socks' });
  await prompt.formatMessages({ product: 'colorful socks' });

  const promptFromMessages = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      'You are an expert at picking company names.'
    ),
    HumanMessagePromptTemplate.fromTemplate(
      'What are three good names for a company that makes {product}?'
    ),
  ]);

  await promptFromMessages.formatMessages({ product: 'shiny objects' });

  console.log('Messages:');
  console.log(promptFromMessages);

  const promptFromMessages1 = ChatPromptTemplate.fromMessages([
    ['system', 'You are an expert at picking company names.'],
    ['human', 'What are three good names for a company that makes {product}?'],
  ]);

  const message1 = await promptFromMessages1.formatMessages({
    product: 'shiny objects',
  });

  console.log('Messages1:');
  console.log(message1);

  // LCEL
  const chain = prompt.pipe(model);

  const result = await chain.invoke({ product: 'shiny objects' });

  console.log(result);

  const outputParser = new StringOutputParser();
  const nameGenerationChain = prompt.pipe(model).pipe(outputParser);

  const nameGenerationResult = await nameGenerationChain.invoke({
    product: 'fancy cookies',
  });

  console.log(nameGenerationResult);

  // runnable sequence

  const nameGenerationChain1 = RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);

  await nameGenerationChain1.invoke({ product: 'fancy cookies' });

  // Streaming
  const stream = await nameGenerationChain.stream({
    product: 'really cool robots',
  });

  for await (const chunk of stream) {
    console.log(chunk);
  }

  // Batch
  const inputs = [
    { product: 'large calculators' },
    { product: 'alpaca wool sweaters' },
  ];

  await nameGenerationChain.batch(inputs);
};
