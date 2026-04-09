// Simple receipt scanner - extracts data using pattern matching
// In production, replace with PaddleOCR or Tesseract.js

// @desc   Scan receipt (mock OCR)
// @route  POST /api/receipts/scan
exports.scanReceipt = async (req, res, next) => {
  try {
    // In a real implementation, we'd process the uploaded image with OCR
    // For demo, we return a simulated extraction

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a receipt image' });
    }

    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock extracted data
    const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Medical'];
    const stores = ['SuperMart', 'CafeZone', 'QuickBite', 'TravelExpress', 'ShopMore'];

    const mockResult = {
      description: stores[Math.floor(Math.random() * stores.length)],
      amount: Math.round((Math.random() * 1000 + 50) * 100) / 100,
      category: categories[Math.floor(Math.random() * categories.length)],
      confidence: 0.85 + Math.random() * 0.15,
      rawText: 'Mock OCR text extraction - In production, PaddleOCR would extract actual text',
      processingTimeMs: 1500
    };

    res.json({
      success: true,
      data: mockResult,
      message: 'Receipt scanned successfully (demo mode)'
    });
  } catch (error) {
    next(error);
  }
};
