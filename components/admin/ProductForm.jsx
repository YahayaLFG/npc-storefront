'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, X, Sparkles, Loader2 } from 'lucide-react';
import { COLLECTIONS, CATEGORIES, STANDARD_SIZE_FIELDS, getSizeGuideTemplate } from '@/lib/taxonomy';
import { saveProduct, previewPricing } from '@/lib/admin/products';
import { uploadProductImage } from '@/lib/admin/upload';
import { extractListing, extractSizeChart } from '@/lib/admin/clientExtract';
import { generateId } from '@/lib/generateId';
import { formatNGN } from '@/lib/format';

const csv = (arr) => (arr ?? []).join(', ');
const parseCsv = (str) =>
  (str ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function buildInitialVariants(initial) {
  if (initial?.variants_relational?.length) {
    return initial.variants_relational.map((v) => ({
      clientId: v.id,
      id: v.id,
      color: v.color,
      sizes: csv(v.sizes),
      images: v.images || [],
      isActive: v.is_active !== false,
      sizeGuideClientIds: v.size_guide_ids || [],
    }));
  }
  return [{ clientId: generateId(), id: null, color: '', sizes: '', images: [], isActive: true, sizeGuideClientIds: [] }];
}

function buildInitialSizeGuides(initial) {
  if (initial?.size_guides_relational?.length) {
    return initial.size_guides_relational.map((g) => {
      const rows = {};
      (g.rows || []).forEach((r) => {
        rows[r.size] = csv(r.values);
      });
      return {
        clientId: g.id,
        id: g.id,
        name: g.name,
        unit: g.unit,
        fields: g.fields || [],
        rows,
        chartImage: g.chart_image || '',
      };
    });
  }
  return [];
}

export default function ProductForm({ initial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const isNew = !initial;

  const [importingListing, setImportingListing] = useState(false);
  const [importingSizeChart, setImportingSizeChart] = useState(false);
  const [importNotice, setImportNotice] = useState('');

  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [longDescription, setLongDescription] = useState(initial?.long_description || '');
  const [collection, setCollection] = useState(initial?.collection || COLLECTIONS[0]);
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [tags, setTags] = useState(csv(initial?.tags));
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured || false);
  const [isNewArrival, setIsNewArrival] = useState(initial?.is_new_arrival || false);
  const [published, setPublished] = useState(initial?.published ?? true);

  const [images, setImages] = useState(() =>
    [initial?.image, ...(initial?.gallery || [])].filter(Boolean)
  );

  const [supplierTitle, setSupplierTitle] = useState(initial?.supplier_title || '');
  const [supplierUrl, setSupplierUrl] = useState(initial?.supplier_url || '');
  const [priceMode, setPriceMode] = useState(initial?.supplier_price_ngn != null ? 'ngn' : 'cny');
  const [supplierPriceCny, setSupplierPriceCny] = useState(initial?.supplier_price_cny ?? '');
  const [supplierPriceNgn, setSupplierPriceNgn] = useState(initial?.supplier_price_ngn ?? '');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState(initial?.estimated_weight_kg ?? '');
  const [warehouseShippingCny, setWarehouseShippingCny] = useState(initial?.warehouse_shipping_cny ?? 0);
  const [serviceFeeCny, setServiceFeeCny] = useState(initial?.service_fee_cny ?? 0);

  const [variants, setVariants] = useState(() => buildInitialVariants(initial));
  const [sizeGuides, setSizeGuides] = useState(() => buildInitialSizeGuides(initial));

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

  function updateVariant(index, field, value) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }
  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { clientId: generateId(), id: null, color: '', sizes: '', images: [], isActive: true, sizeGuideClientIds: [] },
    ]);
  }
  function removeVariant(index) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }
  function toggleVariantGuide(index, guideClientId) {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        const has = v.sizeGuideClientIds.includes(guideClientId);
        return {
          ...v,
          sizeGuideClientIds: has
            ? v.sizeGuideClientIds.filter((id) => id !== guideClientId)
            : [...v.sizeGuideClientIds, guideClientId],
        };
      })
    );
  }
  async function handleVariantImages(index, files) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProductImage(file, 'variants'));
      }
      setVariants((prev) =>
        prev.map((v, i) => (i === index ? { ...v, images: [...v.images, ...uploaded] } : v))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }
  function removeVariantImage(variantIndex, imageIndex) {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, images: v.images.filter((_, idx) => idx !== imageIndex) } : v
      )
    );
  }

  function addSizeGuide() {
    setSizeGuides((prev) => [
      ...prev,
      {
        clientId: generateId(),
        id: null,
        name: '',
        unit: 'cm',
        fields: getSizeGuideTemplate(category),
        rows: {},
        chartImage: '',
      },
    ]);
  }
  function updateSizeGuide(index, field, value) {
    setSizeGuides((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }
  function removeSizeGuide(index) {
    const guide = sizeGuides[index];
    setSizeGuides((prev) => prev.filter((_, i) => i !== index));
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        sizeGuideClientIds: v.sizeGuideClientIds.filter((id) => id !== guide.clientId),
      }))
    );
  }
  function toggleSizeGuideField(index, field) {
    setSizeGuides((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const has = g.fields.includes(field);
        return { ...g, fields: has ? g.fields.filter((f) => f !== field) : [...g.fields, field] };
      })
    );
  }
  function relevantSizesForGuide(guideClientId) {
    return [
      ...new Set(
        variants
          .filter((v) => v.sizeGuideClientIds.includes(guideClientId))
          .flatMap((v) => parseCsv(v.sizes))
      ),
    ];
  }
  function variantNamesForGuide(guideClientId) {
    return variants.filter((v) => v.sizeGuideClientIds.includes(guideClientId)).map((v) => v.color).filter(Boolean);
  }

  async function handleWomataScreenshot(file) {
    if (!file) return;
    setImportingListing(true);
    setError('');
    setImportNotice('');
    try {
      const data = await extractListing(file);

      if (data.supplierTitle) setSupplierTitle(data.supplierTitle);
      if (data.suggestedName) setName(data.suggestedName);
      if (data.suggestedSlug) setSlug(data.suggestedSlug);
      if (data.shortDescription) setDescription(data.shortDescription);
      if (data.longDescription) setLongDescription(data.longDescription);
      if (data.colors?.length) {
        const sizesCsv = csv(data.sizes || []);
        setVariants(
          data.colors.map((c) => ({
            clientId: generateId(),
            id: null,
            color: c,
            sizes: sizesCsv,
            images: [],
            isActive: true,
            sizeGuideClientIds: [],
          }))
        );
      } else if (data.sizes?.length) {
        setVariants([
          { clientId: generateId(), id: null, color: '', sizes: csv(data.sizes), images: [], isActive: true, sizeGuideClientIds: [] },
        ]);
      }
      if (data.estimatedWeightKg != null) setEstimatedWeightKg(data.estimatedWeightKg);
      if (COLLECTIONS.includes(data.suggestedCollection)) setCollection(data.suggestedCollection);
      if (CATEGORIES.includes(data.suggestedCategory)) setCategory(data.suggestedCategory);

      if (data.supplierPrice != null) {
        if (data.currency === 'NGN') {
          setPriceMode('ngn');
          setSupplierPriceNgn(data.supplierPrice);
        } else {
          setPriceMode('cny');
          setSupplierPriceCny(data.supplierPrice);
        }
      }

      setImportNotice('Draft filled in below — check it over, adjust the name if you like, then Publish.');
    } catch (err) {
      setError(`Screenshot import failed: ${err.message}`);
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

      const rows = {};
      (extracted.rows || []).forEach((r) => {
        rows[r.size] = csv(r.values);
      });

      const newGuideClientId = generateId();
      const baseName = category || 'Guide';
      const nameTaken = sizeGuides.some((g) => g.name.trim().toLowerCase() === baseName.toLowerCase());
      const guideName = nameTaken ? `${baseName} ${sizeGuides.length + 1}` : baseName;

      setSizeGuides((prev) => [
        ...prev,
        {
          clientId: newGuideClientId,
          id: null,
          name: guideName,
          unit: extracted.unit || 'cm',
          fields: extracted.fields || getSizeGuideTemplate(category),
          rows,
          chartImage: uploadedUrl,
        },
      ]);

      setVariants((prev) =>
        prev.map((v) =>
          v.sizeGuideClientIds.length === 0
            ? { ...v, sizeGuideClientIds: [newGuideClientId] }
            : v
        )
      );

      if (extracted.rows?.length) {
        const sizesCsv = csv(extracted.rows.map((r) => r.size));
        setVariants((prev) => prev.map((v) => (v.sizes.trim() ? v : { ...v, sizes: sizesCsv })));
      }
    } catch (err) {
      setError(`Size chart import failed: ${err.message}`);
    } finally {
      setImportingSizeChart(false);
    }
  }

  async function handleProductImages(files) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProductImage(file, images.length === 0 ? 'main' : 'gallery'));
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }
  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Give it a name.');
    if (images.length === 0) return setError('Upload at least one product image.');

    const cleanVariants = variants
      .map((v) => ({ ...v, color: v.color.trim(), sizes: parseCsv(v.sizes) }))
      .filter((v) => v.color && v.sizes.length > 0);
    if (cleanVariants.length === 0) {
      return setError('Add at least one color with at least one size.');
    }

    for (const g of sizeGuides) {
      if (!g.name.trim()) return setError('Every size guide needs a name (e.g. "Shirt", "Pants").');
    }

    const guidePayload = sizeGuides.map((g, i) => {
      const relevantSizes = relevantSizesForGuide(g.clientId);
      const rows = g.fields.length
        ? relevantSizes
            .filter((s) => g.rows[s]?.trim())
            .map((s) => ({ size: s, values: parseCsv(g.rows[s]).map((v) => Number(v) || v) }))
        : [];
      return {
        id: g.id,
        clientId: g.clientId,
        name: g.name.trim(),
        unit: g.unit,
        fields: g.fields,
        rows,
        chartImage: g.chartImage || null,
        position: i,
      };
    });

    const variantPayload = cleanVariants.map((v) => ({
      id: v.id,
      clientId: v.clientId,
      color: v.color,
      sizes: v.sizes,
      images: v.images,
      isActive: v.isActive,
      sizeGuideClientIds: v.sizeGuideClientIds,
    }));

    const payload = {
      id: initial?.id,
      slug: slug.trim(),
      name,
      description,
      longDescription,
      collection,
      category,
      tags: parseCsv(tags),
      variants: variantPayload,
      sizeGuides: guidePayload,
      image: images[0] || null,
      gallery: images.slice(1),
      isFeatured,
      isNewArrival,
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
    <form onSubmit={handleSubmit} className="space-y-10">
      {isNew && (
        <div className="border border-line bg-panel p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-bone" />
            <h2 className="font-display text-lg">Quick Import</h2>
          </div>
          <p className="mt-1 text-xs text-mute">
            Upload a Womata screenshot to auto-fill a complete draft below — name, both
            descriptions, category, pricing, and more. Review it, adjust the name if you like, then Publish.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-bone">1. Womata Screenshot <span className="text-mute">(required)</span></p>
              <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-line bg-black/30 text-center">
                {importingListing ? (
                  <Loader2 size={18} className="animate-spin text-bone" />
                ) : (
                  <UploadCloud size={18} className="text-bone" />
                )}
                <span className="text-[11px] text-mute px-2">
                  {importingListing ? 'Reading listing…' : 'Tap to upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={importingListing}
                  onChange={(e) => handleWomataScreenshot(e.target.files?.[0])}
                />
              </label>
            </div>

            <div>
              <p className="text-xs font-medium text-bone">2. Size Chart <span className="text-mute">(optional)</span></p>
              <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-line bg-black/30 text-center">
                {importingSizeChart ? (
                  <Loader2 size={18} className="animate-spin text-bone" />
                ) : (
                  <UploadCloud size={18} className="text-bone" />
                )}
                <span className="text-[11px] text-mute px-2">
                  {importingSizeChart ? 'Reading chart…' : 'Tap to upload'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={importingSizeChart}
                  onChange={(e) => handleSizeChartImage(e.target.files?.[0])}
                />
              </label>
              <p className="mt-1 text-[10px] text-mute">Creates a new size guide, linked to any color without one yet.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-bone">3. Product Images <span className="text-mute">(3–6, required)</span></p>
              <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-line bg-black/30 text-center">
                <UploadCloud size={18} className="text-bone" />
                <span className="text-[11px] text-mute px-2">Tap to upload (multiple)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleProductImages(e.target.files)}
                />
              </label>
            </div>
          </div>

          {importNotice && <p className="mt-4 text-xs text-bone">{importNotice}</p>}
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <h2 className="font-display text-lg">Product</h2>

          <div>
            <label className={labelClass}>NPC Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>URL Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
              placeholder="auto-generated from name if left blank"
            />
          </div>

          <div>
            <label className={labelClass}>Short Description (shown near the price)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Long Description (shown in Product Details)</label>
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
              Each color has its own size list and its own photos. If a color has no photos of
              its own, the product-level gallery below is shown instead.
            </p>
            <div className="mt-4 space-y-4">
              {variants.map((v, i) => (
                <div key={v.clientId} className="border border-line p-3">
                  <div className="flex items-center gap-2">
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.images.map((src, imgIdx) => (
                      <div key={src + imgIdx} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-16 w-14 border border-line object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(i, imgIdx)}
                          className="absolute -right-1.5 -top-1.5 border border-line bg-black p-0.5 text-bone"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="flex h-16 w-14 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-panel text-center">
                      <UploadCloud size={13} className="text-bone" />
                      <span className="text-[9px] text-mute">Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleVariantImages(i, e.target.files)}
                      />
                    </label>
                  </div>

                  {sizeGuides.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] uppercase tracking-wide text-mute">Size guide(s) for this color</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {sizeGuides.map((g) => (
                          <button
                            key={g.clientId}
                            type="button"
                            onClick={() => toggleVariantGuide(i, g.clientId)}
                            className={`border px-2.5 py-1 text-xs ${
                              v.sizeGuideClientIds.includes(g.clientId)
                                ? 'border-bone bg-bone text-black'
                                : 'border-line text-mute'
                            }`}
                          >
                            {g.name || 'Untitled'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
            <p className={labelClass}>Size Guides {importingSizeChart && <span className="text-bone">(reading chart…)</span>}</p>
            <p className="mt-1 text-xs text-mute">
              Create one guide per measurement type — "Shirt", "Pants" — and assign each to
              whichever colors above actually need it. The same guide is reused, never duplicated.
            </p>

            <div className="mt-4 space-y-4">
              {sizeGuides.map((g, i) => {
                const relevantSizes = relevantSizesForGuide(g.clientId);
                const usedBy = variantNamesForGuide(g.clientId);
                return (
                  <div key={g.clientId} className="border border-line p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={g.name}
                        onChange={(e) => updateSizeGuide(i, 'name', e.target.value)}
                        placeholder='Guide name, e.g. "Shirt"'
                        className="flex-1 border border-line bg-panel px-3 py-2 text-sm text-bone placeholder:text-mute focus:border-bone"
                      />
                      <input
                        value={g.unit}
                        onChange={(e) => updateSizeGuide(i, 'unit', e.target.value)}
                        placeholder="cm"
                        className="w-16 border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
                      />
                      <button
                        type="button"
                        onClick={() => removeSizeGuide(i)}
                        className="shrink-0 p-2 text-mute hover:text-bone"
                        aria-label="Remove size guide"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <p className="mt-2 text-[10px] text-mute">
                      {usedBy.length > 0 ? `Used by: ${usedBy.join(', ')}` : 'Not assigned to any color yet.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STANDARD_SIZE_FIELDS.map((field) => (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleSizeGuideField(i, field)}
                          className={`border px-2.5 py-1 text-xs ${
                            g.fields.includes(field) ? 'border-bone bg-bone text-black' : 'border-line text-mute'
                          }`}
                        >
                          {field}
                        </button>
                      ))}
                    </div>

                    {relevantSizes.length > 0 && g.fields.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wide text-mute">
                          <span className="w-10 shrink-0">Size</span>
                          <span className="flex-1">{g.fields.join(' , ')} (in that order)</span>
                        </div>
                        {relevantSizes.map((s) => (
                          <div key={s} className="flex items-center gap-3">
                            <span className="w-10 shrink-0 font-mono text-xs text-mute">{s}</span>
                            <input
                              value={g.rows[s] || ''}
                              onChange={(e) =>
                                updateSizeGuide(i, 'rows', { ...g.rows, [s]: e.target.value })
                              }
                              placeholder={g.fields.map(() => '—').join(', ')}
                              className="w-full border border-line bg-panel px-3 py-1.5 text-sm text-bone focus:border-bone"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {g.chartImage && (
                      <div className="mt-3">
                        <p className="text-[10px] text-mute">Original supplier chart (internal reference only):</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.chartImage} alt="" className="mt-1 h-24 border border-line object-contain" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addSizeGuide}
              className="mt-3 text-xs text-bone underline underline-offset-2"
            >
              + Add Size Guide
            </button>
          </div>

          <div>
            <label className={labelClass}>Product Images (fallback gallery — first = main image)</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={src + i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-24 w-20 border border-line object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/80 py-0.5 text-center text-[9px] uppercase tracking-wide text-bone">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -right-2 -top-2 border border-line bg-black p-1 text-bone"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-panel text-center">
                <UploadCloud size={16} className="text-bone" />
                <span className="text-[10px] text-mute">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleProductImages(e.target.files)}
                />
              </label>
            </div>
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
      </div>
    </form>
  );
}
