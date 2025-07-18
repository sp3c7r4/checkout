import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// ===============================================
// 1. TEMPLATE GENERATOR
// ===============================================

/**
 * Generate the HTML template for receipt
 * @param {Object} data - Receipt data
 * @returns {Promise<string>} - Compiled HTML string
 */
async function generateReceiptTemplate(data) {
  // Generate QR code for transaction
  const qrDataUrl = await QRCode.toDataURL(data.transaction_id);
  
  // Format amount with commas
  const formattedAmount = parseInt(data.amount).toLocaleString();
  
  // Calculate total from items
  const itemsTotal = data.items.reduce((sum, item) => sum + (parseInt(item.price) * item.quantity), 0);
  
  // Status color mapping
  const statusColors = {
    success: '#10b981',
    pending: '#f59e0b',
    declined: '#ef4444'
  };

  const template = `
<html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Receipt</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      body {
        margin: 0;
        padding: 2rem;
        font-family: 'Inter', sans-serif;
        background: linear-gradient(135deg, #f0ae00 0%, #e27400 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .receipt-container {
        width: 100%;
        max-width: 420px;
        background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 24px;
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.05);
        padding: 2.5rem;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      }

      #logo2 {
        border-radius: 10px;
      }

      .receipt-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #f0ae00, #e27400);
      }
      
      .header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px dashed #e5e7eb;
      }

      .logo-section {
        display: flex;
        justify-content: space-between; /* Justify space between logos */
        align-items: center;
        margin-bottom: 2rem;
        padding: 0 0.5rem;
      }

      .left-logo-wrapper, .right-logo-wrapper { /* Specific wrappers for left and right */
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px; /* Border radius for both */
        /* background: #f8fafc; */
        /* padding: 10px; */
        transition: transform 0.2s ease;
      }

      .left-logo-wrapper {
        /* border: 1px solid #e5e7eb; Optional border for left logo */
        min-width: 80px;
        max-width: 150px;
      }

      .right-logo-wrapper {
        min-width: 80px; /* Keep min-width for right logo as well */
        max-width: 120px; /* Keep max-width for right logo as well */
      }

      .left-logo-wrapper img {
        width: auto;
        height: 40px;
        max-width: 100%;
        max-height: 80px; /* Normal height for left logo */
        object-fit: contain;
      }

      .right-logo-wrapper img {
        width: auto;
        height: 50px;
        max-width: 100%;
        max-height: 160px; /* 2x height for right logo (80px * 2) */
        object-fit: contain;
      }

      .left-logo-wrapper:hover, .right-logo-wrapper:hover {
        transform: translateY(-2px);
      }

      /* Removed partnership-indicator styles as it's no longer present in HTML */

      .center-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 1rem;
      }

      .business-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        /* margin-bottom: 0.25rem; */
      }

      .receipt-subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        margin-top: 0.25rem;
      }
      
      .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 1rem 0;
        color: white;
      }
      
      .amount-section {
        text-align: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: linear-gradient(145deg, #f8fafc, #e2e8f0);
        border-radius: 16px;
        border: 1px solid #e5e7eb;
      }

      .amount {
        font-size: 3rem;
        font-weight: 800;
        color: #111827;
        line-height: 1.2;
        margin-bottom: 0.5rem;
      }

      .amount-label {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .transaction-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 2rem;
        font-size: 0.875rem;
      }
      
      .info-item {
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }

      .info-label {
        color: #6b7280;
        font-weight: 500;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.5px;
      }

      .info-value {
        color: #1f2937;
        font-weight: 600;
        font-size: 0.875rem;
      }
      
      .section-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
        padding-top: 1.5rem;
        border-top: 2px dashed #e5e7eb;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .section-title::before {
        content: '🛒';
        font-size: 1.25rem;
      }

      .items-section .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        background: #f8fafc;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
      }
      
      .items-section .item:hover {
        background: #f1f5f9;
        transform: translateY(-1px);
      }
      
      .item-info {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      
      .item-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
        text-transform: capitalize;
      }
      
      .item-details {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
      }
      
      .item-price {
        font-weight: 700;
        color: #1f2937;
        font-size: 1rem;
      }
      
      .total-section {
        margin-top: 2rem;
        padding: 1.5rem;
        background: linear-gradient(145deg, #1f2937, #374151);
        border-radius: 16px;
        color: white;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 1.25rem;
        font-weight: 700;
      }
      
      .qr-section {
        text-align: center;
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8fafc;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
      }
      
      .transaction-ids {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .id-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .id-label {
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .id-value {
        font-family: monospace;
        font-weight: 600;
        color: #374151;
      }
      
      .qr-code img {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px dashed #e5e7eb;
        font-size: 0.875rem;
        color: #6b7280;
      }
      
      .footer-highlight {
        color: #667eea;
        font-weight: 600;
      }

      .powered-by {
        margin-top: 1rem;
        font-size: 0.75rem;
        color: #9ca3af;
      }

      @media print {
        body {
          background: white;
          padding: 0;
        }
        
        .receipt-container {
          box-shadow: none;
          max-width: none;
        }
      }

      /* Responsive adjustments for smaller screens */
      @media (max-width: 480px) {
        .logo-section {
          padding: 0 0.25rem;
        }
        
        .left-logo-wrapper, .right-logo-wrapper {
          min-width: 60px;
          max-width: 90px;
          padding: 8px;
        }
        
        .left-logo-wrapper img {
          max-height: 60px; /* Adjusted for smaller screens */
        }
        
        .right-logo-wrapper img {
          max-height: 120px; /* 2x of 60px for smaller screens */
        }
        
        .business-name {
          font-size: 1.25rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="logo-section">
          <div class="left-logo-wrapper">
            <img id="logo1" src="https://res.cloudinary.com/dxypfbvwt/image/upload/v1752671926/dark_a1by8v.png" alt="Left Logo">
          </div>
          <!-- Removed the partnership-indicator div -->
          <div class="right-logo-wrapper">
            <img id="logo2" src="https://res.cloudinary.com/dxypfbvwt/image/upload/v1752591894/10d9eb6f-a9d0-4957-90f6-edfcf9379977.png" alt="Business Logo">
          </div>
        </div>
        <div class="center-content">
          <div class="business-name">{{business_name}}</div>
          <div class="receipt-subtitle">Transaction Receipt</div>
        </div>
        <div class="status-badge" style="background-color: {{statusColor}};">{{statusText}}</div>
      </div>
      
      <div class="amount-section">
        <div class="amount">{{currency}}{{formattedAmount}}</div>
        <div class="amount-label">Total Amount</div>
      </div>
      
      <div class="transaction-info">
        <div class="info-item">
          <div class="info-label">Date</div>
          <div class="info-value">{{date}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Time</div>
          <div class="info-value">{{time}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">{{statusText}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Method</div>
          <div class="info-value">Electronic</div>
        </div>
      </div>
      
      <div class="items-section">
        <div class="section-title">Items Purchased</div>
        {{#each items}}
          <div class="item">
            <div class="item-info">
              <div class="item-name">{{this.name}}</div>
              <div class="item-details">Qty: {{this.quantity}} × {{../currency}}{{this.price}}</div>
            </div>
            <div class="item-price">{{../currency}}{{this.total}}</div>
          </div>
        {{/each}}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <span>Total Payment</span>
          <span>{{currency}}{{formattedAmount}}</span>
        </div>
      </div>
      
      <div class="qr-section">
        <div class="transaction-ids">
          <div class="id-row">
            <span class="id-label">Transaction ID</span>
            <span class="id-value">{{transaction_id}}</span>
          </div>
          <div class="id-row">
            <span class="id-label">Payment ID</span>
            <span class="id-value">{{payment_id}}</span>
          </div>
        </div>
        <div class="qr-code">
          <img src="{{qrDataUrl}}" alt="Transaction QR Code">
        </div>
      </div>
      
      <div class="footer">
        Need assistance? Contact us at <span class="footer-highlight">official.checkout.ai@gmail.com</span><br>
        Thank you for your business!
        <div class="powered-by">Powered by Advanced Receipt System</div>
      </div>
    </div>
  
  
  </body></html>
  `;

  // Prepare template data
  const templateData = {
    ...data,
    formattedAmount,
    businessInitials: data.business_name.substring(0, 2).toUpperCase(),
    statusColor: statusColors[data.status],
    statusText: data.status.charAt(0).toUpperCase() + data.status.slice(1),
    qrDataUrl,
    items: data.items.map(item => ({
      ...item,
      total: (parseInt(item.price) * item.quantity).toLocaleString()
    }))
  };

  // Compile template
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(templateData);
}

// ===============================================
// 2. BROWSER MANAGEMENT
// ===============================================

/**
 * Initialize Puppeteer browser
 * @returns {Promise<Browser>} - Puppeteer browser instance
 */
async function initializeBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-default-apps"
    ],
  });
}

/**
 * Setup page with receipt content
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} html - HTML content
 * @returns {Promise<Page>} - Configured page
 */
async function setupReceiptPage(browser, html) {
  const page = await browser.newPage();
  
  // Set optimal viewport for receipt
  await page.setViewport({ 
    width: 600, 
    height: 1200, 
    deviceScaleFactor: 2 
  });

  // Set content and wait for fonts to load
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  
  return page;
}

// ===============================================
// 3. OUTPUT GENERATORS
// ===============================================

/**
 * Generate receipt as image buffer
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>} - Image buffer
 */
async function generateReceiptImageBuffer(data) {
  const browser = await initializeBrowser();
  let page;
  
  try {
    const html = await generateReceiptTemplate(data);
    page = await setupReceiptPage(browser, html);
    
    const receiptElement = await page.$(".receipt-container");
    
    if (!receiptElement) {
      throw new Error("Receipt container not found");
    }
    
    const buffer = await receiptElement.screenshot({
      type: 'png',
      omitBackground: false,
    });
    
    return buffer;
  } finally {
    if (page) await page.close();
    await browser.close();
  }
}

/**
 * Generate receipt as PDF buffer
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateReceiptPDFBuffer(data) {
  const browser = await initializeBrowser();
  let page;
  
  try {
    const html = await generateReceiptTemplate(data);
    page = await setupReceiptPage(browser, html);
    
    const buffer = await page.pdf({
      width: "600px",
      height: "1200px",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px"
      }
    });
    
    return buffer;
  } finally {
    if (page) await page.close();
    await browser.close();
  }
}

/**
 * Generate receipt as HTML buffer
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>} - HTML buffer
 */
async function generateReceiptHTMLBuffer(data) {
  const html = await generateReceiptTemplate(data);
  return Buffer.from(html, 'utf8');
}

// ===============================================
// 4. MAIN RECEIPT GENERATOR
// ===============================================

/**
 * Generate receipt in specified format
 * @param {Object} data - Receipt data
 * @param {string} format - Output format ('image', 'pdf', 'html', 'buffer')
 * @returns {Promise<Buffer>} - Receipt buffer
 */
async function generateReceipt(data, format = 'image') {
  // Validate input data
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid receipt data provided');
  }

  const requiredFields = ['currency', 'amount', 'date', 'time', 'status', 'business_name', 'transaction_id', 'payment_id', 'items'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Items array is required and cannot be empty');
  }

  // Validate status
  const validStatuses = ['success', 'pending', 'declined'];
  if (!validStatuses.includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    switch (format.toLowerCase()) {
      case 'image':
      case 'buffer':
        return await generateReceiptImageBuffer(data);
      case 'pdf':
        return await generateReceiptPDFBuffer(data);
      case 'html':
        return await generateReceiptHTMLBuffer(data);
      default:
        throw new Error(`Unsupported format: ${format}. Use 'image', 'pdf', or 'html'`);
    }
  } catch (error) {
    throw new Error(`Receipt generation failed: ${error.message}`);
  }
}

// ===============================================
// 5. FILE SAVERS
// ===============================================

/**
 * Save receipt to file
 * @param {Object} data - Receipt data
 * @param {string} format - Output format
 * @param {string} filename - Output filename (without extension)
 * @returns {Promise<string>} - Full path to saved file
 */
async function saveReceiptToFile(data, format = 'image', filename = 'receipt') {
  const buffer = await generateReceipt(data, format);
  
  const extensions = {
    image: 'png',
    pdf: 'pdf',
    html: 'html',
    buffer: 'png'
  };
  
  const extension = extensions[format.toLowerCase()];
  const fullPath = `${filename}.${extension}`;
  
  await fs.promises.writeFile(fullPath, buffer);
  return fullPath;
}

// ===============================================
// 6. TEST FUNCTIONS
// ===============================================

/**
 * Test receipt generation with sample data
 */
async function testReceiptGeneration() {
  console.log("🧪 Starting receipt generation tests...\n");
  
  const sampleData = {
    currency: "₦",
    amount: "125000",
    date: "2025-07-17",
    time: "14:30",
    status: 'success',
    business_name: 'Spectra Store',
    transaction_id: '01K09KMV69M11MCFFVDJXBY424',
    payment_id: '01K09KRT9H7H17HGVN7G1NZ3MX',
    items: [
      {
        "id": "01K0849KJPQYG6HHHK30YZ1CT0",
        "name": "Hennessy Cognac",
        "price": "25000",
        "quantity": 5
      }
    ]
  };

  const tests = [
    { format: 'image', description: 'Image Buffer' },
    { format: 'pdf', description: 'PDF Buffer' },
    { format: 'html', description: 'HTML Buffer' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.description}...`);
      const startTime = Date.now();
      
      const buffer = await generateReceipt(sampleData, test.format);
      const endTime = Date.now();
      
      console.log(`✅ ${test.description} generated successfully`);
      console.log(`📊 Buffer size: ${(buffer.length / 1024).toFixed(2)} KB`);
      console.log(`⏱️  Generation time: ${endTime - startTime}ms`);
      
      // Save to file for verification
      const filename = `test_receipt_${test.format}`;
      await saveReceiptToFile(sampleData, test.format, filename);
      console.log(`💾 Saved as: ${filename}.${test.format === 'image' ? 'png' : test.format}`);
      
    } catch (error) {
      console.error(`❌ ${test.description} test failed:`, error.message);
    }
    console.log(""); // Empty line for readability
  }
  
  console.log("🎉 All tests completed!");
}

/**
 * Test with different receipt statuses
 */
async function testReceiptStatuses() {
  console.log("🧪 Testing different receipt statuses...\n");
  
  const baseData = {
    currency: "₦",
    amount: "75000",
    date: "2025-07-17",
    time: "16:45",
    business_name: 'Tech Paradise',
    transaction_id: '01K09KMV69M11MCFFVDJXBY424',
    payment_id: '01K09KRT9H7H17HGVN7G1NZ3MX',
    items: [
      {
        "id": "01K0849KJPQYG6HHHK30YZ1CT0",
        "name": "Wireless Headphones",
        "price": "25000",
        "quantity": 3
      }
    ]
  };

  const statuses = ['success', 'pending', 'declined'];

  for (const status of statuses) {
    try {
      console.log(`Testing ${status} status...`);
      const testData = { ...baseData, status };
      
      const buffer = await generateReceipt(testData, 'image');
      const filename = `test_receipt_${status}`;
      await saveReceiptToFile(testData, 'image', filename);
      
      console.log(`✅ ${status} receipt generated and saved as ${filename}.png`);
    } catch (error) {
      console.error(`❌ ${status} test failed:`, error.message);
    }
  }
  
  console.log("\n🎉 Status tests completed!");
}

/**
 * Benchmark receipt generation performance
 */
async function benchmarkReceiptGeneration() {
  console.log("🧪 Benchmarking receipt generation performance...\n");
  
  const sampleData = {
    currency: "₦",
    amount: "50000",
    date: "2025-07-17",
    time: "12:00",
    status: 'success',
    business_name: 'Benchmark Store',
    transaction_id: '01K09KMV69M11MCFFVDJXBY424',
    payment_id: '01K09KRT9H7H17HGVN7G1NZ3MX',
    items: [
      {
        "id": "01K0849KJPQYG6HHHK30YZ1CT0",
        "name": "Test Product",
        "price": "10000",
        "quantity": 5
      }
    ]
  };

  const iterations = 3;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await generateReceipt(sampleData, 'image');
    const endTime = Date.now();
    const duration = endTime - startTime;
    results.push(duration);
    console.log(`Iteration ${i + 1}: ${duration}ms`);
  }

  const average = results.reduce((a, b) => a + b) / results.length;
  console.log(`\n📊 Average generation time: ${average.toFixed(2)}ms`);
  console.log(`📊 Fastest: ${Math.min(...results)}ms`);
  console.log(`📊 Slowest: ${Math.max(...results)}ms`);
}

// ===============================================
// 7. EXPORTS
// ===============================================

export {
  generateReceipt,
  generateReceiptImageBuffer,
  generateReceiptPDFBuffer,
  generateReceiptHTMLBuffer,
  saveReceiptToFile,
  testReceiptGeneration,
  testReceiptStatuses,
  benchmarkReceiptGeneration
};

// ===============================================
// 8. EXAMPLE USAGE
// ===============================================

// Uncomment to run tests
// testReceiptGeneration();
// testReceiptStatuses();
// benchmarkReceiptGeneration();