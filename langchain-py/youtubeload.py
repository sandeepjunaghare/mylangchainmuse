from langchain_community.document_loaders.blob_loaders.youtube_audio import (
    YoutubeAudioLoader,
)
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import (
    OpenAIWhisperParser,
    OpenAIWhisperParserLocal,
)



from langchain_openai import ChatOpenAI

llm = ChatOpenAI()
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(api_key="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")
llm.invoke("how can langsmith help with testing?")
from langchain_core.prompts import ChatPromptTemplate
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are world class technical documentation writer."),
    ("user", "{input}")
])

chain = prompt | llm 
chain.invoke({"input": "how can langsmith help with testing?"})

