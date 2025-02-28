import { ChatOpenAI } from '@langchain/openai';
//import 'dotenv/config';
//require('dotenv').config();

export const run = async () => {
  const chat = new ChatOpenAI({});

  console.log('here');

  const response = async () => {
    await chat.invoke('Hello, how are you?');
  };

  console.log(response);
};
