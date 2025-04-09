# utils.py
import json
from typing import List, Optional, Dict, Any
import asyncio

from openai import AsyncOpenAI
from functions import add, greet, weather, micro, agtech, nano
from tools import get_tools
from config import OPENAI_API_KEY

# OpenAI client setup
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Map tool names to functions
function_map = {
    "add": add,
    "greet": greet,
    "weather": weather,
    "micro": micro,
    "nano": nano,
    "agtech": agtech,
}

async def call_openai_chat(
    messages: List[Dict[str, Any]],
    tools: Optional[List[Dict[str, Any]]] = None
) -> Any:
    """
    Calls OpenAI Chat API with optional tool support.
    """
    request_params = {
        "model": "gpt-4",
        "messages": messages,
    }

    if tools:
        request_params["tools"] = tools
        request_params["tool_choice"] = "auto"

    return await openai_client.chat.completions.create(**request_params)

async def handle_function_call(tool_call: Any) -> Any:
    """
    Handles the tool function call triggered by the LLM.
    """
    name = tool_call.function.name
    try:
        args = json.loads(tool_call.function.arguments)
    except Exception as e:
        return f"Error parsing arguments: {str(e)}"

    func = function_map.get(name)
    if not func:
        return f"Function `{name}` not found."

    try:
        if callable(func):
            # Check if the function is a coroutine (async)
            if asyncio.iscoroutinefunction(func):
                result = await func(**args)  # Await async functions
            else:
                result = func(**args)  # Call sync functions directly
            return result
        else:
            return f"Function `{name}` is not callable."
    except Exception as e:
        return f"Error executing `{name}`: {str(e)}"