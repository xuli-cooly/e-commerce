import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined, CloseCircleFilled, SearchOutlined } from '@ant-design/icons'
import { message } from 'antd'
import api from '../api/axios'
import NavBar from '../components/NavBar'

interface Product {
  id: number
  name: string
  price: number
  image_url: string
}

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageURLs, setImageURLs] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + imageURLs.length > 9) {
      message.warning('最多上传 9 张图片')
      return
    }
    setUploading(true)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await api.post('/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setImageURLs((prev) => [...prev, res.data.data.url])
      }
    } catch {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImageURLs((prev) => prev.filter((_, i) => i !== index))
  }

  const searchProducts = async () => {
    if (!productSearch.trim()) return
    setSearching(true)
    try {
      const res = await api.get('/products', { params: { search: productSearch, size: 10 } })
      setSearchResults(res.data.data.list || [])
    } catch {
      message.error('搜索失败')
    } finally {
      setSearching(false)
    }
  }

  const toggleProduct = (p: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id)
      if (exists) return prev.filter((x) => x.id !== p.id)
      if (prev.length >= 9) { message.warning('最多关联 9 个商品'); return prev }
      return [...prev, p]
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) { message.warning('请填写标题'); return }
    setSubmitting(true)
    try {
      await api.post('/posts', {
        title: title.trim(),
        content: content.trim(),
        image_urls: imageURLs,
        product_ids: selectedProducts.map((p) => p.id),
      })
      message.success('发布成功')
      navigate('/community')
    } catch (err: any) {
      message.error(err.response?.data?.message || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <NavBar
        title="发布种草"
        back
        right={
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ height: 32, padding: '0 16px', fontSize: 13 }}
          >
            {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> 发布中</> : '发布'}
          </button>
        }
      />

      <div className="page-content-no-tab" style={{ paddingBottom: 24 }}>
        {/* Images */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {imageURLs.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                <img
                  src={url}
                  alt=""
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }}
                />
                <CloseCircleFilled
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    color: '#ff4d4f', fontSize: 18, cursor: 'pointer',
                    background: '#fff', borderRadius: '50%',
                  }}
                />
              </div>
            ))}
            {imageURLs.length < 9 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: 10,
                  border: '1.5px dashed #d0d0d0',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 4, cursor: 'pointer',
                  background: uploading ? '#f9f9f9' : '#fff',
                  transition: 'background 0.15s',
                }}
              >
                {uploading
                  ? <span className="spinner" />
                  : <><PlusOutlined style={{ fontSize: 20, color: '#bbb' }} /><span style={{ fontSize: 11, color: '#bbb' }}>添加图片</span></>
                }
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {/* Title */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
          <input
            placeholder="填写标题，让大家更容易找到你的种草..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            style={{
              width: '100%', border: 'none', outline: 'none',
              fontSize: 16, fontWeight: 600, color: '#1a1a1a',
              background: 'transparent', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5' }}>
          <textarea
            placeholder="分享你的真实体验，让更多人看到好物..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            style={{
              width: '100%', border: 'none', outline: 'none',
              fontSize: 14, color: '#444', lineHeight: 1.75,
              background: 'transparent', fontFamily: 'inherit',
              resize: 'none',
            }}
          />
        </div>

        {/* Product association */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 10 }}>关联商品（选填，最多 9 个）</div>

          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {selectedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#e6f9f9', borderRadius: 8,
                    padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#01c2c3', fontWeight: 500 }}>{p.name}</span>
                  <CloseCircleFilled style={{ fontSize: 13, color: '#01c2c3' }} />
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f5f5f5', borderRadius: 22,
            padding: '0 14px', height: 38,
          }}>
            <SearchOutlined style={{ color: '#bbb', fontSize: 14 }} />
            <input
              placeholder="搜索商品名称..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') searchProducts() }}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 13, color: '#333', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={searchProducts}
              disabled={searching}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 12, color: '#01c2c3', fontWeight: 600,
                padding: 0, fontFamily: 'inherit',
              }}
            >
              {searching ? '搜索中' : '搜索'}
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {searchResults.map((p) => {
                const selected = selectedProducts.some((x) => x.id === p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0', cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5',
                      background: selected ? '#f0fdfd' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <img src={p.image_url} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 600 }}>¥{p.price.toFixed(2)}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: selected ? '#01c2c3' : '#e0e0e0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 12, transition: 'background 0.15s',
                    }}>
                      {selected ? '✓' : '+'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
