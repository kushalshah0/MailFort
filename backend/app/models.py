from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, List


class ModelType(str, Enum):
    BERT = "bert"
    LSTM = "lstm"
    GRU = "gru"


class PredictionResult(str, Enum):
    PHISHING = "phishing"
    LEGITIMATE = "legitimate"


class PredictionRequest(BaseModel):
    text: str = Field(..., description="The email content to analyze", min_length=1)
    model: ModelType = Field(..., description="The model to use for prediction")


class PredictionResponse(BaseModel):
    model: ModelType
    prediction: PredictionResult
    confidence: float = Field(..., ge=0.0, le=1.0)
    top_tokens: Optional[List[dict]] = None


class EmailInput(BaseModel):
    message_id: str
    subject: str
    from_: str
    body: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "message_id": "12345",
                "subject": "Urgent: Verify your account",
                "from_": "noreply@suspicious.com",
                "body": "Click here to verify your account immediately!"
            }
        }


class PredictionOutput(BaseModel):
    label: str
    confidence: float
    severity: str
    phishing_type: Optional[str] = None
