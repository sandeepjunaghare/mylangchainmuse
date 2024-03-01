import getpass
import os


def _set_if_undefined(var: str) -> None:
    if os.environ.get(var):
        return
    os.environ[var] = getpass.getpass(var)

_set_if_undefined("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "Reflection"

_set_if_undefined("FIREWORKS_API_KEY")

from langchain_community.chat_models.fireworks import ChatFireworks
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder


# generate

prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an esay assistant tasked with writing excellent 5-paragraph essays."
                " Generate the best essay possible for the users's request."
                " If the user provides critique, respond with a revised version of your pervious attempts.",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
)
llm = ChatFireworks(
    model="accounts/fireworks/models/mixtral-8x7b-instruct",
    model_lwargs={"max_tokens": 32768},
)
generate = prompt | llm

essay = ""
request = HumanMessage(
    content="Write an essay on why the little price is relevant in modern childhood"
)
"""
for chunk in generate.stream({"messages": [request]}):
    print(chunk.content, end="")
    essay += chunk.content
"""

for chunk in generate.stream({"messages": [request]}):
    print(chunk.content, end="")
    essay += chunk.content

#reflect
reflection_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a aateacher grading an essay submission. Generate critique and recomendations for the user's"
            "Provide detailed recomendations, including requests for length, depth, style, etc.",
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)
reflect = reflection_prompt | llm

reflection = ""
for chunk in reflect.stream({"messages": [request, HumanMessage(content=essay)]}):
    print(chunk.content, end="")
    reflection += chunk.content


# repeat
for chunk in generate.stream(
    {"messages": [request, AIMessage(content=essay), HumanMessage(content=reflection)]}
):
    print(chunk.content, end="")


from typing import List, Sequence
from langgraph.graph import END, MessageGraph

async def generation_node(state: Sequence[BaseMessage]):
    return await generate.ainvoke({"message": state})

async def reflection_node(messages: Sequence[BaseMessage]) -> List[BaseMessage]:
    # Other messages we need to adjust
    cls_map = {"ai": HumanMessage, "human": AIMessage}
    # First message is the original user request. We hold it the same for all nodes
    translated = [messages[0]] + [
        cls_map[msg.type](content=msg.content) for msg in messages[1:] 
    ]
    res = await reflect.ainvoke({"messages": translated})
    # We treat the output of this as human feedback for the generator
    return HumanMessasge(content=res.content)


builder = MessageGraph()
builder.add_node("generate", generation_node)
builder.add_node("reflect", reflection_node)
builder.set_entry_point("generate")

def should_continue(state: List[BaseMessage]):
    if len(state) > 6:
        # End after 3 iterations
        return END
    return "reflect"

builder.add_conditional_edges("generate", should_continue)
builder.add_edge("reflect", "generate")
graph = builder.compile()


for event in graph.astream(
    [
        HumanMessage(
            content="Generate an essay on the topicality of The Little Prince and its message in modern life"
        )
    ],
):
    print(event)
    print("---")

"""
async for event in graph.astream(
    [
        HumanMessage(
            content="Generate an essay on the topicality of The Little Prince and its message in modern life"
        )
    ],
):
    print(event)
    print("---")
"""