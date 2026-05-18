import { useState, useRef, useEffect } from 'react'
import exifr from 'exifr'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { ImagePlus, X, Plus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'

const MAX_PHOTOS = 99
const PRESET_TAGS = ['玩耍', '睡覺', '吃飯', '日常', '可愛']

export default function PhotosNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const fileRef = useRef(null)

  // items: { id, file, preview, exifDate, status }
  const [items, setItems] = useState([])
  const [preparing, setPreparing] = useState(false)
  const [form, setForm] = useState({ title: '', fallbackDate: today, note: '' })
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [doneCount, setDoneCount] = useState(0)
  const [result, setResult] = useState(null) // { ok, failed } after upload finishes with failures
  const [error, setError] = useState('')

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(i => URL.revokeObjectURL(i.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const missingExifCount = items.filter(i => !i.exifDate).length
  const totalCount = items.length

  function addTag(t) {
    const v = t.trim()
    if (v && !tags.includes(v)) setTags(prev => [...prev, v])
    setTagInput('')
  }
  function removeTag(t) { setTags(prev => prev.filter(x => x !== t)) }
  function togglePreset(t) { tags.includes(t) ? removeTag(t) : addTag(t) }

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function processOne(file) {
    let exifDate = null
    try {
      const exif = await exifr.parse(file, ['DateTimeOriginal', 'DateTime'])
      const taken = exif?.DateTimeOriginal ?? exif?.DateTime
      if (taken instanceof Date && !isNaN(taken)) {
        exifDate = taken.toISOString().split('T')[0]
      }
    } catch { /* ignore EXIF errors */ }
    const compressed = await compressImage(file, 1920, 0.85)
    return {
      id: crypto.randomUUID(),
      file: compressed,
      preview: URL.createObjectURL(compressed),
      exifDate,
      status: 'pending',
    }
  }

  async function handleFiles(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // allow re-selecting same files
    if (!picked.length) return

    const remaining = MAX_PHOTOS - items.length
    const truncated = picked.length > remaining
    const toAdd = picked.slice(0, remaining)
    if (!toAdd.length) {
      setError(`最多 ${MAX_PHOTOS} 張，已達上限`)
      return
    }
    setError('')
    setPreparing(true)
    try {
      const prepared = await Promise.all(toAdd.map(processOne))
      setItems(prev => [...prev, ...prepared])
      if (truncated) setError(`最多 ${MAX_PHOTOS} 張，已選擇前 ${toAdd.length} 張`)
    } catch {
      setError('讀取照片失敗，請再試一次')
    } finally {
      setPreparing(false)
    }
  }

  function removeItem(id) {
    setItems(prev => {
      const target = prev.find(i => i.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  async function uploadOne(item, shared) {
    const { fallbackDate, ...meta } = shared
    const path = `photos/${Date.now()}-${item.id}.webp`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, item.file)
    const url = await getDownloadURL(storageRef)
    await addDoc(collection(db, 'photos'), {
      ...meta,
      date: item.exifDate || fallbackDate,
      url,
      path,
      createdAt: Timestamp.now(),
    })
  }

  async function runUpload(targetIds = null) {
    setUploading(true)
    setResult(null)

    const docShared = {
      title: form.title.trim(),
      note: form.note.trim(),
      tags,
      fallbackDate: form.fallbackDate,
    }

    const previouslyDone = items.filter(i => i.status === 'done').length
    const queue = items.filter(i => i.status !== 'done' && (targetIds === null || targetIds.includes(i.id)))

    setDoneCount(previouslyDone)
    let successInRun = 0
    let failedInRun = 0

    for (const item of queue) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i))
      try {
        await uploadOne(item, docShared)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i))
        successInRun += 1
        setDoneCount(previouslyDone + successInRun)
      } catch {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'failed' } : i))
        failedInRun += 1
      }
    }

    setUploading(false)
    if (failedInRun === 0) {
      navigate('/photos')
    } else {
      setResult({ ok: previouslyDone + successInRun, failed: failedInRun })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!items.length) { setError('請至少選擇一張照片'); return }
    runUpload()
  }

  function retryFailed() {
    const failedIds = items.filter(i => i.status === 'failed').map(i => i.id)
    // reset failed → pending so the loop picks them up
    setItems(prev => prev.map(i => i.status === 'failed' ? { ...i, status: 'pending' } : i))
    setResult(null)
    setTimeout(() => runUpload(failedIds), 0)
  }

  function leaveAfterPartial() {
    navigate('/photos')
  }

  const overallPercent = totalCount === 0 ? 0 : Math.round(doneCount / totalCount * 100)
  const disabled = uploading || preparing

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F5F0EB' }}>
      <PageHeader title="新增照片" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">

        {/* 預覽區 */}
        {items.length === 0 ? (
          <div
            onClick={() => !disabled && fileRef.current.click()}
            className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-[#B0D8EE] bg-white flex items-center justify-center overflow-hidden cursor-pointer active:opacity-80"
          >
            <div className="flex flex-col items-center gap-2 text-[#7BAEC8]">
              <ImagePlus size={36} />
              <p className="text-sm font-semibold">
                {preparing ? '讀取中...' : '點擊選擇照片'}
              </p>
              <p className="text-[10px] text-[#B0D8EE]">一次最多 {MAX_PHOTOS} 張</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">
                已選 {items.length} / {MAX_PHOTOS}
              </span>
              {preparing && <span className="text-[10px] text-[#7BAEC8]">讀取中...</span>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {items.map(item => (
                <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-white">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center cursor-pointer active:bg-black/75"
                      aria-label="移除"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <span className="text-white text-[10px] font-semibold">上傳中</span>
                    </div>
                  )}
                  {item.status === 'done' && (
                    <div className="absolute inset-0 bg-[#4AAFDC]/35 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                  {item.status === 'failed' && (
                    <div className="absolute inset-0 bg-red-500/45 flex items-center justify-center">
                      <span className="text-white text-[10px] font-semibold">失敗</span>
                    </div>
                  )}
                </div>
              ))}
              {items.length < MAX_PHOTOS && !uploading && (
                <button
                  type="button"
                  onClick={() => !disabled && fileRef.current.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#B0D8EE] bg-white flex items-center justify-center text-[#7BAEC8] cursor-pointer active:opacity-80"
                  aria-label="加更多"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">標題（選填）</label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            disabled={uploading}
            placeholder="例：曬太陽的嬛嬛"
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] disabled:opacity-60"
          />
          {items.length > 1 && (
            <p className="mt-1 text-[10px] text-[#7BAEC8]">本批 {items.length} 張將共用同一標題</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide flex items-center gap-2">
            {items.length > 0 && missingExifCount < totalCount ? '預設日期' : '日期'}
            {items.length > 0 && missingExifCount === 0 && (
              <span className="normal-case tracking-normal font-medium text-[10px] bg-[#E8F4FC] text-[#4AAFDC] px-2 py-0.5 rounded-full">
                📷 全部使用拍攝日期
              </span>
            )}
            {items.length > 0 && missingExifCount > 0 && missingExifCount < totalCount && (
              <span className="normal-case tracking-normal font-medium text-[10px] bg-[#E8F4FC] text-[#4AAFDC] px-2 py-0.5 rounded-full">
                {missingExifCount} 張將使用此日期
              </span>
            )}
          </label>
          <input
            type="date"
            value={form.fallbackDate}
            onChange={e => setField('fallbackDate', e.target.value)}
            disabled={uploading}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC] disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea
            value={form.note}
            onChange={e => setField('note', e.target.value)}
            disabled={uploading}
            placeholder="任何補充說明..."
            rows={2}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">標籤（選填）</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_TAGS.map(t => (
              <button
                key={t}
                type="button"
                disabled={uploading}
                onClick={() => togglePreset(t)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-60"
                style={tags.includes(t)
                  ? { background: '#1A4F6E', color: '#fff', borderColor: '#1A4F6E' }
                  : { background: 'white', color: '#7BAEC8', borderColor: '#B0D8EE' }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[28px]">
            {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
              <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4FC] text-[#1A4F6E] border border-[#B0D8EE]">
                {t}
                <button type="button" onClick={() => removeTag(t)} disabled={uploading} className="text-[#7BAEC8] hover:text-[#1A4F6E] leading-none disabled:opacity-60">×</button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            disabled={uploading}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
            placeholder="輸入自訂標籤後按 Enter"
            className="mt-2 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-2.5 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] disabled:opacity-60"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {uploading && (
          <div className="bg-white rounded-xl border border-[#B0D8EE] px-4 py-3">
            <div className="flex items-center justify-between text-xs text-[#1A4F6E] font-semibold">
              <span>上傳中 {doneCount} / {totalCount}</span>
              <span>{overallPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#E8F4FC] overflow-hidden">
              <div className="h-full bg-[#4AAFDC] transition-all" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || items.length === 0}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60"
        >
          {uploading
            ? `上傳中 ${doneCount}/${totalCount}`
            : items.length === 0
              ? '儲存照片'
              : `儲存照片（${items.length} 張）`}
        </button>
      </form>

      {/* 部分失敗後的提示 */}
      {result && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div>
              <p className="text-base font-bold text-[#1A4F6E]">上傳完成</p>
              <p className="text-sm text-[#7BAEC8] mt-1">
                成功 {result.ok} 張，失敗 {result.failed} 張
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={leaveAfterPartial}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#E8F4FC] text-[#1A4F6E] cursor-pointer"
              >
                返回相簿
              </button>
              <button
                type="button"
                onClick={retryFailed}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#4AAFDC] text-white cursor-pointer"
              >
                重試失敗的
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
