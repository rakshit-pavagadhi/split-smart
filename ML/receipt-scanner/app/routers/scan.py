from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Body
from typing import Optional
from app.schemas.receipt import ReceiptScanRequest, ReceiptScanResponse, ReceiptData
from app.services.downloader import download_image
from app.services.ocr_service import process_receipt

router = APIRouter()

@router.post("/scan-receipt", response_model=ReceiptScanResponse)
async def scan_receipt(
    request: Optional[ReceiptScanRequest] = Body(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        image_bytes = None
        
        # 1. Check if direct file upload is provided (Fallback for local dev)
        if file is not None:
            image_bytes = await file.read()
            
        # 2. Check if image_url is provided
        elif request and request.image_url:
            image_bytes = await download_image(request.image_url)
            
        else:
            return ReceiptScanResponse(
                success=False,
                data=None,
                raw_ocr_text=None,
                error="Either image_url in body or an uploaded file must be provided"
            )
            
        # Process the image bytes through PaddleOCR
        result = process_receipt(image_bytes)
        
        return ReceiptScanResponse(
            success=True,
            data=ReceiptData(
                description=result["description"],
                amount=result["amount"],
                category=result["category"]
            ),
            raw_ocr_text=result["raw_text"],
            error=None
        )
        
    except Exception as e:
        return ReceiptScanResponse(
            success=False,
            data=None,
            raw_ocr_text=None,
            error=f"Processing failed: {str(e)}"
        )
