import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

async function generateReceipt() {
  // ✅ Example Data — replace with your real data or params
  const data = {
    currency: "₦",
    amount: "12,500",
    dateOnly: "2025-07-16",
    timeOnly: "15:23",
    paymentMethod: "Card",
    transactionId: "TXN123456789",
    // Make sure this URL points to your actual logo
    // logoUrl: "https://res.cloudinary.com/dxypfbvwt/image/upload/v1752671926/dark_a1by8v.png",
    items: [
      { name: "Mango", quantity: 2, details: "Fresh", price: "₦2,500" },
      { name: "Orange", quantity: 1, details: "Juicy", price: "₦1,500" },
      { name: "Banana", quantity: 5, details: "Ripe", price: "₦8,500" },
    ],
  };

  // ✅ Generate real QR Code
  const qrDataUrl = await QRCode.toDataURL(data.transactionId);

  // ✅ Your **NEW & IMPROVED** HTML Template
  const template = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Checkout Receipt</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      body {
        margin: 0;
        padding: 2rem;
        font-family: 'Inter', sans-serif;
        background-color: #f0f2f5;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .receipt-container {
        width: 100%;
        max-width: 380px;
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
        padding: 2rem;
        box-sizing: border-box;
      }
      
      /* Animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .receipt-animation {
          animation: fadeIn 0.5s ease-in-out;
      }

      .header {
        text-align: center;
        margin-bottom: 1.5rem;
        border-bottom: 1px dashed #d1d5db;
        padding-bottom: 1.5rem;
      }

      .header img {
        height: 48px;
        margin-bottom: 0.5rem;
      }
      
      .receipt-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }

      .receipt-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .amount-section {
        text-align: center;
        margin-bottom: 2rem;
      }

      .amount {
          font-size: 2.75rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
      }

      .transaction-info {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        margin-bottom: 2rem;
        font-size: 0.875rem;
      }
      
      .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
      }

      .info-label {
        color: #6b7280;
      }

      .info-value {
        color: #1f2937;
        font-weight: 500;
      }
      
      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1rem;
        padding-top: 1.5rem;
        border-top: 1px dashed #d1d5db;
      }

      .items-section .item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0.75rem 0;
      }
      
      .items-section .item:not(:last-child) {
        border-bottom: 1px solid #f3f4f6;
      }
      
      .item-info {
        display: flex;
        flex-direction: column;
      }
      
      .item-name {
        font-weight: 500;
        color: #1f2937;
      }
      
      .item-details {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
      }
      
      .item-price {
        font-weight: 600;
        color: #1f2937;
      }
      
      .total-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px dashed #d1d5db;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
      }
      
      .qr-section {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px dashed #d1d5db;
      }
      
      .transaction-id {
        font-size: 0.8rem;
        color: #6b7280;
        margin-bottom: 0.75rem;
      }

      .logo {
          width: 60px;  /* Reduced from 100px */
          height: auto;
          max-height: 25px;  /* Reduced from 35px */
          object-fit: contain;
      }
      
      .logo-fallback {
          font-size: 20px;  /* Reduced from 28px */
          font-weight: 700;  /* Reduced from 800 */
          color: #1a1a1a;
          display: none;
      }       
      
      .qr-code img {
        width: 140px;
        height: 140px;
        border-radius: 8px;
      }

      .footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px dashed #d1d5db;
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .footer-highlight {
        color: #3b82f6;
        font-weight: 500;
      }

    </style>
  </head>
  <body>
    <div class="receipt-container receipt-animation">
      <div class="header">
        <img src="https://res.cloudinary.com/dxypfbvwt/image/upload/v1752671926/dark_a1by8v.png" alt="Checkout Logo" />
        <div class="receipt-title">Purchase Receipt</div>
        <div class="receipt-subtitle">Thank you for choosing Checkout!</div>
      </div>
      
      <div class="amount-section">
        <div class="amount">{{currency}}{{amount}}</div>
      </div>
      
      <div class="transaction-info">
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">{{dateOnly}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">{{timeOnly}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cashier</span>
          <span class="info-value">Checkout</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">{{paymentMethod}}</span>
        </div>
      </div>
      
      <div class="items-section">
        <div class="section-title">Items Purchased</div>
        {{#each items}}
          <div class="item">
            <div class="item-info">
              <div class="item-name">{{this.name}}</div>
              <div class="item-details">Qty: {{this.quantity}} • {{this.details}}</div>
            </div>
            <div class="item-price">{{this.price}}</div>
          </div>
        {{/each}}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Total</span>
          <span>{{currency}}{{amount}}</span>
        </div>
      </div>
      
      <div class="qr-section">
        <div class="transaction-id">TXN: {{transactionId}}</div>
        <div class="qr-code">
          <img src="{{qrDataUrl}}" alt="Transaction QR Code" />
        </div>
      </div>
      
      <div class="footer">
        Need help? Visit us at <span class="footer-highlight">checkout.com/support</span><br>
        or call <span class="footer-highlight">(555) 123-4567</span>
      </div>
    </div>
  </body>
  </html>
  `;

  // ✅ Compile with Handlebars
  const compiledTemplate = Handlebars.compile(template);
  const html = compiledTemplate({ ...data, qrDataUrl });

  // ✅ Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  
  // Set a viewport that's appropriate for the receipt size to ensure correct rendering
  await page.setViewport({ width: 550, height: 1100, deviceScaleFactor: 2 });
  
  await page.setContent(html, { waitUntil: "networkidle0" });

  // ✅ Wait for Google Fonts to be fully loaded
  await page.evaluateHandle('document.fonts.ready');

  // Find the receipt container to screenshot only that element
  const receiptElement = await page.$('.receipt-container');
  
  // ✅ Screenshot or PDF
  if (receiptElement) {
    await receiptElement.screenshot({ path: "receipt.png" });
  } else {
    // Fallback to full page if element not found
    await page.screenshot({ path: "receipt.png", fullPage: true });
  }
  
  await page.pdf({
    path: "receipt.pdf",
    width: "550px",
    height: "1150px", // Adjust height as needed
    printBackground: true,
  });

  await browser.close();
  console.log("✅ New receipt generated: receipt.png + receipt.pdf");
}

generateReceipt().catch(console.error);