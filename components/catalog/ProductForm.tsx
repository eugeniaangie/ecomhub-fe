'use client';

import { useEffect, useState } from 'react';
import { masterCategoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MasterCategory } from '@/lib/types';
import type {
  ProductDetail,
  ProductForm as ProductFormBody,
  ProductOptionInput,
  ProductStatus,
  ProductVariantInput,
} from '@/lib/types/product';
import type { ProductCopySeed } from '@/lib/utils/productCopy';
import { variantOptionLabels } from '@/lib/utils/productLabels';

export type ProductFormSkuUpdate = { variantId: number; sku: string };

export interface ProductFormProps {
  mode: 'create' | 'edit';
  initial?: ProductDetail | null;
  /** FE45 — create prefill from copy (no option/variant ids; SKUs empty). */
  copySeed?: ProductCopySeed | null;
  copySourceName?: string;
  isSubmitting?: boolean;
  error?: string;
  cancelLabel?: string;
  submitLabel?: string;
  onSubmit: (
    body: ProductFormBody,
    extras: { skuUpdates: ProductFormSkuUpdate[] }
  ) => void | Promise<void>;
  onCancel: () => void;
}

type OptionDraft = {
  /** Existing option id when editing. */
  id?: number;
  option_name: string;
  values: { id?: number; option_value: string }[];
};

type VariantDraft = {
  sku: string;
  /** Parallel to options — one value text per option axis. */
  option_values: string[];
};

function emptyOption(): OptionDraft {
  return { option_name: '', values: [{ option_value: '' }] };
}

function fromDetail(detail: ProductDetail): {
  name: string;
  code: string;
  description: string;
  brand: string;
  category_id: string;
  status: ProductStatus;
  weight_kg: string;
  package_length_cm: string;
  package_width_cm: string;
  package_height_cm: string;
  options: OptionDraft[];
} {
  return {
    name: detail.name ?? '',
    code: detail.code ?? '',
    description: detail.description ?? '',
    brand: detail.brand ?? '',
    category_id: detail.category_id != null ? String(detail.category_id) : '',
    status: (detail.status as ProductStatus) || 'draft',
    weight_kg: detail.weight_kg != null ? String(detail.weight_kg) : '',
    package_length_cm:
      detail.package_length_cm != null ? String(detail.package_length_cm) : '',
    package_width_cm:
      detail.package_width_cm != null ? String(detail.package_width_cm) : '',
    package_height_cm:
      detail.package_height_cm != null ? String(detail.package_height_cm) : '',
    options: (detail.options ?? []).map((o) => ({
      id: o.id,
      option_name: o.option_name,
      values: (o.values ?? []).map((v) => ({
        id: v.id,
        option_value: v.option_value,
      })),
    })),
  };
}

export function ProductForm({
  mode,
  initial,
  copySeed = null,
  copySourceName,
  isSubmitting = false,
  error = '',
  cancelLabel = 'Cancel',
  submitLabel,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const seed =
    mode === 'create' && copySeed
      ? {
          name: copySeed.name,
          code: copySeed.code,
          description: copySeed.description,
          brand: copySeed.brand,
          category_id: copySeed.category_id,
          status: copySeed.status as ProductStatus,
          weight_kg: copySeed.weight_kg,
          package_length_cm: copySeed.package_length_cm,
          package_width_cm: copySeed.package_width_cm,
          package_height_cm: copySeed.package_height_cm,
          options: copySeed.options.map((o) => ({
            option_name: o.option_name,
            values: o.values.map((v) => ({ option_value: v.option_value })),
          })),
        }
      : initial
        ? fromDetail(initial)
        : null;
  const [name, setProductName] = useState(seed?.name ?? '');
  const [code, setProductCode] = useState(seed?.code ?? '');
  const [description, setDescription] = useState(seed?.description ?? '');
  const [brand, setBrand] = useState(seed?.brand ?? '');
  const [categoryId, setCategoryId] = useState(seed?.category_id ?? '');
  const [status, setStatus] = useState<ProductStatus>(seed?.status ?? 'draft');
  const [weightKg, setWeightKg] = useState(seed?.weight_kg ?? '');
  const [pkgL, setPkgL] = useState(seed?.package_length_cm ?? '');
  const [pkgW, setPkgW] = useState(seed?.package_width_cm ?? '');
  const [pkgH, setPkgH] = useState(seed?.package_height_cm ?? '');
  const [options, setOptions] = useState<OptionDraft[]>(seed?.options ?? []);
  const [newVariants, setNewVariants] = useState<VariantDraft[]>(() =>
    mode === 'create' && copySeed
      ? copySeed.variants.map((v) => ({
          sku: v.sku,
          option_values: [...v.option_values],
        }))
      : []
  );
  const [skuEdits, setSkuEdits] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const v of initial?.variants ?? []) map[v.id] = v.sku;
    return map;
  });
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await masterCategoryApi.getAll(1, 100);
        if (!cancelled) setCategories(res?.results ?? []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const optionCount = options.length;

  const buildBody = (): ProductFormBody | null => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError('Product name is required.');
      return null;
    }

    const optionInputs: ProductOptionInput[] = [];
    for (const opt of options) {
      const optionName = opt.option_name.trim();
      if (!optionName) {
        setLocalError('Each option needs a name, or remove the empty option.');
        return null;
      }
      const values = opt.values
        .map((v) => ({
          id: v.id,
          option_value: v.option_value.trim(),
        }))
        .filter((v) => v.option_value || v.id != null);
      if (values.length === 0) {
        setLocalError(`Option "${optionName}" needs at least one value.`);
        return null;
      }
      for (const v of values) {
        if (!v.option_value) {
          setLocalError(`Option "${optionName}" has an empty value.`);
          return null;
        }
      }
      optionInputs.push({
        ...(opt.id != null ? { id: opt.id } : {}),
        option_name: optionName,
        values: values.map((v) => ({
          ...(v.id != null ? { id: v.id } : {}),
          option_value: v.option_value,
        })),
      });
    }

    const variantInputs: ProductVariantInput[] = [];
    for (const v of newVariants) {
      const texts = v.option_values.map((t) => t.trim());
      if (optionCount > 0) {
        if (texts.length !== optionCount || texts.some((t) => !t)) {
          setLocalError(
            'Each new variant needs one value per option (in option order).'
          );
          return null;
        }
      }
      const sku = v.sku.trim();
      variantInputs.push({
        ...(sku ? { sku } : {}),
        ...(texts.length ? { option_values: texts } : {}),
      });
    }

    const optionalInt = (raw: string): number | null => {
      const t = raw.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    };
    const optionalFloat = (raw: string): number | null => {
      const t = raw.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };

    setLocalError('');
    return {
      name: trimmedName,
      code: code.trim() || null,
      description: description.trim() || null,
      brand: brand.trim() || null,
      category_id: categoryId ? Number(categoryId) : null,
      status,
      weight_kg: optionalFloat(weightKg),
      package_length_cm: optionalInt(pkgL),
      package_width_cm: optionalInt(pkgW),
      package_height_cm: optionalInt(pkgH),
      options: optionInputs,
      variants: variantInputs,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = buildBody();
    if (!body) return;

    const skuUpdates: ProductFormSkuUpdate[] = [];
    for (const v of initial?.variants ?? []) {
      const next = (skuEdits[v.id] ?? '').trim();
      if (!next) {
        setLocalError('Each existing variant needs a SKU.');
        return;
      }
      if (next !== v.sku) {
        skuUpdates.push({ variantId: v.id, sku: next });
      }
    }

    await onSubmit(body, { skuUpdates });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || localError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || localError}
        </div>
      )}

      {mode === 'create' && copySeed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Copying
          {copySourceName ? (
            <>
              {' '}
              from <span className="font-medium">{copySourceName}</span>
            </>
          ) : null}
          . Channel listings are not copied. Images are not copied — upload
          them on the new product after save. SKUs and product code start
          empty so Core can generate unique values.
        </div>
      )}

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Basics</h2>
        <Input
          label="Product name *"
          value={name}
          onChange={(e) => setProductName(e.target.value)}
          required
          maxLength={255}
          placeholder="e.g. Cotton T-Shirt Unisex"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Product code"
            value={code}
            onChange={(e) => setProductCode(e.target.value)}
            maxLength={255}
            placeholder="Optional; e.g. TEE-001 (A–Z, 0–9, -)"
          />
          <Input
            label="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={255}
            placeholder="Optional; e.g. No Brand"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            placeholder="Optional; product description for the listing"
          />
          <p className="mt-1 text-xs text-gray-500">
            Drag the corner to resize if the description is long.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Input
            label="Weight (kg)"
            type="number"
            step="any"
            min={0}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Optional; e.g. 0.25"
          />
          <Input
            label="Length (cm)"
            type="number"
            min={1}
            value={pkgL}
            onChange={(e) => setPkgL(e.target.value)}
            placeholder="Optional; e.g. 30"
          />
          <Input
            label="Width (cm)"
            type="number"
            min={1}
            value={pkgW}
            onChange={(e) => setPkgW(e.target.value)}
            placeholder="Optional; e.g. 20"
          />
          <Input
            label="Height (cm)"
            type="number"
            min={1}
            value={pkgH}
            onChange={(e) => setPkgH(e.target.value)}
            placeholder="Optional; e.g. 5"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Options</h2>
            <p className="text-xs text-gray-500">
              Up to 2 axes (e.g. Color, Size). You can rename values and add
              new ones. Removing options/values is not available yet.
            </p>
          </div>
          {options.length < 2 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOptions((prev) => [...prev, emptyOption()])}
            >
              Add option
            </Button>
          )}
        </div>
        {options.length === 0 ? (
          <p className="text-sm text-gray-500">No options — single-SKU product.</p>
        ) : (
          options.map((opt, oi) => (
            <div
              key={opt.id ?? `new-opt-${oi}`}
              className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1">
                  <Input
                    label={`Option ${oi + 1} name`}
                    value={opt.option_name}
                    onChange={(e) => {
                      const next = [...options];
                      next[oi] = { ...next[oi], option_name: e.target.value };
                      setOptions(next);
                    }}
                    placeholder={oi === 0 ? 'e.g. Color' : 'e.g. Size'}
                  />
                </div>
                {opt.id == null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOptions((prev) => prev.filter((_, i) => i !== oi))
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {opt.values.map((val, vi) => (
                  <div key={val.id ?? `v-${oi}-${vi}`} className="flex gap-2">
                    <Input
                      label={vi === 0 ? 'Values' : undefined}
                      value={val.option_value}
                      onChange={(e) => {
                        const next = [...options];
                        const values = [...next[oi].values];
                        values[vi] = {
                          ...values[vi],
                          option_value: e.target.value,
                        };
                        next[oi] = { ...next[oi], values };
                        setOptions(next);
                      }}
                      placeholder={
                        oi === 0
                          ? vi === 0
                            ? 'e.g. Black'
                            : 'e.g. White'
                          : vi === 0
                            ? 'e.g. S'
                            : 'e.g. M'
                      }
                    />
                    {val.id == null && opt.values.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-6"
                        onClick={() => {
                          const next = [...options];
                          next[oi] = {
                            ...next[oi],
                            values: next[oi].values.filter((_, i) => i !== vi),
                          };
                          setOptions(next);
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const next = [...options];
                    next[oi] = {
                      ...next[oi],
                      values: [...next[oi].values, { option_value: '' }],
                    };
                    setOptions(next);
                  }}
                >
                  Add value
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
            <p className="text-xs text-gray-500">
              {mode === 'edit'
                ? 'Edit SKUs below. Add new variants with option values that match option order. Removing variants is not available yet.'
                : 'SKU blank = auto-generated. Manual SKUs become A–Z / 0–9 with - (e.g. kaos hitam m → KAOS-HITAM-M). Option values must match option order.'}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setNewVariants((prev) => [
                ...prev,
                {
                  sku: '',
                  option_values: Array.from({ length: optionCount }, () => ''),
                },
              ])
            }
          >
            Add variant
          </Button>
        </div>

        {mode === 'edit' && (initial?.variants?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto rounded-md border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-3 py-2">Options</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initial!.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 text-gray-900">
                      {variantOptionLabels(v, initial!.options ?? [])}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={skuEdits[v.id] ?? v.sku}
                        onChange={(e) =>
                          setSkuEdits((prev) => ({
                            ...prev,
                            [v.id]: e.target.value,
                          }))
                        }
                        placeholder="e.g. KAOS-HITAM-M"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-700">{v.sku_source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {newVariants.length === 0 ? (
          <p className="text-sm text-gray-600">
            {mode === 'create'
              ? 'No variants yet — API can create a default sellable unit when options are empty.'
              : (initial?.variants?.length ?? 0) > 0
                ? 'Use Add variant to create more combinations.'
                : 'No variants yet — add one below.'}
          </p>
        ) : (
          newVariants.map((v, vi) => (
            <div
              key={vi}
              className="flex flex-wrap items-end gap-2 rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="min-w-40 flex-1">
                <Input
                  label="SKU (optional)"
                  value={v.sku}
                  onChange={(e) => {
                    const next = [...newVariants];
                    next[vi] = { ...next[vi], sku: e.target.value };
                    setNewVariants(next);
                  }}
                  placeholder="Optional; e.g. KAOS-HITAM-M"
                />
              </div>
              {options.map((opt, oi) => (
                <div key={oi} className="min-w-32 flex-1">
                  <Input
                    label={opt.option_name || `Option ${oi + 1}`}
                    value={v.option_values[oi] ?? ''}
                    onChange={(e) => {
                      const next = [...newVariants];
                      const ov = [...(next[vi].option_values ?? [])];
                      while (ov.length < optionCount) ov.push('');
                      ov[oi] = e.target.value;
                      next[vi] = { ...next[vi], option_values: ov };
                      setNewVariants(next);
                    }}
                    placeholder={
                      opt.option_name
                        ? `Must match a ${opt.option_name} value`
                        : oi === 0
                          ? 'e.g. Black'
                          : 'e.g. S'
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setNewVariants((prev) => prev.filter((_, i) => i !== vi))
                }
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel ??
            (mode === 'create' ? 'Create product' : 'Save changes')}
        </Button>
      </div>
    </form>
  );
}
