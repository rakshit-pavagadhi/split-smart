import re
import math
from io import BytesIO
from PIL import Image
import numpy as np
import os

# Disable Paddle 3.0+ PIR executor globally before any PaddleOCR/Paddle imports
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_enable_pir_in_executor"] = "0"

# A global instance for the singleton OCR
_ocr_instance = None
_ocr_error = None

def get_ocr_instance():
    global _ocr_instance, _ocr_error
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            # Singleton instance, preload at startup
            _ocr_instance = PaddleOCR(use_angle_cls=False, lang='en', use_mkldnn=False)
            _ocr_error = None
        except Exception as exc:
            _ocr_instance = None
            _ocr_error = str(exc)
            print(f"WARNING: PaddleOCR failed to initialize: {_ocr_error}. Returning mock data.")
    return _ocr_instance

def extract_amount(text_lines):
    amount = 0.0
    text_full = '\n'.join(text_lines)
    
    # 1. Look for totals ignoring line breaks
    patterns = [
        r"(?i)(?:grand total|total amount|net total|amount due|amount paid)\s*[:\$]?\s*\n?\s*(\d+[.,]\d{1,2})",
        r"(?i)\n?total\s*[:\$]?\s*\n?\s*(\d+[.,]\d{1,2})"
    ]
    
    for p in patterns:
        matches = re.finditer(p, text_full)
        for match in matches:
            val_str = match.group(1).replace(',', '.')
            val = float(val_str)
            if val > amount:
                amount = val
                
    # 2. Fallback: find the largest float if still 0
    if amount == 0.0:
        for line in text_lines:
            floats = re.findall(r"\b\d+[.,]\d{2}\b", line)
            for f in floats:
                val_str = f.replace(',', '.')
                val = float(val_str)
                if val > amount:
                    amount = val
    return amount

def extract_description(text_lines):
    if not text_lines:
        return "Unknown Store"
        
    # 1. Try to find website domain
    for line in text_lines:
        match = re.search(r'www\.([a-zA-Z0-9\-]+)\.(?:com|in|org|net|co)', line.lower())
        if match:
            return match.group(1).replace('-', ' ').title()
            
    # 2. Skip garbage lines and take the first valid one
    for line in text_lines[:15]: 
        line = line.strip()
        line_lower = line.lower()
        # Skip lines that look like addresses, taxes, dates, or headers
        if re.search(r'(?i)(tin|gst|st #|tax invoice|ac bill|bill:|date|dt:|time|ti:|no:|road|street|chennai|mumbai|delhi|\d{6})', line_lower):
            continue
        # Skip if purely numeric/symbols
        if len(line) > 3 and not re.match(r'^[\d\W_]+$', line):
            return line
            
    # 3. Fallback to the very first line if all else fails
    for line in text_lines[:3]:
         if len(line) > 3 and not re.match(r'^[\d\W_]+$', line):
             return line
             
    return "Unknown Store"

def classify_category(text):
    categories = {
        'Food': ['pizza', 'burger', 'restaurant', 'cafe', 'starbucks', 'coffee', 'grocery', 'walmart', 'food', 'mart'],
        'Transport': ['uber', 'lyft', 'taxi', 'flight', 'petrol', 'gas', 'shell', 'transit', 'train', 'bus'],
        'Accommodation': ['hotel', 'airbnb', 'oyo', 'motel', 'resort', 'stay'],
        'Entertainment': ['movie', 'cinema', 'netflix', 'spotify', 'concert', 'ticket', 'club'],
        'Utilities': ['electric', 'water', 'bill', 'internet', 'broadband', 'phone'],
        'Shopping': ['amazon', 'apple', 'ikea', 'target', 'clothes', 'shoe', 'mall'],
        'Medical': ['pharmacy', 'hospital', 'clinic', 'health', 'doctor', 'cvs', 'walgreens'],
        'Other': []
    }
    
    text_lower = text.lower()
    best_category = "Other"
    max_score = 0
    
    for category, keywords in categories.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > max_score:
            max_score = score
            best_category = category
            
    return best_category

def process_receipt(image_bytes: bytes):
    ocr = get_ocr_instance()
    
    # Resize image for optimization (max 1000px)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    max_size = 1000
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = (int(image.width * ratio), int(image.height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Convert to cv2 format (numpy array for PaddleOCR)
    img_array = np.array(image)
    # Convert RGB to BGR for paddleocr 
    img_array = img_array[:, :, ::-1].copy()
    
    if not ocr:
        # Fallback if PaddleOCR fails to load (demo mode basically)
        fallback_text = "Mock text because PaddleOCR failed to load"
        if _ocr_error:
            fallback_text = f"{fallback_text}. Error: {_ocr_error}"
        return {
            "description": "Mock Vendor",
            "amount": 42.0,
            "category": "Other",
            "raw_text": fallback_text
        }

    # Run OCR
    result = ocr.ocr(img_array)
    
    text_lines = []
    if result and result[0]:
        for line in result[0]:
            text_lines.append(line[1][0])
            
    raw_text = "\n".join(text_lines)
    
    amount = extract_amount(text_lines)
    description = extract_description(text_lines)
    category = classify_category(raw_text)
    
    return {
        "description": description,
        "amount": amount,
        "category": category,
        "raw_text": raw_text
    }
