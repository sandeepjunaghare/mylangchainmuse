import os
import openai
import sys
sys.path.append('../..')
import panel as pn # GUI
pn.extension()

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.chat_models import ChatOpenAI

from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain




from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv())

print ('start')

openai.api_key = os.environ['OPENAI_API_KEY']
llm_name = "gpt-3.5-turbo"

# vectorstores
persist_directory = '/Users/sandeep/Dropbox/dev/projects/langchain/langchain-py/deeplearning.ai/docs/chroma'
#Embeddings - Lets take our splits and embed them
embedding = OpenAIEmbeddings()
vectordb = Chroma(
  embedding_function=embedding,
  persist_directory=persist_directory
)
print("\n\n\n Vectordb count:")
print(vectordb._collection.count())

# similarity search
question = "What are major topics for this class?"
docs = vectordb.similarity_search(question,k=3)
len(docs)
print("\n\n\n similarity search")
print(docs)

llm = ChatOpenAI(model_name=llm_name, temperature=0)
print("\n\n\n LLM")
llm.predict("Hello world!")

#Build prompt
template = """Use the folllowing pieces of context to answer the question at the end. If you don't know the answer, just say
that you don't know, don't try to make up an answer. Use three sentences maximum. Keep the answer as concise as possible. Always
say "thanks for asking!" at the end of the answer.
{context}
Question: {question}
Helpful Answer:"""

QA_CHAIN_PROMPT = PromptTemplate(intput_variables=["context", "question"],template=template,)

#Run Chain
question = "Is probability a class topic?"
qa_chain = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever(),
  return_source_documents=True,
  chain_type_kwargs={"prompt": QA_CHAIN_PROMPT})

result=qa_chain({"query": question})
print("\n\n\n run chain")
print(result["result"])

# memory
memory = ConversationBufferMemory(
  memory_key="chat_history",
  return_messages=True
)

# ConversationalRetrievalChain
retriever = vectordb.as_retriever()
qa = ConversationalRetrievalChain.from_llm(
  llm,
  retriever=retriever,
  memory=memory
)

question = "Is probability a class topic?"
result = qa({"question": question})

print(result['answer'])




