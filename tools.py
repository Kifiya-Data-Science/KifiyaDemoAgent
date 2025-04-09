# tools.py
from typing import List, Dict, Any

def get_tools() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "add",
                "description": "Add two numbers",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "integer", "description": "First number"},
                        "b": {"type": "integer", "description": "Second number"},
                    },
                    "required": ["a", "b"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "greet",
                "description": "Greet a person by name",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Person's name"},
                    },
                    "required": ["name"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "weather",
                "description": "Get weather information for a city",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "City name"},
                    },
                    "required": ["city"],
                },
            },
        },
        {
    "type": "function",
    "function": {
        "name": "micro",
        "description": "Calculate a micro credit score for an individual or business based on product type and detailed business information. Use this when asked for micro credit scores or financial eligibility.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_type": {"type": "string", "description": "Type of product (e.g., safee_micro)"},
                "business_region": {"type": "string", "description": "Business region (e.g., addis_ababa)"},
                "business_subcity": {"type": "string", "description": "Business subcity (e.g., Bole)"},
                "business_woreda": {"type": "string", "description": "Business woreda (e.g., 07)"},
                "business_level": {"type": "string", "description": "Business level (e.g., startup)"},
                "business_number_of_employees": {"type": "integer", "description": "Number of employees (e.g., 3)"},
                "business_source_of_initial_capital": {"type": "string", "description": "Source of initial capital (e.g., own)"},
                "business_sector": {"type": "string", "description": "Business sector (e.g., building_and_construction)"},
                "business_annual_income": {"type": "number", "description": "Annual income of the business (e.g., 500000)"},
                "business_association_type": {"type": "string", "description": "Association type (e.g., own)"},
                "business_starting_capital": {"type": "number", "description": "Starting capital of the business (e.g., 100000)"},
                "business_current_capital": {"type": "number", "description": "Current capital of the business (e.g., 200000)"},
                "business_annual_profit": {"type": "number", "description": "Annual profit of the business (e.g., 150000)"},
                "business_establishment_year": {"type": "string", "description": "Year of establishment (e.g., 2015)"},
                "business_monthly_income": {"type": "number", "description": "Monthly income of the business (e.g., 4000)"},
                "business_description": {"type": "string", "description": "Description of the business (e.g., small shop)"},
                "customer_age": {"type": "integer", "description": "Age of the customer (e.g., 25)"},
                "customer_level_of_education": {"type": "string", "description": "Level of education (e.g., bachelors)"},
                "customer_gender": {"type": "string", "description": "Gender of the customer (e.g., f)"},
                "customer_marital_status": {"type": "string", "description": "Marital status of the customer (e.g., married)"},
                "customer_document_type": {"type": "string", "description": "Type of customer document (e.g., PASSPORT)"}
            },
            "required": [
                "product_type", "business_region", "business_subcity", "business_woreda", "business_level",
                "business_number_of_employees", "business_source_of_initial_capital", "business_sector",
                "business_annual_income", "business_association_type", "business_starting_capital",
                "business_current_capital", "business_annual_profit", "business_establishment_year",
                "business_monthly_income", "business_description", "customer_age", "customer_level_of_education",
                "customer_gender", "customer_marital_status", "customer_document_type"
            ]
        }
    }
},
        {
            "type": "function",
            "function": {
                "name": "nano",
                "description": "Calculate a nano credit score for an individual based on gender, age, business sector, and region. Use this when asked for credit scores or financial eligibility.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "gender": {"type": "string", "description": "Gender of the individual (e.g., male, female)"},
                        "age": {"type": "integer", "description": "Age of the individual"},
                        "business_sector": {"type": "string", "description": "Business sector (e.g., tech, finance)"},
                        "region": {"type": "string", "description": "Region or state (e.g., California)"},
                    },
                    "required": ["gender", "age", "business_sector", "region"],
                },
            },
        },
        {
    "type": "function",
    "function": {
        "name": "agtech",
        "description": "Calculate an agtech credit score for a farmer or agricultural entity based on region, latitude, longitude, land area, crop type, and yield estimation year. Use this when asked for agtech credit scores or financial eligibility for farmers.",
        "parameters": {
            "type": "object",
            "properties": {
                "region": {"type": "string", "description": "Region or location (e.g., Afar)"},
                "latitude": {"type": "number", "description": "Latitude of the land (e.g., 8.6)"},
                "longitude": {"type": "number", "description": "Longitude of the land (e.g., 36.5)"},
                "land_area": {"type": "integer", "description": "Land area in hectares (e.g., 2)"},
                "crop_type": {"type": "string", "description": "Type of crop (e.g., potato)"},
                "yield_estimation_year": {"type": "integer", "description": "Year for yield estimation (e.g., 2025)"}
            },
            "required": ["region", "latitude", "longitude", "land_area", "crop_type", "yield_estimation_year"]
        }
    }
}


    ]