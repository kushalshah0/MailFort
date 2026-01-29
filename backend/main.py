from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import re
from bs4 import BeautifulSoup
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MailFort BERT API", version="1.0.0")

# CORS configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and tokenizer
model = None
tokenizer = None
device = None


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


def preprocess_email(subject: str, body: str) -> str:
    """
    Preprocess email content for BERT analysis.
    - Strip HTML
    - Remove signatures
    - Normalize whitespace
    - Concatenate subject and body
    """
    # Strip HTML tags
    soup = BeautifulSoup(body, "lxml")
    text = soup.get_text(separator=" ")
    
    # Remove common email signatures (simple heuristic)
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
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Concatenate subject and body
    full_text = f"{subject} {text}".strip()
    
    return full_text


def calculate_severity(confidence: float) -> str:
    """Calculate severity based on confidence level."""
    if confidence >= 0.90:
        return "high"
    elif confidence >= 0.70:
        return "medium"
    else:
        return "low"


@app.on_event("startup")
async def load_model():
    """Load BERT model at startup."""
    global model, tokenizer, device
    
    try:
        logger.info("Loading BERT model...")
        
        # Determine device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {device}")
        
        # For this demo, we'll use a pre-trained BERT model
        # In production, you would load your fine-tuned model here
        model_name = "bert-base-uncased"
        tokenizer = BertTokenizer.from_pretrained(model_name)
        model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=2  # phishing or legitimate
        )
        
        model.to(device)
        model.eval()
        
        logger.info("BERT model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise


@app.post("/analyze-email", response_model=PredictionOutput)
async def analyze_email(email: EmailInput):
    """
    Analyze email for phishing detection using BERT.
    """
    try:
        if model is None or tokenizer is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Preprocess email
        processed_text = preprocess_email(email.subject, email.body)
        
        # Tokenize with truncation
        inputs = tokenizer(
            processed_text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding="max_length"
        )
        
        # Move to device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Get prediction
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)
        
        # Extract results
        # Assuming label 0 = legitimate, label 1 = phishing
        phishing_prob = probabilities[0][1].item()
        legitimate_prob = probabilities[0][0].item()
        
        # Determine label and confidence
        if phishing_prob > legitimate_prob:
            label = "phishing"
            confidence = phishing_prob
        else:
            label = "legitimate"
            confidence = legitimate_prob
        
        # Calculate severity
        severity = calculate_severity(confidence)
        
        logger.info(f"Email {email.message_id}: {label} (confidence: {confidence:.2f})")
        
        return PredictionOutput(
            label=label,
            confidence=round(confidence, 4),
            severity=severity,
            phishing_type=None
        )
        
    except Exception as e:
        logger.error(f"Error analyzing email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device) if device else "unknown"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "MailFort BERT API",
        "version": "1.0.0",
        "status": "running"
    }
