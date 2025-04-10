# functions.py
import httpx
import logging
import webbrowser

logger = logging.getLogger(__name__)

def add(a: int, b: int) -> int:
    print("function called")
    return a + b

def greet(name: str) -> str:
    print("function called")
    return f"Hello mate, {name}! How can I assist you today?"

def weather(city: str) -> str:
    print("function called")
    return f"The weather in {city} is sunny with a high of 25°C."

async def micro(
    product_type: str,
    business_region: str,
    business_subcity: str,
    business_woreda: str,
    business_level: str,
    business_number_of_employees: int,
    business_source_of_initial_capital: str,
    business_sector: str,
    business_annual_income: float,
    business_association_type: str,
    business_starting_capital: float,
    business_current_capital: float,
    business_annual_profit: float,
    business_establishment_year: str,
    business_monthly_income: float,
    business_description: str,
    customer_age: int,
    customer_level_of_education: str,
    customer_gender: str,
    customer_marital_status: str,
    customer_document_type: str
) -> dict:
    payload = {
        "product_type": product_type,
        "business_info": {
            "business_region": business_region,
            "business_subcity": business_subcity,
            "business_woreda": business_woreda,
            "business_level": business_level,
            "business_number_of_employees": business_number_of_employees,
            "business_source_of_initial_capital": business_source_of_initial_capital,
            "business_sector": business_sector,
            "business_annual_income": business_annual_income,
            "business_association_type": business_association_type,
            "business_starting_capital": business_starting_capital,
            "business_current_capital": business_current_capital,
            "business_annual_profit": business_annual_profit,
            "business_establishment_year": business_establishment_year,
            "business_monthly_income": business_monthly_income,
            "business_description": business_description,
            "customer_age": customer_age,
            "customer_level_of_education": customer_level_of_education,
            "customer_gender": customer_gender,
            "customer_marital_status": customer_marital_status,
            "customer_document_type": customer_document_type
        }
    }

    print("function called")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://xsyg6m7fcgbe6vkvjmgy5ibk540besqo.lambda-url.us-east-1.on.aws/",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Scoring API error: {e.response.status_code} - {e.response.text}")
            raise  # Re-raise to let handle_function_call catch it

    return {
        "message": "Here is the credit score data for micro",
        "data": data
    }

async def nano(gender: str, age: int, business_sector: str, region: str) -> dict:
    payload = {
        "gender": gender,
        "age": age,
        "business_sector": business_sector,
        "region": region,
    }

    print("function called")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://3.93.68.14:8000/scoring/example", json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Scoring API error: {e.response.status_code} - {e.response.text}")
            raise  # Re-raise to let handle_function_call catch it

    return {
        "message": "Here is the credit score data for nano product",
        "data": data
    }

async def agtech(
    region: str,
    latitude: float,
    longitude: float,
    land_area: int,
    crop_type: str,
    yield_estimation_year: int
) -> dict:
    payload = {
        "agriFinance": {
            "region": region,
            "latitude": latitude,
            "longitude": longitude,
            "land_area": land_area,
            "crop_type": crop_type,
            "yield_estimation_year": yield_estimation_year
        }
    }

    print("function called")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://h3un7vgepphw3mosuok4h4jnv40nzdya.lambda-url.us-east-1.on.aws/",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Scoring API error: {e.response.status_code} - {e.response.text}")
            raise  # Re-raise to let handle_function_call catch it

    return {
        "message": "Here is the credit score data for AgTech product",
        "data": data
    }


def open_APLIQ(url: str):
    # Attempt to open in the same browser window if possible
    webbrowser.open(url, new=0)  # new=0 → same window if possible
