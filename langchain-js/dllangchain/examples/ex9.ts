export const run = async () => {
  console.log('here');

  const port = 8087;
  const response1 = await fetch(`http://localhost:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'Where can i purchase mental titan program?',
      session_id: '1',
    }),
  });
  console.log('end');
};
