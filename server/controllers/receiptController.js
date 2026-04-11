// External call to PaddleOCR microservice

// @desc   Scan receipt via ML microservice
// @route  POST /api/receipts/scan
exports.scanReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a receipt image' });
    }

    try {
      // Create FormData to send to the Python microservice
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('file', blob, req.file.originalname);

      // Call the local FastAPI ML Service
      const mlResponse = await fetch('http://127.0.0.1:8000/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!mlResponse.ok) {
        throw new Error(`ML Service responded with status: ${mlResponse.status}`);
      }

      const mlResult = await mlResponse.json();

      if (!mlResult.success) {
        throw new Error(mlResult.error || 'Failed to parse receipt');
      }

      res.json({
        success: true,
        data: {
          description: mlResult.data.description,
          amount: mlResult.data.amount,
          category: mlResult.data.category,
          confidence: 0.95,
          rawText: mlResult.raw_ocr_text,
        },
        message: 'Receipt scanned successfully'
      });
    } catch (mlError) {
      console.error('ML Service Error:', mlError);
      return res.status(500).json({ message: mlError.message || 'Receipt extraction failed. Is the ML service running on port 8000?' });
    }
  } catch (error) {
    next(error);
  }
};
