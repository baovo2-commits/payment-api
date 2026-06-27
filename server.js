import express from 'express';
import puppeteer from 'puppeteer-core';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/payment/check', async (req, res) => {
  let browser;
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        code: 'fail',
        message: 'sessionId là bắt buộc'
      });
    }

    const paymentUrl = `https://thanhtoan.ndc.gov.vn/payment?sessionId=${encodeURIComponent(sessionId)}`;

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
      || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
    );

    await page.goto(paymentUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const cookies = await page.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const paymentData = {
      sessionId: sessionId,
      MaDichVu: 'PAYMENT_GATEWAY_VIETQR',
      MaDVThanhToan: 'MOMO'
    };

    const apiResponse = await page.evaluate(async (data) => {
      const resp = await fetch('https://thanhtoan.ndc.gov.vn/api/payment/payByQRCode', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const status = resp.status;
      const body = await resp.json().catch(() => null);
      return { status, body };
    }, paymentData);

    await browser.close();
    browser = null;

    if (apiResponse.status === 200 && apiResponse.body) {
      return res.json({
        code: 'success',
        message: 'thành công',
        data: apiResponse.body
      });
    }

    return res.json({
      code: 'fail',
      message: 'thất bại',
      data: apiResponse.body
    });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      code: 'fail',
      message: 'thất bại',
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Sử dụng: http://localhost:${PORT}/api/payment/check?sessionId=YOUR_SESSION_ID`);
});
