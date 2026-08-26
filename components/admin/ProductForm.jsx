'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, X } from 'lucide-react';
import { COLLECTIONS, CATEGORIES, AUTHENTICITY_TAGS, getSizeGuideTemplate } from '@/lib/taxonomy';
import { saveProduct, previewPricing, getRecentProductsForStyle } from '@/lib/admin/products';
import { uploadProductImage } from '@/lib/admin/upload';
import { extractListing, extractSizeChart } from '@/lib/admin/clientExtract';
import { formatNGN } from '@/lib/format';

const csv = (arr) => (arr ?? []).join(', ');
const parseCsv = (str) =>
  str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export default function ProductForm({ initial }) {
  const router = useRouter();
  const isNew = !initial;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [importingListing, setImportingListing] = useState(false);
  const [importingSizeChart, setImportingSizeChart] = useState(false);

  const [slug, setSlug] = useState(initial?.slug || '');
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [longDescription, setLongDescription] = useState(initial?.long_description || '');
  const [collection, setCollection] = useState(initial?.collection || COLLECTIONS[0]);
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [tags, setTags] = useState(csv(initial?.tags));
  const [variants, setVariants] = useState(() => {
    if (initial?.variants?.length) {
      return initial.variants.map((v) => ({ color: v.color, sizes: csv(v.sizes) }));
    }
    return [{ color: '', sizes: '' }];
  });
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured || false);
  const [isNewArrival, setIsNewArrival] = useState(initial?.is_new_arrival || false);
  const [authenticityTag, setAuthenticityTag] = useState(initial?.authenticity_tag || '');
  const [published, setPublished] = useState(initial?.published ?? true);

  const [images, setImages] = useState(() => {
    if (!initial) return [];
    return [initial.image, ...(initial.gallery || [])].filter(Boolean);
  });

  const [supplierTitle, setSupplierTitle] = useState(initial?.supplier_title || '');
  const [supplierUrl, setSupplierUrl] = useState(initial?.supplier_url || '');
  const [priceMode, setPriceMode] = useState(initial?.supplier_price_ngn != null ? 'ngn' : 'cny');
  const [supplierPriceCny, setSupplierPriceCny] = useState(initial?.supplier_price_cny ?? '');
  const [supplierPriceNgn, setSupplierPriceNgn] = useState(initial?.supplier_price_ngn ?? '');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState(initial?.estimated_weight_kg ?? '');
  const [warehouseShippingCny, setWarehouseShippingCny] = useState(initial?.warehouse_shipping_cny ?? 0);
  const [serviceFeeCny, setServiceFeeCny] = useState(initial?.service_fee_cny ?? 0);

  const [sizeGuideUnit, setSizeGuideUnit] = useState(initial?.size_guide?.unit || 'cm');
  const [sizeGuideRows, setSizeGuideRows] = useState(() => {
    const map = {};
    (initial?.size_guide?.rows || []).forEach((r) => {
      map[r.size] = csv(r.values);
    });
    return map;
  });
  const [sizeChartImage, setSizeChartImage] = useState(initial?.size_chart_image || '');

  const [pricing, setPricing] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      previewPricing({
        supplierPriceCny: priceMode === 'cny' ? supplierPriceCny : 0,
        supplierPriceNgn: priceMode === 'ngn' ? supplierPriceNgn : null,
        estimatedWeightKg,
        warehouseShippingCny,
        serviceFeeCny,
      }).then(setPricing);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [priceMode, supplierPriceCny, supplierPriceNgn, estimatedWeightKg, warehouseShippingCny, serviceFeeCny]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSizeGuideRows({});
  }, [category]);

  function updateVariant(index, field, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }
  function addVariant() {
    setVariants((prev) => [...prev, { color: '', sizes: '' }]);
  }
  function removeVariant(index) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const allSizes = [...new Set(variants.flatMap((v) => parseCsv(v.sizes)))];
  const sizeGuideFields = getSizeGuideTemplate(category);

  async function handleWomataScreenshot(file) {
    if (!file) return;
    setImportingListing(true);
    setError('');
    try {
      const data = await extractListing(file);
      if (data.supplierTitle) setSupplierTitle(data.supplierTitle);
      if (data.supplierUrl) setSupplierUrl(data.supplierUrl);
      if (data.suggestedName) setName(data.suggestedName);
      if (data.suggestedCollection) setCollection(data.suggestedCollection);
      if (data.suggestedCategory) setCategory(data.suggestedCategory);
      if (data.priceCny != null) {
        setPriceMode('cny');
        setSupplierPriceCny(data.priceCny);
      } else if (data.priceNgn != null) {
        setPriceMode('ngn');
        setSupplierPriceNgn(data.priceNgn);
      }
      if (data.shortDescription) setDescription(data.shortDescription);
      if (data.longDescription) setLongDescription(data.longDescription);
      if (data.colors?.length) {
        const sizesCsv = csv(data.sizes || []);
        setVariants(data.colors.map((c) => ({ color: c, sizes: sizesCsv })));
      } else if (data.sizes?.length) {
        setVariants([{ color: '', sizes: csv(data.sizes) }]);
      }
      if (data.estimatedWeightKg != null) setEstimatedWeightKg(data.estimatedWeightKg);
    } catch (err) {
      setError(`Listing import failed: ${err.message}`);
    } finally {
      setImportingListing(false);
    }
  }

  async function handleSizeChartImage(file) {
    if (!file) return;
    setImportingSizeChart(true);
    setError('');
    try {
      const [extracted, uploadedUrl] = await Promise.all([
        extractSizeChart(file, category),
        uploadProductImage(file, 'size-charts'),
      ]);

      setSizeChartImage(uploadedUrl);
      setSizeGuideUnit(extracted.unit || 'cm');

      const map = {};
      (extracted.rows || []).forEach((r) => {
        const keptValues = (extracted.fields || [])
          .map((f, i) => (sizeGuideFields.includes(f) ? r.values[i] : undefined))
          .filter((v) => v !== undefined);
        map[r.size] = csv(keptValues);
      });
      setSizeGuideRows(map);

      if (extracted.rows?.length && variants.every((v) => !v.sizes.trim())) {
        const sizesCsv = csv(extracted.rows.map((r) => r.size));
        setVariants((prev) => prev.map((v, i) => (i === 0 ? { ...v, sizes: sizesCsv } : v)));
      }
    } catch (err) {
      setError(`Size chart import failed: ${err.message}`);
    } finally {
      setImportingSizeChart(false);
    }
  }

  async function handleImageUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProductImage(file, 'products'));
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Give it a name.');
    if (images.length === 0) return setError('Upload at least one product image.');

    const cleanVariants = variants
      .map((v) => ({ color: v.color.trim(), sizes: parseCsv(v.sizes) }))
      .filter((v) => v.color && v.sizes.length > 0);
    if (cleanVariants.length === 0) {
      return setError('Add at least one color with at least one size.');
    }

    const rows = sizeGuideFields.length
      ? allSizes
          .filter((s) => sizeGuideRows[s]?.trim())
          .map((s) => ({ size: s, values: parseCsv(sizeGuideRows[s]).map((v) => Number(v) || v) }))
      : [];

    const payload = {
      id: initial?.id,
      slug: slug.trim(),
      name,
      description,
      longDescription,
      collection,
      category,
      tags: parseCsv(tags),
      variants: cleanVariants,
      sizeGuide: rows.length ? { unit: sizeGuideUnit, fields: sizeGuideFields, rows } : null,
      sizeChartImage: sizeChartImage || null,
      image: images[0] || null,
      gallery: images.slice(1),
      isFeatured,
      isNewArrival,
      authenticityTag: authenticityTag || null,
      published,
      supplierTitle,
      supplierUrl,
      supplierPriceCny: priceMode === 'cny' ? Number(supplierPriceCny) || 0 : 0,
      supplierPriceNgn: priceMode === 'ngn' ? supplierPriceNgn : '',
      estimatedWeightKg: Number(estimatedWeightKg) || 0,
      warehouseShippingCny: Number(warehouseShippingCny) || 0,
      serviceFeeCny: Number(serviceFeeCny) || 0,
    };

    startTransition(async () => {
      try {
        await saveProduct(payload);
        router.push('/admin');
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  const inputClass =
    'mt-2 w-full border border-line bg-panel px-4 py-2.5 text-sm text-bone placeholder:text-mute focus:border-bone';
  const labelClass = 'text-xs uppercase tracking-wide text-mute';

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <h2 className="font-display text-lg">Product</h2>

        {isNew && (
          <div className="border border-line bg-panel p-4">
            <p className={labelClass}>Quick Import</p>
            <p className="mt-1 text-xs text-mute">Upload screenshots to auto-fill this form.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-line px-4 py-6 text-center">
                <UploadCloud size={18} className="text-bone" />
                <span className="text-xs text-mute">
                  {importingListing ? 'Reading…' : 'Womata Screenshot'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleWomataScreenshot(e.target.files?.[0])}
                />
              </label>
              <label className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-line px-4 py-6 text-center">
                <UploadCloud size={18} className="text-bone" />
                <span className="text-xs text-mute">
                  {importingSizeChart ? 'Reading…' : 'Size Chart'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSizeChartImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>NPC Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>URL slug (leave blank to auto-generate)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Short Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Long Description (optional)</label>
          <textarea
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Collection</label>
            <select value={collection} onChange={(e) => setCollection(e.target.value)} className={inputClass}>
              {COLLECTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Tags (comma-separated — used by search)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="streetwear, y2k" />
        </div>

        <div className="border border-line p-4">
          <p className={labelClass}>Colors &amp; Sizes</p>
          <p className="mt-1 text-xs text-mute">
            Each color has its own size list — customers pick a color first, then choose
            from that color's available sizes.
          </p>
          <div className="mt-4 space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={v.color}
                  onChange={(e) => updateVariant(i, 'color', e.target.value)}
                  placeholder="Color, e.g. Black"
                  className="w-1/3 border border-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-mute focus:border-bone"
                />
                <input
                  value={v.sizes}
                  onChange={(e) => updateVariant(i, 'sizes', e.target.value)}
                  placeholder="Sizes for this color, e.g. S, M, L, XL"
                  className="flex-1 border border-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-mute focus:border-bone"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  disabled={variants.length === 1}
                  className="shrink-0 p-2 text-mute hover:text-bone disabled:opacity-30"
                  aria-label="Remove color"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="mt-3 text-xs text-bone underline underline-offset-2"
          >
            + Add another color
          </button>
        </div>

        <div className="border border-line p-4">
          <p className={labelClass}>Standardized Size Guide {importingSizeChart && <span className="text-bone">(reading chart…)</span>}</p>

          {sizeGuideFields.length === 0 ? (
            <p className="mt-2 text-xs text-mute">
              {category} doesn't use a standardized size guide — nothing to fill in here.
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-mute">
                Auto-selected for <span className="text-bone">{category}</span>: {sizeGuideFields.join(', ')}.
                Upload the supplier's chart above under "Size Chart" and it'll auto-fill the values below.
              </p>

              <div className="mt-4">
                <label className="text-xs text-mute">Unit</label>
                <input
                  value={sizeGuideUnit}
                  onChange={(e) => setSizeGuideUnit(e.target.value)}
                  className={`${inputClass} w-24`}
                  placeholder="cm"
                />
              </div>

              {allSizes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-mute">
                    <span className="w-10 shrink-0">Size</span>
                    <span className="flex-1">{sizeGuideFields.join(' , ')} (in that order)</span>
                  </div>
                  {allSizes.map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-xs text-mute">{s}</span>
                      <input
                        value={sizeGuideRows[s] || ''}
                        onChange={(e) => setSizeGuideRows((prev) => ({ ...prev, [s]: e.target.value }))}
                        placeholder={sizeGuideFields.map(() => '—').join(', ')}
                        className="w-full border border-line bg-panel px-3 py-1.5 text-sm text-bone focus:border-bone"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {sizeChartImage && (
            <div className="mt-4">
              <p className="text-xs text-mute">Original supplier chart (internal reference only):</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sizeChartImage} alt="" className="mt-2 h-28 border border-line object-contain" />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Product Images</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((src, i) => (
              <div key={src + i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-24 w-20 border border-line object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 bg-bone px-1 text-[9px] text-black">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 border border-line bg-black p-1 text-bone"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-panel text-center">
              <UploadCloud size={16} className="text-bone" />
              <span className="text-[10px] text-mute">{uploading ? 'Uploading…' : 'Add'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Authenticity Label (optional)</label>
          <select
            value={authenticityTag}
            onChange={(e) => setAuthenticityTag(e.target.value)}
            className={inputClass}
          >
            <option value="">None</option>
            {AUTHENTICITY_TAGS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.value} — {t.description}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} />
            New Arrival
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-display text-lg">Sourcing &amp; Pricing</h2>

        <div>
          <label className={labelClass}>Supplier Title (internal only, never shown)</label>
          <input value={supplierTitle} onChange={(e) => setSupplierTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Supplier / Womata Link (internal only)</label>
          <input value={supplierUrl} onChange={(e) => setSupplierUrl(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Purchase price is in</label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setPriceMode('cny')}
              className={`flex-1 border px-4 py-2 text-sm ${priceMode === 'cny' ? 'border-bone bg-bone text-black' : 'border-line text-bone'}`}
            >
              CNY / RMB (1688)
            </button>
            <button
              type="button"
              onClick={() => setPriceMode('ngn')}
              className={`flex-1 border px-4 py-2 text-sm ${priceMode === 'ngn' ? 'border-bone bg-bone text-black' : 'border-line text-bone'}`}
            >
              Already in ₦ (Womata)
            </button>
          </div>
        </div>

        {priceMode === 'cny' ? (
          <div>
            <label className={labelClass}>Supplier Price (CNY)</label>
            <input
              type="number"
              step="0.01"
              value={supplierPriceCny}
              onChange={(e) => setSupplierPriceCny(e.target.value)}
              className={inputClass}
            />
          </div>
        ) : (
          <div>
            <label className={labelClass}>Purchase Price (₦)</label>
            <input
              type="number"
              step="1"
              value={supplierPriceNgn}
              onChange={(e) => setSupplierPriceNgn(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={estimatedWeightKg}
              onChange={(e) => setEstimatedWeightKg(e.target.value)}
              className={inputClass}
            />
          </div>
          {priceMode === 'cny' && (
            <div>
              <label className={labelClass}>Warehouse Ship. (CNY)</label>
              <input
                type="number"
                step="0.01"
                value={warehouseShippingCny}
                onChange={(e) => setWarehouseShippingCny(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {priceMode === 'cny' && (
          <div>
            <label className={labelClass}>Service Fee (CNY)</label>
            <input
              type="number"
              step="0.01"
              value={serviceFeeCny}
              onChange={(e) => setServiceFeeCny(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-wide text-mute">Pricing Preview</p>
          {pricing ? (
            <div className="mt-3 space-y-1.5 font-mono text-sm">
              <div className="flex justify-between text-fog">
                <span>Landed Cost</span>
                <span>{formatNGN(pricing.landedCost)}</span>
              </div>
              <div className="flex justify-between text-lg text-bone">
                <span>Retail Price</span>
                <span>{formatNGN(pricing.npcSellingPrice)}</span>
              </div>
              <div className="flex justify-between text-fog">
                <span>Profit</span>
                <span>{formatNGN(pricing.expectedProfit)}</span>
              </div>
              <div className="flex justify-between text-fog">
                <span>Margin</span>
                <span>{(pricing.profitMargin * 100).toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-mute">Enter a price and weight to see the calculation.</p>
          )}
        </div>

        {error && <p className="text-sm text-fog">{error}</p>}

        <button
          type="submit"
          disabled={isPending || uploading}
          className="w-full rounded-full bg-bone py-3.5 text-sm font-medium text-black disabled:opacity-60"
        >
          {uploading ? 'Uploading image…' : isPending ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
