#!/usr/bin/env python

"""
    Demo - My Simple Chatbot UI 
"""
import os
import openai
import sys
sys.path.append('../..')
#import panel as pn  # GUI
#pn.extension()


from dotenv import load_dotenv, find_dotenv
_ = load_dotenv(find_dotenv()) # read local .env file

openai.api_key  = os.environ['OPENAI_API_KEY']
llm_name = "gpt-3.5-turbo"

#from langchain_community.embeddings import OpenAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_community.document_loaders import TextLoader
from langchain.chains import RetrievalQA
from langchain.chains import ConversationalRetrievalChain


from langchain.memory import ConversationBufferMemory
#from langchain_community.chat_models import ChatOpenAI
from langchain_openai import ChatOpenAI
#from langchain.chat_models import ChatOpenAI
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader

import param
import panel as pn

# my simple GUI import
import PySimpleGUI as sg


def load_db(file, chain_type, k):
  #load documents
  loader = PyPDFLoader(file)
  documents = loader.load()

  #split documents
  text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
  docs = text_splitter.split_documents(documents)
  
  #define embedding
  embeddings = OpenAIEmbeddings()

  # create vector database from data
  db = DocArrayInMemorySearch.from_documents(docs, embeddings)
  
  # define retriever
  retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": k})
  
  # create a chatbot chain. Memory is managed externally
  qa = ConversationalRetrievalChain.from_llm(
    llm=ChatOpenAI(model_name=llm_name, temperature=0),
    chain_type=chain_type,
    retriever=retriever,
    return_source_documents=True,
    return_generated_question=True,
  )
  return qa




class cbfs(param.Parameterized):

  chat_history = param.List([])
  answer = param.String("")
  db_query = param.String("")
  db_response = param.List([])

  def __init__(self, **params):
    super(cbfs, self).__init__(**params)

    self.panels = []
    self.loaded_file = "/Users/sandeep/Dropbox/dev/projects/langchain/langchain-js/dllangchain/data/Lecture3.pdf"
    self.qa = load_db(self.loaded_file, "stuff", 4)

"""
  def call_load_db(self, count):
    if count == 0 or file_input.value is None: # init or no file specified :
      #return pn.pane.Markdown(f"Loaded File: {self.loaded_file}") 
      return sg.Pane.Markdown(f"Loaded File: {self.loaded_file}")
    else:
      file_input.save("temp.pdf") # local copy
      self.loaded_file = file_input.filename
      button_load.button_style="outline"
      self.qa = load_db("temp.pdf", "stuff", 4)
      button_load.button_style="solid"
    self.clr_history()
    #return pn.pane.Markdown(f"Loaded File: {self.loaded_file}")
    return sg.Pane.Markdown(f"Loaded File: {self.loaded_file}")

  def convchain(self, query):
    if not query:
    #  return pn.WidgetBox(pn.Row('User:', pn.pane.Markdown("", width=600)), scroll=True)
      return sg.Pane.Markdown(sg.Row('User:', sg.pane.Markdown("", width=600)), scroll=True)
    
    result = self.qa({"question": query, "chat_history": self.chat_history})
    self.chat_history.extend([(query, result["answer"])])
    
    self.db_query = result["generated_question"]
    self.db_response = result["source_documents"]
    self.answer = result['answer']
    
    self.panels.extend([
      pn.Row('User:', pn.pane.Markdown(query, width=600)),
      pn.Rwo('ChatBot:', pn.pane.Markdown(self.answer, width=600, style={'background-color': '#F6F6F6'}))
    ])
    inp.value = '' #clears loading indicator when cleared
    return pn.WidgetBox(*self.pandels,scroll=True)
  
  @param.depends('db_query ',)
  def get_lquest(self):
    if not self.db_query :
      return pn.Column(
        pn.Row(pn.pane.Markdown(f"Last question to DB:", styles={'backfound-color': '#F6F6F6'})),
        pn.Row(pn.pane.Str("no DB acesses so far"))
      )
    return pn.Column(
      pn.Row(pn.pand.Markdown(f"DB query:", styles={'background-color': '#F6F6F6'})),
      pn.pane.Str(self.db_query)
    )
  
  @param.depends('db_response',)
  def get_sources(self):
    if not self.db_response:
     return
    rlist=[pn.Row(pn.pane.Markdown(f"Result of DB lookup:", styles={'background-color': '#F6F6F6'}))]
    for doc in self.db_respnose:
      rlist.append(pn.Row(pn.pane.Str(doc)))
    return pn.WidgetBox(*rlist, width=600, scroll=True)
  
  @param.depends('convchain', 'clr_history')
  def get_chats(self):
    if not self.chat_history:
      return pn.WidgetBox(pn.Row(pn.pane.Str("No History Yet")), width=600, scroll=True)
    rlist=[pn.Row(pn.pane.Markdown(f"Current Chat History variable", styles={'background-color': '#F6F6F6'}))]
    for exchange in self.chat_history:
      rlist.append(pn.Row(pn.pane.Str(exchange)))
    return pn.WidgetBox(*rlist, width=600, scroll=True)
 

  def clr_history(self):
    self.chat_history = []
    return
  
"""
  
cb = cbfs()



"""
file_input = pn.widgets.FileInput(accept=".pdf")
button_load = pn.widgets.Button(name="Load DB", button_type="primary")
button_clearhistory = pn.widgets.Button(name="Clear History", button_type="warning")
button_clearhistory.on_click(cb.clr_history)
inp = pn.widgets.TextInput(placeholder="Enter text here...")

bound_button_load = pn.bind(cb.call_load_db, button_load.param.clicks)
conversation = pn.bind(cb.convchain, inp)

jpg_pane = pn.pane.Image('./img/chain.jpeg')


file_input = sg.FileBrowse(file_types = ".pdf")
button_load = sg.Button(button_text="Load DB", key="load_db")
# button_load.Click(cb.call_load_db())

button_clearhistory = sg.Button(button_text="Clear History", key="clear_history")
# button_clearhistory.Click(cb.clr_history())

inp = sg.Input(default_text="Enter text here...")


conversation = cb.convchain(inp)
jpg_pane = sg.Image('./img/mychain.png')

"""


# Simple example of TabGroup element and the options available to it
sg.theme('Dark Green')     # Please always add color to your window
# The tab 1, 2, 3 layouts - what goes inside the tab
tab1_layout = [
              #[sg.Text('Conversation')],
               #[sg.Text('Put your layout in here')],
                #[sg.Input(default_text='Enter text here ...', key='-IN1-TAB1-'), sg.Button('Send Question')],
                [sg.ML(size=(85, 3), enter_submits=True, key='query', do_not_clear=False),
                 sg.Button('SEND', button_color=(sg.YELLOWS[0], sg.BLUES[0]), bind_return_key=True), sg.Button('EXIT', button_color=(sg.YELLOWS[0], sg.GREENS[0]))],
                [sg.HorizontalSeparator(color='black')],
                [sg.Text('Command History'),
                 sg.Text('', size=(20, 3), key='history')],
                [sg.HorizontalSeparator(color='black')],
                [sg.Output(background_color='white', font=('Helvetica 10'), size=(127, 30))],
               #[sg.Text('Input something'), sg.Input(size=(12,1), key='-IN2-TAB1-')]
                ]

tab2_layout = [[sg.Text('Database')]]
tab3_layout = [[sg.Text('Chat History')]]
tab4_layout = [[sg.Text('Configure')]]

# The TabgGroup layout - it must contain only Tabs
tab_group_layout = [[sg.Tab('Conversation', tab1_layout, key='-TAB1-'),
                     sg.Tab('Database', tab2_layout, visible=True, key='-TAB2-'),
                     sg.Tab('Chat History', tab3_layout, key='-TAB3-'),
                     sg.Tab('Configure', tab4_layout, visible=True, key='-TAB4-')]]

# The window layout - defines the entire window
layout = [[sg.TabGroup(tab_group_layout,
                       enable_events=True,
                       key='-TABGROUP-')]]
         # [sg.Text('Make tab number'), sg.Input(key='-IN-', size=(3,1)), sg.Button('Invisible'), sg.Button('Visible'), sg.Button('Select'), sg.Button('Disable')]]

window = sg.Window('My Simple LLM chat bot', layout, 
                   no_titlebar=False)


tab_keys = ('-TAB1-','-TAB2-','-TAB3-', '-TAB4-')         # map from an input value to a key
command_history = []        # store the history of commands entered
history_offset = 0          # used to navigate command history


while True:
    event, values = window.read()       # type: str, dict
   # print(event, values)

    if event == sg.WIN_CLOSED:
        break
    
    
    # handle button clicks
    if event == 'SEND':
        query = values["query"].rstrip()
        # execute your command here
        
        print(' The command you entered was {}'.format(query))
        command_history.append(query)
        history_offset = len(command_history) - 1
        window['query'].update('')
        window['history'].update('\n'.join(command_history[-3:]))
        #cb.convchain(values["query"])
        #print(f'You entered: {values["-IN1-TAB1-"]}')
        #window['-IN1-TAB1-'].update('')
    elif event in (sg.WIN_CLOSED, 'EXIT'):            # quit if exit event or X
        break
"""
    if event == 'Invisible':
        window[tab_keys[int(values['-IN-'])-1]].update(visible=False)

    if event == 'Visible':
        window[tab_keys[int(values['-IN-'])-1]].update(visible=True)

    if event == 'Select':
        window[tab_keys[int(values['-IN-'])-1]].select()

    if event == 'Disable':
        window[tab_keys[int(values['-IN-']) - 1]].update(disabled=True)

"""

window.close()
