'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiCheck, FiChevronDown, FiPlus, FiTrash2 } from 'react-icons/fi';

type ProductForm = {
  name: string;
  description: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
  category: string;
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

const INITIAL_FORM: ProductForm = {
  name: '',
  description: '',
  regularPrice: '',
  salePrice: '',
  stock: '',
  category: '',
  isFeatured: false,
  showStockOnProductPage: false,
  hasVariations: false,
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

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variationImageUploading, setVariationImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [variations, setVariations] = useState<VariationForm[]>([{ name: '', isCustomType: false, options: [], optionImageMap: {}, optionStockMap: {}, customOptions: [], customInput: '', regularPrice: '', salePrice: '', stock: '' }]);
  const [variationPresets, setVariationPresets] = useState<VariationPresetsResponse>({ types: [], optionsByType: {} });
  const [toast, setToast] = useState<Toast | null>(null);

  const hasVariationPriceSet =
    form.hasVariations && variations.some(variation => variation.regularPrice.trim().length > 0 || variation.salePrice.trim().length > 0);

  const mainStockValue = form.stock.trim() !== '' ? Number(form.stock) : null;
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
    form.hasVariations &&
    mainStockValue !== null &&
    Number.isFinite(mainStockValue) &&
    totalVariationStock > mainStockValue;

  const totalVariationOptions = useMemo(
    () => variations.reduce((sum, variation) => sum + variation.options.length, 0),
    [variations]
  );

  const maxImagesAllowed = useMemo(
    () => Math.max(3, form.hasVariations ? totalVariationOptions : 0),
    [form.hasVariations, totalVariationOptions]
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3000);
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

  const canSubmit = useMemo(() => {
    const variationValid =
      !form.hasVariations ||
      variations.some(
        variation => variation.name && variation.options.length > 0 && variation.regularPrice.trim().length > 0
      );
    const hasBasePrice = form.regularPrice.trim().length > 0;

    return (
      form.name.trim().length > 0 &&
      form.description.trim().length > 0 &&
      pendingImages.length > 0 &&
      (hasBasePrice || hasVariationPriceSet) &&
      form.category.trim().length > 0 &&
      !uploading &&
      !variationImageUploading &&
      variationValid &&
      !isVariationStockOverMain
    );
  }, [form, pendingImages.length, uploading, variationImageUploading, variations, hasVariationPriceSet, isVariationStockOverMain]);

  const uploadImage = (file: File) => {
    setPendingImages(prev => {
      if (prev.length >= maxImagesAllowed) {
        setToast({ type: 'error', message: `Maximum of ${maxImagesAllowed} images allowed.` });
        return prev;
      }

      const duplicate = prev.some(
        image =>
          image.file.name === file.name &&
          image.file.size === file.size &&
          image.file.lastModified === file.lastModified
      );

      if (duplicate) {
        setToast({ type: 'error', message: 'This image is already selected.' });
        return prev;
      }

      const previewUrl = URL.createObjectURL(file);
      const next = [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, previewUrl }].slice(0, maxImagesAllowed);
      setToast({ type: 'success', message: 'Image selected. It will upload when you add the product.' });
      return next;
    });
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

  const createProduct = async () => {
    try {
      setSaving(true);
      setUploading(true);

      if (pendingImages.length === 0) {
        throw new Error('Please select at least one image.');
      }

      if (isVariationStockOverMain) {
        throw new Error('Variation stock total cannot exceed the main stock quantity.');
      }

      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < pendingImages.length; i += 1) {
        const image = pendingImages[i];
        setUploadProgress({ current: i + 1, total: pendingImages.length, fileName: image.file.name });
        const data = new FormData();
        data.append('file', image.file);

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

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          image: uploadedImageUrls[0],
          imageUrls: uploadedImageUrls,
          regularPrice: hasVariationPriceSet ? '' : form.regularPrice.trim(),
          salePrice: hasVariationPriceSet ? '' : form.salePrice.trim(),
          stock: form.stock.trim() !== '' ? Number(form.stock) : null,
          showStockOnProductPage: form.showStockOnProductPage,
          category: (selectedCategory === '__custom__' ? customCategory : form.category).trim(),
          hasVariations: form.hasVariations,
          isFeatured: form.isFeatured,
          variations: form.hasVariations
            ? variations
                .filter(variation => variation.name && variation.options.length > 0)
                .map(variation => ({
                  name: variation.name,
                  options: Array.from(new Set([...variation.options, ...variation.customOptions])),
                  optionImageMap: Object.fromEntries(
                    Object.entries(variation.optionImageMap || {})
                      .filter(([option, imageUrl]) => variation.options.includes(option) && Boolean(imageUrl?.trim()))
                      .map(([option, imageUrl]) => [option, imageUrl.trim()])
                  ),
                  optionStockMap: Object.fromEntries(
                    Object.entries(variation.optionStockMap || {})
                      .filter(([option, stockValue]) => variation.options.includes(option) && stockValue.trim() !== '')
                      .map(([option, stockValue]) => [option, Number(stockValue)])
                  ),
                  regularPrice: variation.regularPrice.trim(),
                  salePrice: variation.salePrice.trim(),
                  stock: variation.stock.trim() !== '' ? Number(variation.stock) : null,
                }))
            : [],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; details?: string };
        throw new Error(payload.error || payload.details || 'Failed to create product');
      }

      pendingImages.forEach(image => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);
      setToast({ type: 'success', message: 'Product created successfully.' });
      window.setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 600);
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to create product' });
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Add Product</h1>
          <p className="mt-0.5 text-sm text-gray-500 sm:text-base">Create a new product using the form below.</p>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ← Back
        </Link>
      </div>

      {/* Basic Information */}
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Basic Information</h2>
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 sm:text-base">
            Product Name
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
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
                    setForm(prev => ({ ...prev, category: customCategory }));
                  } else {
                    const chosen = categories.find(c => String(c.id) === value);
                    setForm(prev => ({ ...prev, category: chosen?.name || '' }));
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
                  setForm(prev => ({ ...prev, category: e.target.value }));
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
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Describe the product..."
              className={`${inputCls} resize-none`}
            />
          </label>
        </div>
      </div>

      {/* Pricing & Featured */}
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Pricing</h2>
          <label className="flex cursor-pointer items-center gap-2.5 self-start sm:self-auto">
            <div className="relative">
              <input
                type="checkbox"
                value="featured"
                checked={form.isFeatured ?? false}
                onChange={e => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="sr-only"
              />
              <div className={`h-6 w-11 rounded-full transition ${form.isFeatured ? 'bg-black' : 'bg-gray-200'}`} />
              <div
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.isFeatured ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 sm:text-base">
              {form.isFeatured ? 'Featured' : 'Not Featured'}
            </span>
          </label>
        </div>
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
              onChange={e => setForm(prev => ({ ...prev, regularPrice: e.target.value }))}
              placeholder="e.g. GH₵150"
              disabled={hasVariationPriceSet}
              className={`${inputCls} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700 sm:text-base">
            Sale Price
            <input
              value={form.salePrice}
              onChange={e => setForm(prev => ({ ...prev, salePrice: e.target.value }))}
              placeholder="Optional"
              disabled={hasVariationPriceSet}
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
              onChange={e => setForm(prev => ({ ...prev, stock: e.target.value }))}
              placeholder="Leave blank for unlimited"
              className={inputCls}
            />
          </label>
            <label className="mt-4 flex cursor-pointer items-start gap-3 sm:items-center">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.showStockOnProductPage}
                  onChange={e => setForm(prev => ({ ...prev, showStockOnProductPage: e.target.checked }))}
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
      </div>

      {/* Images */}
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Product Images</h2>
            <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">Add product images. First image is the main.</p>
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
            disabled={saving || pendingImages.length >= maxImagesAllowed}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <FiCamera className="h-4 w-4" />
            {pendingImages.length >= maxImagesAllowed ? 'Max reached' : 'Add Image'}
          </button>
        </div>
        <p className="text-xs text-gray-400">Image slots: {pendingImages.length}/{maxImagesAllowed}</p>
        {pendingImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pendingImages.map((image, i) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100">
                <Image src={image.previewUrl} alt={`Selected product ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(image.previewUrl);
                      setPendingImages(prev => prev.filter((_, idx) => idx !== i));
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
                onChange={e => setForm(prev => ({ ...prev, hasVariations: e.target.checked }))}
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
              <p className="rounded-lg border border-black bg-white px-3 py-2 text-xs font-medium text-black sm:text-sm">
                Variation prices active — base product prices are disabled.
              </p>
            )}
            {form.stock.trim() !== '' && (
              <p
                className={`rounded-lg border px-3 py-2 text-xs font-medium sm:text-sm ${
                  isVariationStockOverMain ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                Variation stock total: {totalVariationStock} / Main stock: {mainStockValue ?? 0}
              </p>
            )}
            {variations.map((variation, i) => (
              <div key={`variation-${i}`} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 sm:text-xs">Variation {i + 1}</p>
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariations(prev => prev.filter((_, idx) => idx !== i))}
                      className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-100 sm:text-xs"
                    >
                      <FiTrash2 className="mr-0.5 inline h-3 w-3" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-600 sm:text-xs">Variation Type</label>
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
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black cursor-pointer sm:text-base"
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
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black sm:text-base"
                      />
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-600 sm:text-xs">Options</label>
                    {variation.name ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                        {getSuggestedVariationOptions(variation.name, variation.customOptions).map(opt => (
                          <label key={opt} className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-gray-800">
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
                          <label key={opt} className="flex cursor-pointer select-none items-center gap-1.5 text-sm text-gray-800">
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
                        <div className="mt-1 flex w-full gap-2 border-t border-gray-100 pt-2">
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
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black sm:text-base"
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
                            className="rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40"
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
                            <span className="inline-flex items-center rounded-full border border-black bg-white px-2 py-0.5 text-[11px] font-semibold text-black sm:text-xs">
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
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black sm:text-base"
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
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black sm:text-base"
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
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black sm:text-base"
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

      {/* Save */}
      <div className="flex flex-col gap-3 rounded-[2rem] border-0 ring-1 ring-gray-200/50 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-gray-400 sm:mr-auto">
          {saving ? 'Uploading images and saving product...' : canSubmit ? 'Ready to save changes.' : 'Complete the required fields to save.'}
        </p>
        {saving && uploadProgress ? (
          <p className="text-xs font-semibold text-gray-500 sm:mr-2">
            Uploading image {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.fileName}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void createProduct()}
          disabled={saving || !canSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5 sm:text-base"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Adding...
            </>
          ) : (
            <>
              <FiCheck className="h-4 w-4" />
              Add Product
            </>
          )}
        </button>
      </div>
    </div>
  );
}
