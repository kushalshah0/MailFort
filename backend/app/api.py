from fastapi import APIRouter, HTTPException
from app.models import PredictionRequest, PredictionResponse, ModelType, PredictionResult, EmailInput
from app.services.model_manager import model_manager
import re
from bs4 import BeautifulSoup

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.post("/predict", response_model=PredictionResponse)
async def predict_email(request: PredictionRequest):
    try:
        result = model_manager.predict(request.text, request.model)
        return PredictionResponse(
            model=request.model,
            prediction=result["prediction"],
            confidence=result["confidence"],
            top_tokens=result.get("top_tokens")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def calculate_severity(confidence: float) -> str:
    """Calculate severity based on confidence level."""
    if confidence >= 0.90:
        return "high"
    elif confidence >= 0.70:
        return "medium"
    else:
        return "low"


def preprocess_email(subject: str, body: str) -> str:
    """Preprocess email content for analysis."""
    soup = BeautifulSoup(body, "lxml")
    text = soup.get_text(separator=" ")
    
    signature_markers = [
        r"--\s*\n",
        r"Sent from my",
        r"Best regards",
        r"Kind regards",
        r"Sincerely",
        r"Thanks",
        r"Cheers"
    ]
    
    for marker in signature_markers:
        text = re.split(marker, text, maxsplit=1, flags=re.IGNORECASE)[0]
    
    text = re.sub(r'\s+', ' ', text).strip()
    full_text = f"{subject} {text}".strip()
    
    return full_text


@router.post("/analyze-email")
async def analyze_email(email: EmailInput):
    """Analyze email for phishing detection (BERT-based)."""
    try:
        processed_text = preprocess_email(email.subject, email.body)
        result = model_manager.predict(processed_text, ModelType.BERT)
        
        prediction = result["prediction"]
        confidence = result["confidence"]
        severity = calculate_severity(confidence)
        
        return {
            "label": prediction.value if isinstance(prediction, PredictionResult) else prediction,
            "confidence": round(confidence, 4),
            "severity": severity,
            "phishing_type": None
        }
    except Exception as e:
        print(f"Error analyzing email: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
