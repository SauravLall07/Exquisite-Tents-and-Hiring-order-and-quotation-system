import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white'

const CATEGORIES = [
  { value: 'tent',      label: 'Tent' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'extras',    label: 'Extras' },
  { value: 'covers',    label: 'Covers' },
]

const EMPTY = { name: '', description: '', capacity: '', price_from: '', image_url: '', category: 'tent' }

export default function AdminCatalog() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })
    setProducts(data ?? [])
    setLoading(false)
  }

  function handleFile(e) {
    const file = e.target.files?.[0] ?? null
    if (preview) URL.revokeObjectURL(preview)
    setImageFile(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  function startEdit(p) {
    setEditId(p.id)
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      capacity: p.capacity ?? '',
      price_from: p.price_from ?? '',
      image_url: p.image_url ?? '',
      category: p.category ?? 'tent',
    })
    setImageFile(null)
    setPreview(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY)
    setImageFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)

    let image_url = form.image_url

    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        setError('Image must be under 5 MB')
        setSaving(false)
        return
      }
      const ext  = imageFile.name.split('.').pop().toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('catalog-images')
        .upload(path, imageFile, { contentType: imageFile.type })
      if (uploadErr) { setError(uploadErr.message); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('catalog-images').getPublicUrl(path)
      image_url = publicUrl
    }

    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      capacity:    form.capacity ? parseInt(form.capacity, 10) : null,
      price_from:  form.price_from ? parseFloat(form.price_from) : null,
      image_url:   image_url || null,
      category:    form.category,
    }

    let err
    if (editId) {
      ;({ error: err } = await supabase.from('products').update(payload).eq('id', editId))
    } else {
      ;({ error: err } = await supabase.from('products').insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    cancelEdit()
    load()
  }

  async function toggleActive(p) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.28em] text-red-700">Admin workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {editId ? 'Edit product' : 'Add product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name *">
              <input
                className={inputCls}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 6×12 Marquee"
              />
            </Field>
            <Field label="Category">
              <select
                className={inputCls}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Capacity (guests)">
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                placeholder="e.g. 100"
              />
            </Field>
            <Field label="Starting price (R)">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={form.price_from}
                onChange={e => setForm(f => ({ ...f, price_from: e.target.value }))}
                placeholder="e.g. 2500"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description of the tent…"
            />
          </Field>

          <Field label="Image">
            <label
              htmlFor="catalog-image-input"
              className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition hover:border-red-300"
            >
              {preview || form.image_url ? (
                <img
                  src={preview ?? form.image_url}
                  alt="Preview"
                  className="mx-auto max-h-48 rounded-2xl object-cover"
                />
              ) : (
                <p className="text-sm text-slate-400">Click to upload an image</p>
              )}
              <input
                id="catalog-image-input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFile}
              />
            </label>
          </Field>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Add product'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product list */}
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">All products</h2>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-400">No products yet.</p>
        ) : (
          <div className="space-y-3">
            {products.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-400 text-xl font-bold">
                    {p.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-900">{p.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                      {p.category ?? 'tent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.capacity ? `${p.capacity} guests` : '—'}
                    {p.price_from ? ` · From R${Number(p.price_from).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      p.active
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p.active ? 'Visible' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
