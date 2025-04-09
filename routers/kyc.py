from fastapi import APIRouter

router = APIRouter()

@router.get("/example")
async def get_kyc_data():
    return {"name": "John Doe", "dob": "1990-01-01", "verified": True}

