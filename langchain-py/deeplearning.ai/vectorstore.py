import os
import openai
import sys

sys.path.append('../..')

from dotenv import load_dotenv, find_dotenv

_ = load_dotenv(find_dotenv()) # read local .env file

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
#
# 

from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings.openai import OpenAIEmbeddings

import numpy as np


from langchain_community.vectorstores import Chroma


print ('start')

openai.api_key  = os.environ['OPENAI_API_KEY']
print(os.environ['OPENAI_API_KEY'])

# Load PDF
loaders = [
  PyPDFLoader("/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture1.pdf"),
  PyPDFLoader("/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture1.pdf"),
  PyPDFLoader("/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture2.pdf"),
  PyPDFLoader("/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture3.pdf"),
]
docs = []
for loader in loaders:
  docs.extend(loader.load())

#Split
text_splitter = RecursiveCharacterTextSplitter(
  chunk_size = 1500,
  chunk_overlap = 150
)
splits = text_splitter.split_documents(docs)
len(splits)
print(len(splits))


#Embeddings - Lets take our splits and embed them
embedding = OpenAIEmbeddings()

sentence1 = "i like dogs"
sentence2 = "i like canines"
sentence3 = "the weather is ugly outside"

embedding1 = embedding.embed_query(sentence1)
embedding2 = embedding.embed_query(sentence2)
embedding3 = embedding.embed_query(sentence3)

print(np.dot(embedding1, embedding2))
print(np.dot(embedding1, embedding3))
print(np.dot(embedding2, embedding3))

# vectorstores
persist_directory = '/Users/sandeep/Dropbox/dev/projects/langchain/langchain-py/deeplearning.ai/docs/chroma'

vectordb = Chroma.from_documents(
  documents=splits,
  embedding=embedding,
  persist_directory=persist_directory
)

#vectordb = Chroma("langchain_store", embedding)


print(vectordb._collection.count())

# similarity search
question = "is ther an email i can ask for help"
docs = vectordb.similarity_search(question,k=3)

len(docs)
docs[0].page_content
#print("page content:")
#print(docs[0].page_content)

vectordb.persist()

#failure mode
question1 = "what did they say about matlab?"

docs1 = vectordb.similarity_search(question,k=5)

#print("docs1[0]")
#print(docs1[0])

#print("docs1[1]")
#print(docs1[1])

question3 = "what did they say about regression in the third lecture?"
docs3 = vectordb.similarity_search(question, k=5)

for doc in docs3:
    print(doc.metadata)

print(docs3[4].page_content)



print('end')