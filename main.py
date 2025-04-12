# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import logging
import os
import json
from tools import get_tools
from utils import call_openai_chat, handle_function_call, text_to_audio, audio_to_text
from routers import scoring, kyc
from fastapi.middleware.cors import CORSMiddleware  # Import CORS middleware
from fastapi.responses import StreamingResponse



from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
from starlette.requests import Request
# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (adjust for production)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

templates = Jinja2Templates(directory=str(Path(__file__).parent / "front_end"))


app.include_router(scoring.router, prefix="/scoring", tags=["Scoring"])
app.include_router(kyc.router, prefix="/kyc", tags=["KYC"])



@app.get("/home", response_class=HTMLResponse)
async def serve_home_page(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

def log_conversation_history(messages: List[Dict[str, Any]], response: str):
    history_path = 'kb/conversation_history.json'
    conversation = {
        "messages": messages,
        "response": response
    }

    # Create file if it doesn't exist
    if not os.path.exists('kb'):
        os.makedirs('kb')

    # Load existing history
    try:
        with open(history_path, 'r', encoding='utf-8') as file:
            history_data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        history_data = []

    # Append current conversation
    history_data.append(conversation)

    # Save back to file
    with open(history_path, 'w', encoding='utf-8') as file:
        json.dump(history_data, file, indent=4, ensure_ascii=False)

def load_context():
    try:
        with open('kb/base_context.txt', 'r', encoding='utf-8') as file:
            context = file.read()
    except FileNotFoundError:
        context = ""
    return context
    

class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]  # [{"role": "user", "content": "..."}]

async def sse_stream(messages: List[Dict[str, Any]], tools: List[Dict[str, Any]]):
    """
    Streams LLM response sentence-by-sentence using SSE, with audio for each sentence.
    """
    initial_response = await call_openai_chat(messages, tools)
    
    if initial_response.choices[0].finish_reason == "tool_calls":
        tool_calls = initial_response.choices[0].message.tool_calls
        for tool_call in tool_calls:
            result = await handle_function_call(tool_call)
            messages.append(initial_response.choices[0].message.model_dump())
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(result),
            })
        stream = await call_openai_chat(messages, stream=True)
    else:
        stream = await call_openai_chat(messages, tools, stream=True)
    
    buffer = ""
    accumulated_text = ""

    async for chunk in stream:
        try:
            data = json.loads(chunk)
            if "error" in data:
                yield f"data: {json.dumps({'error': data['error']})}\n\n"
                return
            text_chunk = data["text"]
            buffer += text_chunk

            # Split buffer on sentence boundaries (., !, ?)
            while "." in buffer or "!" in buffer or "?" in buffer:
                # Find the earliest sentence boundary
                period_idx = buffer.find(".") if "." in buffer else len(buffer)
                excl_idx = buffer.find("!") if "!" in buffer else len(buffer)
                ques_idx = buffer.find("?") if "?" in buffer else len(buffer)
                boundary_idx = min(period_idx, excl_idx, ques_idx)

                if boundary_idx == len(buffer):
                    break  # No complete sentence yet

                # Extract the sentence (including the punctuation)
                sentence = buffer[:boundary_idx + 1].strip()
                if sentence:
                    accumulated_text += sentence
                    audio_base64 = text_to_audio(sentence)
                    yield f"data: {json.dumps({'text': sentence, 'audio': audio_base64})}\n\n"
                
                # Remove the processed sentence from the buffer
                buffer = buffer[boundary_idx + 1:].strip()

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return
    
    # Handle any remaining text in the buffer
    if buffer.strip():
        accumulated_text += buffer
        audio_base64 = text_to_audio(buffer.strip())
        yield f"data: {json.dumps({'text': buffer.strip(), 'audio': audio_base64})}\n\n"

    # Log conversation after streaming completes
    log_conversation_history(messages, accumulated_text)


@app.post("/chat")
async def chat_with_agent(req: ChatRequest):
    messages = req.messages
    # Add a system message to guide the LLM
    messages.insert(0, {"role": "system",
        "content": f"""You are an assistant with access to tools.
        When asked to be scored for micro loan product,
        use the 'micro' tool with the provided product_type, business_region,
        business_subcity, business_woreda, 
        business_level, business_number_of_employees, business_source_of_initial_capital,
        business_sector, business_annual_income, business_association_type, 
        business_starting_capital, business_current_capital, business_annual_profit, 
        business_establishment_year, business_monthly_income, business_description, 
        customer_age, customer_level_of_education, customer_gender, customer_marital_status, 
        customer_document_type. When asked for a credit score of nano product or nano scoring, 
        use the 'nano' tool with the provided gender, age, business sector, and region. 
        When asked for a credit score of agtech product or agtech scoring or if 
        someone expresses itsefl as a farmer and want to be scored, use the 'agtech' 
        tool with the provided gender, age, business sector, and region. 
        Always be mindful of the data provided to tools and  the score returned. When asked to 
        explain credit score, please correlate the data with the score responded and give a valid
        explanation as if you have the scoring. Whenever you get 
        asked about other stuff, answer it if you can relate it to Kifiya Financial 
        Technology.When asked about Inventory finance, invoice finance, device and 
        asset finance, buy now pay later, or similar product, answer it correlating 
        with Kifiya Financial technology saying this is what we are doing. You have to answer a very precise and to the
         point answers. You can not take more than two to three sentences to explain things! 
        This is a general Kifiya level tech Infrastructure and platform knowladge base: {load_context()}"""})
    tools = get_tools()

    return StreamingResponse(sse_stream(messages, tools), media_type="text/event-stream")