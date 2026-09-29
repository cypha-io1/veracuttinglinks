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
  const [toast, setToast] = useState<Toast | null>(null);
  const maxImagesAllowed = 3;
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



  const canSubmit = useMemo(() => {
    const hasBasePrice = form.regularPrice.trim().length > 0;

    return (
      form.name.trim().length > 0 &&
      pendingImages.length > 0 &&
      hasBasePrice &&
      form.category.trim().length > 0 &&
      !uploading
    );
  }, [form, pendingImages.length, uploading]);

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



  const createProduct = async () => {
    try {
      setSaving(true);
      setUploading(true);

      if (pendingImages.length === 0) {
        throw new Error('Please select at least one image.');
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
          regularPrice: form.regularPrice.trim(),
          category: (selectedCategory === '__custom__' ? customCategory : form.category).trim(),
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

        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-[2rem] border-0 bg-white p-6 shadow-sm ring-1 ring-gray-200/50 sm:p-8 relative overflow-hidden">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-1">
          <label className="block text-sm font-semibold text-gray-700 sm:text-base">
            Price
            <input
              value={form.regularPrice}
              onChange={e => setForm(prev => ({ ...prev, regularPrice: e.target.value }))}
              placeholder="e.g. GH₵150"
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
