# UCP Commerce Chatbot Frontend

A React/Next.js chatbot interface for browsing and searching products across multiple UCP (Universal Commerce Protocol) merchants.

## Features

- 🤖 Chat-based product search interface
- 🏪 Multi-merchant support with real-time switching
- 📦 Product display with images, prices, and stock status
- 🔄 Real-time streaming responses
- 💨 Fast, responsive UI with Tailwind CSS

## Prerequisites

Ensure these services are running:

1. **Merchant Backend** (port 8000, 8001, 8002):
   ```bash
   cd ucp-merchant
   
   # Terminal 1: Widgets merchant
   python ucp_server_multi.py --merchant widgets --port 8000
   
   # Terminal 2: Gadgets merchant
   python ucp_server_multi.py --merchant gadgets --port 8001
   
   # Terminal 3: Doohickeys merchant
   python ucp_server_multi.py --merchant doohickeys --port 8002
   ```

2. **Client Backend** (port 7000):
   ```bash
   cd ucp-client
   uvicorn ucp_client:app --host 0.0.0.0 --port 7000 --reload
   ```

## Installation & Running

```bash
cd ucp-frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Select a Merchant**: Use the sidebar dropdown to choose which merchant to shop from
2. **Search Products**: Type a product name or description in the search box
3. **Browse Results**: View products with details like price, image, and stock status
4. **Switch Merchants**: Change merchants anytime to search their catalog

## Architecture

```
Frontend (Next.js, port 3000)
    ↓ HTTP (axios)
Client Backend (FastAPI, port 7000)
    ├─ GET /api/merchants       → discover merchants
    └─ POST /api/search         → search products
    ↓ HTTP (httpx)
Merchant Backends (FastAPI, ports 8000-8002)
    └─ POST /catalog/search     → UCP catalog search
```

## API Endpoints

### Client Backend (`http://localhost:7000`)

#### GET /api/merchants
Discover available merchants.

**Response:**
```json
{
  "merchants": [
    {
      "id": "widgets",
      "name": "Local Tech Store",
      "description": "Premium widgets for everyday tasks"
    },
    ...
  ],
  "total": 3
}
```

#### POST /api/search?merchant_id={id}
Search products on a specific merchant.

**Request Body:**
```json
{
  "query": "headphones"
}
```

**Response:**
```json
{
  "ucp": {
    "version": "2026-04-08",
    "capabilities": {
      "dev.ucp.shopping.catalog.search": [...]
    }
  },
  "products": [
    {
      "id": "WIDGET-001",
      "title": "Wireless Headphones",
      "description": { "plain": "..." },
      "price_range": { "min": { "amount": 999, "currency": "USD" } },
      "media": [...],
      "metadata": { "stock": "in_stock" }
    }
  ]
}
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Backend**: FastAPI (Python)

## Future Enhancements

- [ ] Add to cart functionality
- [ ] Checkout flow
- [ ] Order history
- [ ] Product filters
- [ ] User authentication
- [ ] Wishlist
- [ ] Reviews & ratings

## Troubleshooting

**"Cannot reach merchant" error**: Make sure all merchant backends are running on ports 8000, 8001, 8002

**"Failed to load merchants"**: Ensure the client backend is running on port 7000

**Products not showing**: Check that the merchant you selected is running and accessible

## License

MIT
