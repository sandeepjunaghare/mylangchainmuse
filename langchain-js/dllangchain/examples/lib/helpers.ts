import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { Document } from 'langchain/document';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

type chunkSizeOverlapJson = {
  chunkSize: number;
  chunkOverlap: number;
};

export async function loadAndSplitChunks(chunkSO: chunkSizeOverlapJson) {
  // pdf loader
  const pdfloader = new PDFLoader(
    './data/Sandeep presentation mental titans 3.pdf'
  );

  console.log('after pdfloader');
  const rawCS229Docs = await pdfloader.load();
  console.log('after rawCS229Docs');
  // splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSO.chunkSize,
    chunkOverlap: chunkSO.chunkOverlap,
  });

  const splitDocs = await splitter.splitDocuments(rawCS229Docs);

  return splitDocs;
}

export async function initializeVectorstoreWithDocuments({
  documents: splitDocs,
}) {
  const embeddings = new OpenAIEmbeddings();

  // memory vector store
  const vectorstore = new MemoryVectorStore(embeddings);

  await vectorstore.addDocuments(splitDocs);

  return vectorstore;
}

export async function createDocumentretrievalChain() {
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

  const documentRetrievalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ]);

  return documentRetrievalChain;
}

export async function createRephraseQuestionChain() {
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

  const documentRetrievalChain = await createDocumentretrievalChain();

  const retrievalChain = RunnableSequence.from([
    {
      context: documentRetrievalChain,
      question: (input) => input.question,
    },
    answerGenerationPrompt,
    model,
    new StringOutputParser(),
  ]);

  return retrievalChain;
}
