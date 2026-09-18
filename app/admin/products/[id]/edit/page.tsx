'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiCheck, FiChevronDown, FiPlus, FiTrash2 } from 'react-icons/fi';

type ProductForm = {
  name: string;
  category: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
  existingImageUrls: string[];
  description: string;
  isFeatured: boolean;
  showStockOnProductPage: boolean;
  hasVariations: boolean;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type VariationForm = {
  name: string;
  isCustomType: boolean;
  options: string[];
  optionImageMap: Record<string, string>;
  optionStockMap: Record<string, string>;
  customOptions: string[];
  customInput: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
};

type Toast = {
  type: 'success' | 'error';
  message: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

type VariationPresetsResponse = {
  types: string[];
  optionsByType: Record<string, string[]>;
};

const VARIATION_OPTIONS: Record<'Size' | 'Color' | 'Type', string[]> = {
  Size: ['8', '10', '12', '14', '16', '18', '20', '22', '24'],
  Color: ['Black', 'Brown', 'Blonde', 'Burgundy', 'Ombre', 'Natural'],
  Type: ['Straight', 'Body Wave', 'Deep Wave', 'Curly', 'Kinky', 'Frontal', 'Closure'],
};

const resolveVariationTypeValue = (name: string) => {
  if (!name) return '';
  return name;
};

const getPredefinedVariationOptions = (name: string) => {
  if (!Object.prototype.hasOwnProperty.call(VARIATION_OPTIONS, name)) return [];
  return VARIATION_OPTIONS[name as keyof typeof VARIATION_OPTIONS];
};

const inputCls =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition placeholder:text-gray-400';

const selectCls =
  'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition appearance-none cursor-pointer';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<ProductForm | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [originalSignature, setOriginalSignature] = useState('');
  const [variations, setVariations] = useState<VariationForm[]>([
    { name: '', isCustomType: false, options: [], optionImageMap: {}, optionStockMap: {}, customOptions: [], customInput: '', regularPrice: '', salePrice: '', stock: '' },
  ]);
  const [originalVariationsSignature, setOriginalVariationsSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variationImageUploading, setVariationImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [variationPresets, setVariationPresets] = useState<VariationPresetsResponse>({ types: [], optionsByType: {} });

  const productId = Number(params.id);

  const hasVariationPriceSet =
    form?.hasVariations === true &&
    variations.some(v => v.regularPrice.trim().length > 0 || v.salePrice.trim().length > 0);

  const mainStockValue = form && form.stock.trim() !== '' ? Number(form.stock) : null;
  const totalVariationStock = useMemo(
    () =>
      variations.reduce((sum, variation) => {
        let hasOptionStock = false;
        let optionTotal = 0;

        for (const option of variation.options) {
          const raw = variation.optionStockMap[option];
          if (raw === undefined || raw.trim() === '') continue;
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) continue;
          hasOptionStock = true;
          optionTotal += parsed;
        }

        if (hasOptionStock) return sum + optionTotal;

        const fallback = variation.stock.trim() !== '' ? Number(variation.stock) : 0;
        return sum + (Number.isFinite(fallback) ? fallback : 0);
      }, 0),
    [variations]
  );
  const isVariationStockOverMain =
    form?.hasVariations === true &&
    mainStockValue !== null &&
    Number.isFinite(mainStockValue) &&
    totalVariationStock > mainStockValue;

  const totalVariationOptions = useMemo(
    () => variations.reduce((sum, variation) => sum + variation.options.length, 0),
    [variations]
  );

  const maxImagesAllowed = useMemo(
    () => Math.max(3, form?.hasVariations ? totalVariationOptions : 0),
    [form?.hasVariations, totalVariationOptions]
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load categories');
        const payload = (await response.json()) as Category[];
        setCategories(payload);
      } catch {
        // Keep form usable even if categories endpoint fails.
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    const loadVariationPresets = async () => {
      try {
        const response = await fetch('/api/admin/variation-presets', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load variation presets');
        const payload = (await response.json()) as VariationPresetsResponse;
        setVariationPresets({
          types: Array.isArray(payload.types) ? payload.types : [],
          optionsByType: payload.optionsByType && typeof payload.optionsByType === 'object' ? payload.optionsByType : {},
        });
      } catch {
        // Keep form usable even if presets endpoint fails.
      }
    };

    void loadVariationPresets();
  }, []);

  const customVariationTypes = useMemo(
    () => variationPresets.types.filter(type => !Object.prototype.hasOwnProperty.call(VARIATION_OPTIONS, type)),
    [variationPresets.types]
  );

  const getSuggestedVariationOptions = (name: string, customOptions: string[]) => {
    const base = getPredefinedVariationOptions(name);
    const saved = variationPresets.optionsByType[name] || [];
    return Array.from(new Set([...base, ...saved])).filter(option => !customOptions.includes(option));
  };

  useEffect(() => {
    const load = async () => {
      if (!Number.isInteger(productId) || productId <= 0) {
        setToast({ type: 'error', message: 'Invalid product id.' });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || 'Failed to load product');
        }

        const payload = (await response.json()) as {
          name: string;
          category: string;
          price: string;
          regularPrice: string | null;
          salePrice: string | null;
          image: string;
          imageUrls?: string[] | null;
          stock?: number | null;
          description: string | null;
          isFeatured: boolean;
          showStockOnProductPage?: boolean;
          hasVariations: boolean;
          variations?: Array<{ name: string; option: string; imageUrl?: string; regularPrice?: string; salePrice?: string; stock?: number | null }> | null;
        };

        const nextForm: ProductForm = {
          name: payload.name,
          category: payload.category,
          regularPrice: payload.regularPrice || payload.price || '',
          salePrice: payload.salePrice || '',
          stock: payload.stock !== undefined && payload.stock !== null ? String(payload.stock) : '',
          existingImageUrls: Array.isArray(payload.imageUrls) && payload.imageUrls.length > 0 ? payload.imageUrls : [payload.image],
          description: payload.description || '',
          isFeatured: Boolean(payload.isFeatured),
          showStockOnProductPage: Boolean(payload.showStockOnProductPage),
          hasVariations: Boolean(payload.hasVariations),
        };

        pendingImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl));
        setPendingImages([]);
        setForm(nextForm);
        setCustomCategory(nextForm.category);
        setOriginalSignature(JSON.stringify(nextForm));

        if (Array.isArray(payload.variations) && payload.variations.length > 0) {
          const grouped = new Map<string, VariationForm>();
          for (const v of payload.variations) {
            if (!grouped.has(v.name)) {
              grouped.set(v.name, {
                name: v.name,
                isCustomType: !Object.prototype.hasOwnProperty.call(VARIATION_OPTIONS, v.name),
                options: [],
                optionImageMap: {},
                optionStockMap: {},
                customOptions: [],
                customInput: '',
                regularPrice: v.regularPrice || '',
                salePrice: v.salePrice || '',
                stock: v.stock !== undefined && v.stock !== null ? String(v.stock) : '',
              });
            }
            const row = grouped.get(v.name)!;
            if (v.option && !row.options.includes(v.option)) {
              row.options.push(v.option);
              if (v.stock !== undefined && v.stock !== null) {
                row.optionStockMap[v.option] = String(v.stock);
              }
              if (typeof (v as { imageUrl?: string }).imageUrl === 'string' && (v as { imageUrl?: string }).imageUrl?.trim()) {
                row.optionImageMap[v.option] = (v as { imageUrl?: string }).imageUrl!.trim();
              }
              const predefined = VARIATION_OPTIONS[v.name as 'Size' | 'Color' | 'Type'] ?? [];
              if (!predefined.includes(v.option)) {
                row.customOptions.push(v.option);
              }
            }
          }
          const loadedVariations = Array.from(grouped.values());
          setVariations(loadedVariations);
          setOriginalVariationsSignature(JSON.stringify(loadedVariations));
        }
      } catch (err) {
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load product' });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [productId]);

  useEffect(() => {
    if (!form) return;

    const matched = categories.find(category => category.name.toLowerCase() === form.category.toLowerCase());
    if (matched) {
      setSelectedCategory(String(matched.id));
    } else if (form.category.trim()) {
      setSelectedCategory('__custom__');
      setCustomCategory(form.category);
    } else {
      setSelectedCategory('');
    }
  }, [categories, form]);

  const currentSignature = useMemo(() => (form ? JSON.stringify(form) : ''), [form]);
  const currentVariationsSignature = useMemo(() => JSON.stringify(variations), [variations]);
  const hasChanges =
    currentSignature !== originalSignature ||
    currentVariationsSignature !== originalVariationsSignature ||
    pendingImages.length > 0;

  const canSubmit = useMemo(() => {
    if (!form) return false;
    const variationValid =
      !form.hasVariations ||
      variations.some(v => v.name && v.options.length > 0 && v.regularPrice.trim().length > 0);
    const hasBasePrice = form.regularPrice.trim().length > 0;
    return (
      form.name.trim().length > 0 &&
      form.category.trim().length > 0 &&
      form.existingImageUrls.length + pendingImages.length > 0 &&
      (hasBasePrice || hasVariationPriceSet) &&
      !uploading &&
      !variationImageUploading &&
      variationValid &&
      !isVariationStockOverMain
    );
  }, [form, pendingImages.length, uploading, variationImageUploading, variations, hasVariationPriceSet, isVariationStockOverMain]);

  const uploadImage = (file: File) => {
    if (!form) return;

    const totalImages = form.existingImageUrls.length + pendingImages.length;
    if (totalImages >= maxImagesAllowed) {
      setToast({ type: 'error', message: `Maximum of ${maxImagesAllowed} images allowed.` });
      return;
    }

    const duplicatePending = pendingImages.some(
      image =>
        image.file.name === file.name &&
        image.file.size === file.size &&
        image.file.lastModified === file.lastModified,
    );
    if (duplicatePending) {
      setToast({ type: 'error', message: 'This image is already selected.' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImages(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, previewUrl }]);
    setToast({ type: 'success', message: 'Image selected. It will upload when you update the product.' });
  };

  const uploadVariationOptionImage = async (variationIndex: number, option: string, file: File) => {
    try {
      setVariationImageUploading(true);
      const data = new FormData();
      data.append('file', file);

      const response = await fetch('/api/uploads/product-image', {
        method: 'POST',
        body: data,
      });

      const payload = (await response.json()) as { url?: string; error?: string; details?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || payload.details || 'Failed to upload variation image');
      }

      setVariations(prev =>
        prev.map((row, idx) =>
          idx === variationIndex
            ? {
                ...row,
                optionImageMap: {
                  ...row.optionImageMap,
                  [option]: payload.url!,
                },
              }
            : row
        )
      );
      setToast({ type: 'success', message: `${option} image uploaded.` });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload variation image' });
    } finally {
      setVariationImageUploading(false);
    }
  };

  const updateProduct = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setUploading(true);

      if (isVariationStockOverMain) {
        throw new Error('Variation stock total cannot exceed the main stock quantity.');
      }

      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < pendingImages.length; i += 1) {
        const pendingImage = pendingImages[i];
        setUploadProgress({ current: i + 1, total: pendingImages.length, fileName: pendingImage.file.name });
        const data = new FormData();
        data.append('file', pendingImage.file);

        const uploadResponse = await fetch('/api/uploads/product-image', {
          method: 'POST',
          body: data,
        });

        const uploadPayload = (await uploadResponse.json()) as { url?: string; error?: string; details?: string };
        if (!uploadResponse.ok || !uploadPayload.url) {
          throw new Error(uploadPayload.error || uploadPayload.details || 'Image upload failed');
        }

        uploadedImageUrls.push(uploadPayload.url);
      }

      const mergedImageUrls = [...form.existingImageUrls, ...uploadedImageUrls];
      if (mergedImageUrls.length === 0) {
        throw new Error('Please keep at least one image.');
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          image: mergedImageUrls[0],
          imageUrls: mergedImageUrls,
          regularPrice: hasVariationPriceSet ? '' : form.regularPrice.trim(),
          salePrice: hasVariationPriceSet ? '' : form.salePrice.trim(),
          stock: form.stock.trim() !== '' ? Number(form.stock) : null,
          showStockOnProductPage: form.showStockOnProductPage,
          hasVariations: form.hasVariations,
          variations: form.hasVariations
            ? variations
                .filter(v => v.name && v.options.length > 0)
                .map(v => ({
                  name: v.name,
                  options: Array.from(new Set([...v.options, ...v.customOptions])),
                  optionImageMap: Object.fromEntries(
                    Object.entries(v.optionImageMap || {})
                      .filter(([option]) => v.options.includes(option))
                      .map(([option, imageUrl]) => [option, imageUrl.trim()])
                      .filter(([, url]) => Boolean(url))
                  ),
                  optionStockMap: Object.fromEntries(
                    Object.entries(v.optionStockMap || {})
                      .filter(([option, stockValue]) => v.options.includes(option) && stockValue.trim() !== '')
                      .map(([option, stockValue]) => [option, Number(stockValue)])
                  ),
                  regularPrice: v.regularPrice.trim(),
                  salePrice: v.salePrice.trim(),
                      stock: v.stock.trim() !== '' ? Number(v.stock) : null,
                }))
            : [],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; details?: string };
        throw new Error(payload.error || payload.details || 'Failed to update product');
      }

      pendingImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);
      setOriginalSignature(JSON.stringify({ ...form, existingImageUrls: mergedImageUrls }));
      setOriginalVariationsSignature(JSON.stringify(variations));
      setToast({ type: 'success', message: 'Product updated successfully.' });
      window.setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 500);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update product' });
    } finally {
      setUploadProgress(null);
      setUploading(false);
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 pb-12">
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <FiCheck className="h-4 w-4" /> : null}
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Edit Product</h1>
          <p className="mt-0.5 text-sm text-gray-500 sm:text-base">Update product details and save changes.</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ← Back
        </Link>
      </div>

      {loading || !form ? (
        <div className="rounded-[2rem] ring-1 ring-gray-200/50 border-0 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-black border-t-black" />
          <p className="mt-3 text-sm text-gray-500">Loading product...</p>
        </div>
      ) : (
        <>
          {/* Basic Information */}
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Basic Information</h2>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Product Name
                <input
                  value={form.name}
                  onChange={e => setForm(prev => (prev ? { ...prev, name: e.target.value } : prev))}
                  placeholder="e.g. Celestial Glow Necklace"
                  className={inputCls}
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Category
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      const value = e.target.value;
                      setSelectedCategory(value);
                      if (value === '__custom__') {
                        setForm(prev => (prev ? { ...prev, category: customCategory } : prev));
                      } else {
                        const chosen = categories.find(c => String(c.id) === value);
                        setForm(prev => (prev ? { ...prev, category: chosen?.name || '' } : prev));
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom category</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </label>

              {selectedCategory === '__custom__' && (
                <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                  Custom Category Name
                  <input
                    value={customCategory}
                    onChange={e => {
                      setCustomCategory(e.target.value);
                      setForm(prev => (prev ? { ...prev, category: e.target.value } : prev));
                    }}
                    placeholder="Enter category name"
                    className={inputCls}
                  />
                </label>
              )}

              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Description
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => (prev ? { ...prev, description: e.target.value } : prev))}
                  rows={4}
                  placeholder="Describe the product..."
                  className={`${inputCls} resize-none`}
                />
              </label>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Pricing</h2>
            {hasVariationPriceSet && (
              <p className="mb-4 mt-2 rounded-lg border border-black bg-white px-3 py-2 text-xs font-medium text-black sm:text-sm">
                Pricing is controlled by variations below. Base prices are disabled.
              </p>
            )}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Regular Price
                <input
                  value={form.regularPrice}
                  onChange={e => setForm(prev => (prev ? { ...prev, regularPrice: e.target.value } : prev))}
                  disabled={hasVariationPriceSet}
                  placeholder="e.g. GH₵150"
                  className={`${inputCls} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Sale Price
                <input
                  value={form.salePrice}
                  onChange={e => setForm(prev => (prev ? { ...prev, salePrice: e.target.value } : prev))}
                  disabled={hasVariationPriceSet}
                  placeholder="Optional"
                  className={`${inputCls} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                />
              </label>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 sm:text-base">
                Stock Quantity
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={e => setForm(prev => (prev ? { ...prev, stock: e.target.value } : prev))}
                  placeholder="Leave blank for unlimited"
                  className={inputCls}
                />
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Product Images</h2>
                <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">Add product images. First image is the main.</p>
                <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">Image slots: {form.existingImageUrls.length + pendingImages.length}/{maxImagesAllowed}</p>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={saving || form.existingImageUrls.length + pendingImages.length >= maxImagesAllowed}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                <FiCamera className="h-4 w-4" />
                {form.existingImageUrls.length + pendingImages.length >= maxImagesAllowed ? 'Max reached' : 'Add Image'}
              </button>
            </div>
            {form.existingImageUrls.length + pendingImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...form.existingImageUrls.map((url) => ({ kind: 'existing' as const, id: url, url })), ...pendingImages.map(image => ({ kind: 'pending' as const, id: image.id, url: image.previewUrl }))].map((image, i) => (
                  <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100">
                    <Image src={image.url} alt={`Product image ${i + 1}`} fill className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                      <button
                        type="button"
                        onClick={() => {
                          if (image.kind === 'pending') {
                            const pendingKey = `pending:${image.id}`;
                            URL.revokeObjectURL(image.url);
                            setPendingImages(prev => prev.filter(item => item.id !== image.id));
                            setVariations(prev =>
                              prev.map(row => ({
                                ...row,
                                optionImageMap: Object.fromEntries(
                                  Object.entries(row.optionImageMap).filter(([, value]) => value !== pendingKey)
                                ),
                              }))
                            );
                            return;
                          }

                          const existingKey = `existing:${image.url}`;
                          setForm(prev =>
                            prev ? { ...prev, existingImageUrls: prev.existingImageUrls.filter(url => url !== image.url) } : prev
                          );
                          setVariations(prev =>
                            prev.map(row => ({
                              ...row,
                              optionImageMap: Object.fromEntries(
                                Object.entries(row.optionImageMap).filter(([, value]) => value !== existingKey)
                              ),
                            }))
                          );
                        }}
                        className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-rose-600 opacity-100 shadow transition sm:scale-75 sm:opacity-0 sm:group-hover:scale-100 sm:group-hover:opacity-100"
                      >
                        <FiTrash2 className="mr-0.5 inline h-3 w-3" />
                        Remove
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="flex min-h-28 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-4 text-center text-gray-400 transition hover:border-black hover:text-black sm:h-32"
              >
                <div className="text-center">
                  <FiCamera className="mx-auto h-8 w-8" />
                  <p className="mt-1 text-sm font-medium">Click to select an image</p>
                </div>
              </div>
            )}
          </div>

          {/* Variations */}
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Variations</h2>
                <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">Add sizes, colors, or types with individual pricing.</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 self-start sm:self-auto">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.hasVariations}
                    onChange={e => setForm(prev => (prev ? { ...prev, hasVariations: e.target.checked } : prev))}
                    className="sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full transition ${form.hasVariations ? 'bg-black' : 'bg-gray-200'}`} />
                  <div
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.hasVariations ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 sm:text-base">
                  {form.hasVariations ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {form.hasVariations && (
              <div className="mt-4 space-y-3">
                {hasVariationPriceSet && (
                  <p className="rounded-lg border border-black bg-white px-3 py-2 text-xs font-medium text-black">
                    Variation prices active — base product prices are disabled.
                  </p>
                )}
                {form.stock.trim() !== '' && (
                  <p
                    className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                      isVariationStockOverMain ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Variation stock total: {totalVariationStock} / Main stock: {mainStockValue ?? 0}
                  </p>
                )}
                {variations.map((variation, i) => (
                  <div key={`variation-${i}`} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Variation {i + 1}</p>
                      {variations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVariations(prev => prev.filter((_, idx) => idx !== i))}
                          className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          <FiTrash2 className="mr-0.5 inline h-3 w-3" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Variation Type</label>
                        <div className="relative">
                          <select
                            value={variation.isCustomType && !variation.name.trim() ? '__custom__' : resolveVariationTypeValue(variation.name)}
                            onChange={e => {
                              const nextType = e.target.value;
                              setVariations(prev =>
                                prev.map((row, idx) =>
                                  idx === i
                                    ? {
                                        ...row,
                                      name: nextType === '__custom__' ? row.name : nextType,
                                        isCustomType: nextType === '__custom__' || customVariationTypes.includes(nextType),
                                        options: [],
                                        optionImageMap: {},
                                        optionStockMap: {},
                                        customOptions: [],
                                        customInput: '',
                                        stock: '',
                                      }
                                    : row
                                )
                              );
                            }}
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                          >
                            <option value="">Select type</option>
                            <option value="Size">Size</option>
                            <option value="Color">Color</option>
                            <option value="Type">Type</option>
                            {customVariationTypes.map(type => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                            {variation.isCustomType && variation.name.trim() && !customVariationTypes.includes(variation.name.trim()) && (
                              <option value={variation.name.trim()}>{variation.name.trim()}</option>
                            )}
                            <option value="__custom__">Custom type</option>
                          </select>
                          <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                        {variation.isCustomType && (
                          <input
                            value={variation.name}
                            onChange={e =>
                              setVariations(prev =>
                                prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row))
                              )
                            }
                            placeholder="Enter variation type (e.g. Material)"
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Options</label>
                        {variation.name ? (
                          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 flex flex-wrap gap-x-4 gap-y-2">
                            {getSuggestedVariationOptions(variation.name, variation.customOptions).map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={variation.options.includes(opt)}
                                  onChange={e =>
                                    setVariations(prev =>
                                      prev.map((row, idx) =>
                                        idx === i
                                            ? {
                                                ...row,
                                                options: e.target.checked
                                                  ? [...row.options, opt]
                                                  : row.options.filter(o => o !== opt),
                                                optionImageMap: e.target.checked
                                                  ? row.optionImageMap
                                                  : Object.fromEntries(Object.entries(row.optionImageMap).filter(([key]) => key !== opt)),
                                                optionStockMap: e.target.checked
                                                  ? row.optionStockMap
                                                  : Object.fromEntries(Object.entries(row.optionStockMap).filter(([key]) => key !== opt)),
                                              }
                                          : row
                                      )
                                    )
                                  }
                                  className="accent-black h-4 w-4 cursor-pointer"
                                />
                                {opt}
                              </label>
                            ))}
                            {variation.customOptions.map(opt => (
                              <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={variation.options.includes(opt)}
                                  onChange={e =>
                                    setVariations(prev =>
                                      prev.map((row, idx) =>
                                        idx === i
                                            ? {
                                                ...row,
                                                options: e.target.checked
                                                  ? [...row.options, opt]
                                                  : row.options.filter(o => o !== opt),
                                                optionImageMap: e.target.checked
                                                  ? row.optionImageMap
                                                  : Object.fromEntries(Object.entries(row.optionImageMap).filter(([key]) => key !== opt)),
                                                optionStockMap: e.target.checked
                                                  ? row.optionStockMap
                                                  : Object.fromEntries(Object.entries(row.optionStockMap).filter(([key]) => key !== opt)),
                                              }
                                          : row
                                      )
                                    )
                                  }
                                  className="accent-black h-4 w-4 cursor-pointer"
                                />
                                <span>{opt}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVariations(prev =>
                                      prev.map((row, idx) =>
                                        idx === i
                                          ? { ...row, customOptions: row.customOptions.filter(o => o !== opt), options: row.options.filter(o => o !== opt), optionImageMap: Object.fromEntries(Object.entries(row.optionImageMap).filter(([key]) => key !== opt)), optionStockMap: Object.fromEntries(Object.entries(row.optionStockMap).filter(([key]) => key !== opt)) }
                                          : row
                                      )
                                    )
                                  }
                                  className="ml-0.5 text-gray-400 hover:text-black transition-colors leading-none"
                                  aria-label={`Remove ${opt}`}
                                >
                                  ×
                                </button>
                              </label>
                            ))}
                            <div className="w-full flex gap-2 mt-1 pt-2 border-t border-gray-100">
                              <input
                                value={variation.customInput}
                                onChange={e =>
                                  setVariations(prev =>
                                    prev.map((row, idx) => idx === i ? { ...row, customInput: e.target.value } : row)
                                  )
                                }
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = variation.customInput.trim();
                                    if (val && !variation.customOptions.includes(val) && !getSuggestedVariationOptions(variation.name, variation.customOptions).includes(val)) {
                                      setVariations(prev =>
                                        prev.map((row, idx) =>
                                          idx === i
                                            ? { ...row, customOptions: [...row.customOptions, val], options: [...row.options, val], customInput: '' }
                                            : row
                                        )
                                      );
                                    }
                                  }
                                }}
                                placeholder="Add custom option…"
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = variation.customInput.trim();
                                  if (val && !variation.customOptions.includes(val) && !getSuggestedVariationOptions(variation.name, variation.customOptions).includes(val)) {
                                    setVariations(prev =>
                                      prev.map((row, idx) =>
                                        idx === i
                                          ? { ...row, customOptions: [...row.customOptions, val], options: [...row.options, val], customInput: '' }
                                          : row
                                      )
                                    );
                                  }
                                }}
                                disabled={!variation.customInput.trim() || variation.customOptions.includes(variation.customInput.trim()) || getSuggestedVariationOptions(variation.name, variation.customOptions).includes(variation.customInput.trim())}
                                className="rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 transition"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                            Select a variation type first
                          </div>
                        )}
                        {variation.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {variation.options.map(opt => (
                              <div key={opt} className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 py-1">
                                <span className="inline-flex items-center rounded-full border border-black bg-white px-2 py-0.5 text-xs font-semibold text-black">
                                  {opt}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void uploadVariationOptionImage(i, opt, file);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="w-40 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700"
                                />
                                {variation.optionImageMap[opt]?.trim() ? (
                                  <span className="text-[11px] font-medium text-emerald-700">Image set</span>
                                ) : null}
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={variation.optionStockMap[opt] || ''}
                                  onChange={e =>
                                    setVariations(prev =>
                                      prev.map((row, idx) =>
                                        idx === i
                                          ? {
                                              ...row,
                                              optionStockMap: {
                                                ...row.optionStockMap,
                                                [opt]: e.target.value,
                                              },
                                            }
                                          : row
                                      )
                                    )
                                  }
                                  placeholder="Stock"
                                  className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block text-[11px] font-semibold text-gray-600 sm:text-xs">
                        Regular Price
                        <input
                          value={variation.regularPrice}
                          onChange={e =>
                            setVariations(prev =>
                              prev.map((row, idx) => (idx === i ? { ...row, regularPrice: e.target.value } : row))
                            )
                          }
                          placeholder="e.g. GH₵200"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-gray-600 sm:text-xs">
                        Sale Price
                        <input
                          value={variation.salePrice}
                          onChange={e =>
                            setVariations(prev =>
                              prev.map((row, idx) => (idx === i ? { ...row, salePrice: e.target.value } : row))
                            )
                          }
                          placeholder="Optional"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-gray-600 sm:text-xs">
                        Default Stock Qty
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={variation.stock}
                          onChange={e =>
                            setVariations(prev =>
                              prev.map((row, idx) => (idx === i ? { ...row, stock: e.target.value } : row))
                            )
                          }
                          placeholder="Optional"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setVariations(prev => [...prev, { name: '', isCustomType: false, options: [], optionImageMap: {}, optionStockMap: {}, customOptions: [], customInput: '', regularPrice: '', salePrice: '', stock: '' }])
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black py-3 text-sm font-semibold text-black transition hover:border-black hover:bg-white"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Another Variation
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
            <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Settings</h2>
            <label className="flex cursor-pointer items-start gap-3 sm:items-center">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={e => setForm(prev => (prev ? { ...prev, isFeatured: e.target.checked } : prev))}
                  className="sr-only"
                />
                <div className={`h-6 w-11 rounded-full transition ${form.isFeatured ? 'bg-black' : 'bg-gray-200'}`} />
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.isFeatured ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 sm:text-base">Featured product</p>
                <p className="text-xs text-gray-400 sm:text-sm">Show this product in featured sections.</p>
              </div>
            </label>
            <label className="mt-4 flex cursor-pointer items-start gap-3 sm:items-center">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.showStockOnProductPage}
                  onChange={e => setForm(prev => (prev ? { ...prev, showStockOnProductPage: e.target.checked } : prev))}
                  className="sr-only"
                />
                <div className={`h-6 w-11 rounded-full transition ${form.showStockOnProductPage ? 'bg-black' : 'bg-gray-200'}`} />
                <div
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.showStockOnProductPage ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 sm:text-base">Show quantity on product page</p>
                <p className="text-xs text-gray-400 sm:text-sm">Display available stock count to customers.</p>
              </div>
            </label>
          </div>

          {/* Save */}
          <div className="flex flex-col gap-3 rounded-[2rem] border-0 ring-1 ring-gray-200/50 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400 sm:max-w-md">
              {hasChanges ? 'You have unsaved changes.' : 'No changes to save.'}
            </p>
            {saving && uploadProgress ? (
              <p className="text-xs font-semibold text-gray-500 sm:mr-2">
                Uploading image {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.fileName}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void updateProduct()}
              disabled={saving || !canSubmit || !hasChanges}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading and saving...
                </>
              ) : (
                <>
                  <FiCheck className="h-4 w-4" />
                  Update Product
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
