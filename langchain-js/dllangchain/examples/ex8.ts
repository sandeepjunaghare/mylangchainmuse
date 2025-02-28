import 'dotenv/config';
import http, { IncomingMessage, ServerResponse } from 'http';
import fetch, { Response } from 'node-fetch';

require('dotenv').config();

export const run = async () => {
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

  const aHandler: RequestHandler = async (request, response) => {
    console.log('Handling request:aHandler');
    const resposne: Response = await fetch(url);
    console.log('a handler after fetch response:', response);
    const data = await response.json();

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(data));
  };

  console.log('create example server');
  const server = createServer(aHandler);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  /*
  const handler = async (request: Request, response: Response) => {
    const body = await request.json();
    const stream = 'hello world';

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  };

  const port = 8087;
  const server = http.createServer(handler);
  server.listen(port);
  console.log('server listening on port', port);

  /*
  // test fetch
  console.log('testing fetch:');
  const response = await fetch(`http://localhost:${port}`);
  console.log('response:', response);
  const data = await response.json();

  console.log('data:', data);
*/

  // response 1
  /*
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
  */
  console.log('end');
};
