# utils.py
import json
from typing import List, Optional, Dict, Any
import asyncio

from pydub import AudioSegment
from io import BytesIO
import speech_recognition as sr
from gtts import gTTS
import base64
import os

from groq import Groq
from dotenv import load_dotenv
from openai import AsyncOpenAI
from functions import add, greet, weather, micro, agtech, nano
from tools import get_tools
from config import OPENAI_API_KEY

load_dotenv()

# OpenAI client setup
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
async def call_groq_chat(
    messages: List[Dict[str, Any]],
    tools: Optional[List[Dict[str, Any]]] = None,
    stream: bool = False
) -> Any:
    """
    Calls Groq Chat API with optional tool support and streaming.
    """
    request_params = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": messages,
    }

    if tools:
        request_params["tools"] = tools
        request_params["tool_choice"] = "auto"

    if stream:
        async def stream_response():
            try:
                # Initialize Groq client
                client = Groq()
                stream = client.chat.completions.create(**request_params, stream=True)
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield json.dumps({"text": chunk.choices[0].delta.content})
            except Exception as e:
                yield json.dumps({"error": str(e)})
        
        return stream_response()
    
    # Non-streaming case
    loop = asyncio.get_event_loop()
    completion = await loop.run_in_executor(
        None,
        lambda: groq_client.chat.completions.create(**request_params)
    )
    return completion

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
    

def text_to_audio(text):
    tts = gTTS(text=text, lang="en", slow=False)
    mp3_buffer = BytesIO()
    tts.write_to_fp(mp3_buffer)
    mp3_buffer.seek(0)
    audio = AudioSegment.from_mp3(mp3_buffer)
    wav_buffer = BytesIO()
    audio.export(wav_buffer, format="wav")
    wav_buffer.seek(0)
    return base64.b64encode(wav_buffer.read()).decode("utf-8")

def audio_to_text(audio_data):
    recognizer = sr.Recognizer()
    print("Received audio length:", len(audio_data))
    if len(audio_data) < 100:
        print("Audio too short to process")
        return "Sorry, audio too short."

    # Save original for debugging
    with open("received_audio.webm", "wb") as f:
        f.write(audio_data)

    try:
        # Convert WebM/Opus to WAV
        audio_segment = AudioSegment.from_file(BytesIO(audio_data), format="webm", codec="opus")
        wav_buffer = BytesIO()
        audio_segment.export(wav_buffer, format="wav", parameters=["-ar", "16000", "-ac", "1", "-sample_fmt", "s16"])
        wav_buffer.seek(0)
        audio_data_converted = wav_buffer.read()

        # Save converted for verification
        with open("converted_audio.wav", "wb") as f:
            f.write(audio_data_converted)

        audio = sr.AudioData(audio_data_converted, sample_rate=16000, sample_width=2)
        text = recognizer.recognize_google(audio)
        print("Transcribed text:", text)
        return text
    except sr.UnknownValueError as e:
        print("Recognition failed:", str(e))
        return "Sorry, I couldn't understand that."
    except sr.RequestError as e:
        print("Request error:", str(e))
        return "Error with speech recognition service."
    except Exception as e:
        print("Decoding error:", str(e))
        return "Sorry, there was an error processing the audio."    