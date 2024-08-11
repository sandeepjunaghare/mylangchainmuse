import os
import openai

from dotenv import load_dotenv, find_dotenv

_ = load_dotenv(find_dotenv()) # read local .env file


from pydantic import BaseModel, ValidationError
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.openai import OpenAIEmbeddings


class Model(BaseModel):
  x: str

try:
  Model(x="1")
except ValidationError as exc:
  print(repr(exc.errors()[0]['type']))


openai.api_key  = os.environ['OPENAI_API_KEY']
print(os.environ['OPENAI_API_KEY'])

embedding = OpenAIEmbeddings()
vectordb = Chroma("langchain_store", embedding)
