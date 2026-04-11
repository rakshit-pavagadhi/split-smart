from pydantic import BaseModel
from typing import Optional, Any

class ReceiptScanRequest(BaseModel):
    image_url: Optional[str] = None

class ReceiptData(BaseModel):
    description: Optional[str]
    amount: float
    category: str

class ReceiptScanResponse(BaseModel):
    success: bool
    data: Optional[ReceiptData]
    raw_ocr_text: Optional[str]
    error: Optional[str]
