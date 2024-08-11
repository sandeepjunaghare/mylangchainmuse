import os
import openai
import sys
sys.path.append('../..')

from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv())


#from langchain.vectorstores import Chroma
from langchain_community.vectorstores import Chroma
#from langchain.embeddings.openai import OpenAIEmbeddings
from langchain_community.embeddings import OpenAIEmbeddings
#from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate


print ('start')


openai.api_key  = os.environ['OPENAI_API_KEY']
print(os.environ['OPENAI_API_KEY'])


os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.langchain.plus"
os.environ["LANGCHAIN_API_KEY"] = "ls__1c0262a6cf3b46e49865a872af651de2" # replace dots with your api key

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

#similarity search
question = "what are major topics for this class?"
docs = vectordb.similarity_search(question, k=3)
print("\n\n\n document length and similarity search ")
print(len(docs))
print("\n")
print(docs)
print ("\n\n")

llm = ChatOpenAI(model_name=llm_name, temperature=0)

# RetrievalQA chain
qa_chain = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever()
)

print("\n\n\n after qa chain")
result = qa_chain({"query": question})
("\n\n\n QA chain OUTPUT result::")
print(result["result"])

#prompt templates

#build prompt
template = """ Use the following pieces of context to answer the question at the end. If you don't know the answer just say you don't know, don't try
to make up the answer. Use three sentences maximum. keep the answer as concise as possible. Always say "thanks for answering!" at the 
end of the answer.
{context}
Question: {question} 
Helpful answer:"""
QA_CHAIN_PROMPT = PromptTemplate.from_template(template)

# run chain
qa_chain = RetrievalQA.from_chain_type(
  llm, 
  retriever=vectordb.as_retriever(),
  return_source_documents=True,
  chain_type_kwargs={"prompt": QA_CHAIN_PROMPT}
)

question = "Is probability a class topic?"
result = qa_chain({"query": question})
("\n\n\n print result for probability question")
print (result["result"])
print ("\n\n")
print(result["source_documents"][0])

#retrieval qa chain map reduce type

qa_chain_mr = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever(),
  chain_type="map_reduce"
)

result = qa_chain_mr({"query": question})
print("\n\n\nIs probability a class topic? - asked for map reduce")
print(result["result"])

#using langsmith how??
qa_chain_mr1 = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever(),
  chain_type="map_reduce"
)

result1 = qa_chain_mr1({"query": question})
print("\n\n\n LANGSMITH Is probability a class topic? - asked for map reduce")
print(result1["result"])


qa_chain_mr2 = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever(),
  chain_type="refine"
)

result2 = qa_chain_mr2({"query": question})
print("\n\n\n LANGSMITH - refine Is probability a class topic? - asked for map reduce")
print(result2["result"])

# qa fails to preserve conversational history
qa_chain = RetrievalQA.from_chain_type(
  llm,
  retriever=vectordb.as_retriever()
)

question3 = "Is probability a class topic?"
result3 = qa_chain({"query": question3})
print("\n\n\n QA limitations -  Is probability a class topic? ")
print(result3["result"])

question4 = "why are those prerequisites needed?"
result4 = qa_chain({"query": question4})
print("\n\n\n QA Lmitations ")
print(result4["result"])




