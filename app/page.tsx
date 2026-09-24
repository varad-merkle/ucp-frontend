'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

interface Merchant {
  id: string
  name: string
  description: string
}

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  data?: any
}

interface Product {
  id: string
  title: string
  description?: { plain?: string }
  url: string
  price_range?: {
    min?: { amount: number; currency: string }
    max?: { amount: number; currency: string }
  }
  media?: Array<{ type: string; url: string }>
  metadata?: Record<string, string>
}

const API_BASE = 'http://localhost:7000'
// const API_BASE = 'https://hifihut.ie/'

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [selectedMerchant, setSelectedMerchant] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch merchants on mount
  useEffect(() => {
    fetchMerchants()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMerchants = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/merchants`)
      setMerchants(response.data.merchants)
      if (response.data.merchants.length > 0) {
        setSelectedMerchant(response.data.merchants[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
      addBotMessage('Failed to load merchants. Please check if the backend is running.')
    }
  }

  const addBotMessage = (content: string, data?: any) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'bot',
        content,
        data
      }
    ])
  }

  const handleSearch = async (query: string) => {
    // if (!selectedMerchant || !query.trim()) return

    if(!query.trim()) return

    // Search via the MCP endpoint when a merchant is not selected
    console.log(selectedMerchant)
    if(!selectedMerchant || selectedMerchant === 'widgets') {
      try {
        const mcpResponse = await axios.post(
          `${API_BASE}/api/search/mcp`,
          { query },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        const mcpProducts: Product[] = mcpResponse.data || []

        if (mcpProducts.length === 0) {
          addBotMessage(`No products found matching "${query}" across all merchants.`)
        } else {
          addBotMessage(`Found ${mcpProducts.length} product${mcpProducts.length !== 1 ? 's' : ''} across all merchants:`, { products: mcpProducts })
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.detail || 'Search failed. Please try again.'
        addBotMessage(`Error: ${errorMsg}`)
      } finally {
        setLoading(false)
      }
    }

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content: query
      }
    ])

    setLoading(true)

    try {
      let response;
      if(selectedMerchant !== 'widgets') {
        response = await axios.post(
          `${API_BASE}/api/search?merchant_id=${selectedMerchant}`,
          { query },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      const products: Product[] = response.data.products || []

      if (products.length === 0) {
        addBotMessage(`No products found matching "${query}" in ${merchants.find(m => m.id === selectedMerchant)?.name}`)
      } else {
        addBotMessage(`Found ${products.length} product${products.length !== 1 ? 's' : ''}:`, { products })
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Search failed. Please try again.'
      addBotMessage(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    handleSearch(input)
    setInput('')
  }

  const handleMerchantChange = (merchantId: string) => {
    setSelectedMerchant(merchantId)
    setMessages([])
    const merchant = merchants.find(m => m.id === merchantId)
    if (merchant) {
      addBotMessage(`Switched to ${merchant.name}. What would you like to search for?`)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">UCP Shop</h1>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Merchant
          </label>
          <select
            value={selectedMerchant}
            onChange={(e) => handleMerchantChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {merchants.map(merchant => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMerchant && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              {merchants.find(m => m.id === selectedMerchant)?.name}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {merchants.find(m => m.id === selectedMerchant)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700 mb-2">Welcome!</p>
                <p className="text-gray-500">
                  {selectedMerchant ? 'Search for products below' : 'Select a merchant first'}
                </p>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>

                {/* Product Cards */}
                {message.data?.products && (
                  <div className="mt-4 space-y-3">
                    {message.data.products.map((product: Product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded border border-gray-200 p-3"
                      >
                      <a href={product.url} target="_blank" rel="noopener noreferrer">
                        <div className="flex gap-3">
                            <img
                              src={product.media[0].url}
                              alt={product.title}
                              className="w-16 h-16 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {product.title}
                            </p>
                            {product.description?.plain && (
                              <p className="text-xs text-gray-600 mt-1">
                                {product.description.plain}
                              </p>
                            )}
                            {product.price_range?.min && (
                              <p className="text-sm font-semibold text-blue-600 mt-2">
                                ${(product.price_range.min.amount / 100).toFixed(2)}
                              </p>
                            )}
                            {product.metadata?.stock && (
                              <p className={`text-xs mt-1 ${
                                product.metadata.stock === 'in_stock'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {product.metadata.stock === 'in_stock' ? '✓ In Stock' : 'Out of Stock'}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search for products..."
              disabled={loading || !selectedMerchant}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              // disabled={loading || !selectedMerchant || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
