# routers/scoring.py
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Define a Pydantic model to match the expected input from the micro function
class ScoreRequest(BaseModel):
    gender: str
    age: int
    business_sector: str
    region: str

@router.post("/example")
async def get_score_data(request: ScoreRequest):
    # Example logic to calculate a score (replace with your actual scoring logic)
    base_score = 300  # Minimum score
    if request.age >= 30:
        base_score += 50  # Add points for age
    if request.business_sector.lower() == "tech":
        base_score += 100  # Add points for tech sector
    if request.region.lower() == "california":
        base_score += 20  # Add points for region
    if request.gender.lower() == "male":
        base_score += 10  # Add points for gender (example adjustment)

    # Cap the score at 850 (common credit score max)
    final_score = min(base_score, 850)

    return {
        "score": final_score,
        "model": "Micro Model",
        "user_id": f"cust_{request.gender}_{request.age}"  # Dynamic user_id based on input
    }