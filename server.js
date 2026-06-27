import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/payment/check', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        code: 'fail',
        message: 'sessionId là bắt buộc'
      });
    }

    const response = await fetch('https://thanhtoan.ndc.gov.vn/api/payment/payByQRCode', {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Origin': 'https://thanhtoan.ndc.gov.vn',
        'Referer': `https://thanhtoan.ndc.gov.vn/payment?sessionId=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        sessionId,
        MaDichVu: 'PAYMENT_GATEWAY_VIETQR',
        MaDVThanhToan: 'MOMO'
      })
    });

    const data = await response.json();

    if (response.ok && data.success !== false) {
      return res.json({
        code: 'success',
        message: 'thành công',
        data
      });
    }

    return res.json({
      code: 'fail',
      message: 'thất bại',
      data
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      code: 'fail',
      message: 'thất bại',
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
