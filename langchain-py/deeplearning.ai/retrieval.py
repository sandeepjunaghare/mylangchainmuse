import os
import openai
import sys

sys.path.append('../..')

#print(sys.path);

from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv()) # read local .env file

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.llms import OpenAI
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

from langchain_community.retrievers.svm import SVMRetriever
from langchain_community.retrievers.tfidf import TFIDFRetriever
from langchain.text_splitter import RecursiveCharacterTextSplitter


print ('start')
openai.api_key  = os.environ['OPENAI_API_KEY']
print(os.environ['OPENAI_API_KEY'])


# Similarity Search
# vectorstores
persist_directory = '/Users/sandeep/Dropbox/dev/projects/langchain/langchain-py/deeplearning.ai/docs/chroma'

#Embeddings - Lets take our splits and embed them
embedding = OpenAIEmbeddings()
vectordb = Chroma(
  embedding_function=embedding,
  persist_directory=persist_directory
)
print(vectordb._collection.count())

texts = [
    """The Amanita phalloides has a large and imposing epigeous (aboveground) fruiting body (basidiocarp).""",
    """A mushroom with a large fruiting body is the Amanita phalloides. Some varieties are all-white.""",
    """A. phalloides, a.k.a Death Cap, is one of the most poisonous of all known mushrooms.""",
]

smalldb = vectordb.from_texts(texts, embedding=embedding)

question = "Tell me about all-white mushrooms with large fruiting bodies"

print("\n\n SIMILARITY SEARCH")
print(smalldb.similarity_search(question, k=2))

print("\n\n MAX MARGINAL RELEVANCY SEARCH")
print(smalldb.max_marginal_relevance_search(question, k=2, fetch_k=3))


#similarity search
question = "what did they say about matlab?"
docs_ss = vectordb.similarity_search(question, k=3)
print(docs_ss)
docs_ss[0].page_content[:100]
docs_ss[1].page_content[:100]

#max marginal relevancy
# note difference in results with MMR
docs_mmr = vectordb.max_marginal_relevance_search(question, k=3)

print("\n\nMMR:")
print (docs_mmr[0].page_content[:100])
print (docs_mmr[1].page_content[:100])

#Addressing specificity: working with metadata
question = "what did they say about regression in the third lecture?"

docs_m = vectordb.similarity_search(
  question,
  k=3,
  filter= {"source":"/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture3.pdf"}
)

print("\n\n META DATA")
for d in docs_m:
  print(d.metadata)

# addressing Specificity: working with metadata using self-query retreiver

metadata_field_info= [
  AttributeInfo(
    name="source",
    description="The lecture the chunk is from, should be one of `/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture1.pdf` or `/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture2.pdf` or `/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture3.pdf`",
    type="string",
  ),
  AttributeInfo(
    name="page",
    description="The page from the lecture",
    type="integer",
  ),
]
#self-query retreiver
document_content_description = "Lecture notes"
llm = OpenAI(model='gpt-3.5-turbo-instruct', temperature=0)
retriever = SelfQueryRetriever.from_llm(
  llm,
  vectordb,
  document_content_description,
  metadata_field_info,
  verbose=True
)

question= "what did they say about regression in the third lecture?"
print("\n\n\n\n SELF QUERY RETRIEVER META DATA META DATA")
docs_r = retriever.get_relevant_documents(question)
for d in docs_r:
  print(d.metadata)


# comppression
def pretty_print_docs(docs):
  print(f"\n{'-' * 100}\n".join([f"Document {i+1}:\\n" + d.page_content for i, d in enumerate(docs)]))

llm = OpenAI(temperature=0, model="gpt-3.5-turbo-instruct")
compressor = LLMChainExtractor.from_llm(llm)

compression_retriever = ContextualCompressionRetriever(
  base_compressor = compressor,
  base_retriever=vectordb.as_retriever()
)

question = "what did they say about matlab?"
compressed_docs = compression_retriever.get_relevant_documents(question)
print("\n\n\n COMPRESSION RETRIEVERS")
print(pretty_print_docs(compressed_docs))


#combining various techniques
compression_retriever = ContextualCompressionRetriever(
  base_compressor = compressor,
  base_retriever = vectordb.as_retriever(search_type = "mmr")
)

question = "what did they say about MATLAB?"
compressed_docs = compression_retriever.get_relevant_documents(question)
print("\n\n\n COMBINING VARIOUS TECHNIQUES")
print(pretty_print_docs(compressed_docs))

# other types of retreivers
# load pdf
loader1 = PyPDFLoader("/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture1.pdf")
pages = loader1.load()
all_page_text=[p.page_content for p in pages]
joined_page_text=" ".join(all_page_text)

# split
text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1500, chunk_overlap = 150)
splits = text_splitter.split_text(joined_page_text)


print("\n\n OTHER RETRIEVERS")
# retrieve


svm_retriever = SVMRetriever.from_texts(splits, embedding)
tfidf_retriever = TFIDFRetriever.from_texts(splits)
print("\n SVM RETRIEVERS")
question1 = "What are major topics for this class?"
docs_svm = svm_retriever.get_relevant_documents(question1)
print(docs_svm[0])
print("\n TFIDF RETRIEVERS")
question2 = "what did they say about matlab?"
docs_tfidf=tfidf_retriever.get_relevant_documents(question2)
print(docs_tfidf[0])



