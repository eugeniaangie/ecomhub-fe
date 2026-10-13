'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { masterCategoryApi } from '@/lib/api';
import {
  shopeeAuthApi,
  type ShopeeAttributeNode,
  type ShopeeBrand,
  type ShopeeConnectedShop,
  type ShopeeLogisticsChannel,
  type ShopeeSizeChartDetailResult,
  type ShopeeSizeChartListItem,
} from '@/lib/services/integrationsApi';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ChannelListingDetail,
  ListingData,
  ListingDataAttribute,
  ListingDataSizeChartMode,
  ProductDetail,
  ProductImageDetail,
} from '@/lib/types/product';
import { variantOptionLabels } from '@/lib/utils/productLabels';

function asListingData(
  raw: ChannelListingDetail['listing_data']
): ListingData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as ListingData;
}

function parseShopeeCategoryId(
  listing: ChannelListingDetail | null,
  mappingExtId: string
): number {
  const fromListing = listing?.ext_category_id
    ? Number(listing.ext_category_id)
    : 0;
  if (fromListing > 0) return fromListing;
  const fromMapping = Number(mappingExtId);
  return fromMapping > 0 ? fromMapping : 0;
}

function sizeChartSupported(limits: Record<string, unknown> | null): {
  supported: boolean;
  mandatory: boolean;
} {
  if (!limits) return { supported: false, mandatory: false };
  const sc = limits.size_chart_limit as
    | { size_chart_mandatory?: boolean; support_image_size_chart?: boolean; support_template_size_chart?: boolean }
    | undefined;
  if (!sc || typeof sc !== 'object') return { supported: false, mandatory: false };
  const supported =
    Boolean(sc.support_image_size_chart) ||
    Boolean(sc.support_template_size_chart) ||
    sc.size_chart_mandatory === true;
  return { supported, mandatory: Boolean(sc.size_chart_mandatory) };
}

function dtsLimit(limits: Record<string, unknown> | null): {
  min?: number;
  max?: number;
} {
  if (!limits) return {};
  const dts = limits.dts_limit as { days_to_ship_limit?: { min_limit?: number; max_limit?: number } } | undefined;
  const range = dts?.days_to_ship_limit;
  if (!range) return {};
  return { min: range.min_limit, max: range.max_limit };
}

type VariantRow = {
  product_variant_id: number;
  listing_price: string;
  initial_stock: string;
};

type Props = {
  product: ProductDetail;
  onSaved: () => Promise<void> | void;
};

export function ShopeeListingDraftForm({ product, onSaved }: Props) {
  const existing = product.listings?.[0] ?? null;
  const isLive = Boolean(existing?.ext_product_id);

  const [shops, setShops] = useState<ShopeeConnectedShop[]>([]);
  const [marketplaceAccountId, setMarketplaceAccountId] = useState(
    existing?.marketplace_account_id ?? 0
  );
  const [mappingExtId, setMappingExtId] = useState('');
  const [mappingPath, setMappingPath] = useState('');
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [logisticIds, setLogisticIds] = useState<number[]>([]);
  const [channels, setChannels] = useState<ShopeeLogisticsChannel[]>([]);
  const [attributes, setAttributes] = useState<ShopeeAttributeNode[]>([]);
  const [attrValues, setAttrValues] = useState<Record<number, string>>({});
  const [brands, setBrands] = useState<ShopeeBrand[]>([]);
  const [brandId, setBrandId] = useState(0);
  const [brandName, setBrandName] = useState('NoBrand');
  const [sizeMode, setSizeMode] = useState<ListingDataSizeChartMode>('');
  const [sizeChartId, setSizeChartId] = useState(0);
  const [sizeCharts, setSizeCharts] = useState<ShopeeSizeChartListItem[]>([]);
  const [sizeDetail, setSizeDetail] =
    useState<ShopeeSizeChartDetailResult | null>(null);
  const [sizeMediaAssetId, setSizeMediaAssetId] = useState(0);
  const [limits, setLimits] = useState<Record<string, unknown> | null>(null);
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [daysToShip, setDaysToShip] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const shopId = useMemo(() => {
    const shop = shops.find((s) => s.id === marketplaceAccountId);
    return shop?.shop_id ?? 0;
  }, [shops, marketplaceAccountId]);

  const shopeeCategoryId = useMemo(
    () => parseShopeeCategoryId(existing, mappingExtId),
    [existing, mappingExtId]
  );

  const chartFlags = sizeChartSupported(limits);
  const dts = dtsLimit(limits);

  const hydrateFromListing = useCallback(
    (listing: ChannelListingDetail | null) => {
      const data = asListingData(listing?.listing_data);
      const logistics = (data.logistic_info ?? [])
        .filter((l) => l.enabled !== false)
        .map((l) => l.logistic_id)
        .filter((id) => id > 0);
      setLogisticIds(logistics);

      const brand = data.brand;
      setBrandId(brand?.brand_id ?? 0);
      setBrandName(brand?.original_brand_name || 'NoBrand');

      const attrs: Record<number, string> = {};
      for (const a of data.attribute_list ?? []) {
        const first = a.attribute_value_list?.[0];
        if (!first) continue;
        attrs[a.attribute_id] =
          first.value_id > 0
            ? String(first.value_id)
            : first.original_value_name || '';
      }
      setAttrValues(attrs);

      const sc = data.size_chart;
      setSizeMode(sc?.mode ?? '');
      setSizeChartId(sc?.size_chart_id ?? 0);
      setSizeMediaAssetId(sc?.media_asset_id ?? 0);

      const po = data.pre_order;
      setIsPreOrder(Boolean(po?.is_pre_order));
      setDaysToShip(
        po?.days_to_ship != null ? String(po.days_to_ship) : ''
      );

      const byVariant = new Map(
        (listing?.variants ?? []).map((v) => [v.product_variant_id, v])
      );
      setVariantRows(
        (product.variants ?? []).map((v) => {
          const lv = byVariant.get(v.id);
          const stockEntry = lv?.initial_seller_stock?.[0];
          return {
            product_variant_id: v.id,
            listing_price:
              lv?.listing_price != null ? String(lv.listing_price) : '',
            initial_stock:
              stockEntry?.stock != null ? String(stockEntry.stock) : '',
          };
        })
      );
    },
    [product.variants]
  );

  useEffect(() => {
    if (existing) {
      setMarketplaceAccountId(existing.marketplace_account_id);
    }
    hydrateFromListing(existing);
  }, [existing, hydrateFromListing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await shopeeAuthApi.listConnectedShops();
        if (cancelled) return;
        const active = (list ?? []).filter((s) => s.is_active);
        setShops(active);
        if (!marketplaceAccountId && active[0]) {
          setMarketplaceAccountId(active[0].id);
        }
      } catch {
        if (!cancelled) setShops([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [marketplaceAccountId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!product.category_id) {
        setMappingExtId('');
        return;
      }
      try {
        const mappings = await masterCategoryApi.getChannelMappings(
          product.category_id
        );
        if (cancelled) return;
        const shopee = (mappings ?? []).find((m) => m.platform === 'shopee');
        setMappingExtId(shopee?.ext_category_id ?? '');
        setMappingPath(shopee?.ext_category_path ?? '');
      } catch {
        if (!cancelled) {
          setMappingExtId('');
          setMappingPath('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.category_id]);

  const loadProxies = useCallback(async () => {
    if (!shopeeCategoryId) {
      setChannels([]);
      setAttributes([]);
      setBrands([]);
      setLimits(null);
      setSizeCharts([]);
      return;
    }
    setLoadingMeta(true);
    setError('');
    try {
      const shopQ = shopId > 0 ? { shop_id: shopId } : {};
      const [logistics, attrs, brandPage, limitRes, charts] =
        await Promise.all([
          shopeeAuthApi.getLogistics(shopQ),
          shopeeAuthApi.getCategoryAttributes(shopeeCategoryId, shopQ),
          shopeeAuthApi.getCategoryBrands(shopeeCategoryId, {
            ...shopQ,
            page_size: 100,
          }),
          shopeeAuthApi.getItemLimit({
            ...shopQ,
            category_id: shopeeCategoryId,
          }),
          shopeeAuthApi.getSizeChartList(shopeeCategoryId, {
            ...shopQ,
            page_size: 50,
          }),
        ]);
      setChannels(logistics?.channels ?? []);
      setAttributes(attrs?.attributes ?? []);
      setBrands(brandPage?.brands ?? []);
      setLimits(limitRes?.limits ?? null);
      setSizeCharts(charts?.size_charts ?? []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load Shopee form options'
      );
    } finally {
      setLoadingMeta(false);
    }
  }, [shopeeCategoryId, shopId]);

  useEffect(() => {
    void loadProxies();
  }, [loadProxies]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sizeMode !== 'template' || !sizeChartId) {
        setSizeDetail(null);
        return;
      }
      try {
        const detail = await shopeeAuthApi.getSizeChartDetail(sizeChartId, {
          shop_id: shopId > 0 ? shopId : undefined,
        });
        if (!cancelled) setSizeDetail(detail);
      } catch {
        if (!cancelled) setSizeDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sizeMode, sizeChartId, shopId]);

  const galleryAssets: ProductImageDetail[] = product.images ?? [];

  const toggleLogistic = (id: number) => {
    if (isLive) return;
    setLogisticIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveMapping = async () => {
    if (!product.category_id || !mappingExtId.trim()) {
      setError('Internal category and Shopee category id are required for mapping.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await masterCategoryApi.saveChannelMappings(product.category_id, [
        {
          platform: 'shopee',
          ext_category_id: mappingExtId.trim(),
          ext_category_path: mappingPath.trim() || null,
        },
      ]);
      setMessage('Category mapping saved.');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save category mapping'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!marketplaceAccountId) {
      setError('Select a connected Shopee shop.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const attribute_list: ListingDataAttribute[] = [];
      for (const node of attributes) {
        const raw = attrValues[node.attribute_id];
        if (raw == null || raw === '') continue;
        const asNum = Number(raw);
        if (Number.isFinite(asNum) && asNum > 0 && String(asNum) === raw) {
          attribute_list.push({
            attribute_id: node.attribute_id,
            attribute_value_list: [{ value_id: asNum }],
          });
        } else {
          attribute_list.push({
            attribute_id: node.attribute_id,
            attribute_value_list: [
              { value_id: 0, original_value_name: raw },
            ],
          });
        }
      }

      const listing_data: ListingData = {
        schema_version: 1,
        condition: 'NEW',
        item_dangerous: 0,
        brand: {
          brand_id: brandId,
          original_brand_name: brandName || 'NoBrand',
        },
        attribute_list,
        logistic_info: logisticIds.map((logistic_id) => ({
          logistic_id,
          enabled: true,
        })),
        pre_order: {
          is_pre_order: isPreOrder,
          ...(isPreOrder && daysToShip
            ? { days_to_ship: Number(daysToShip) || undefined }
            : {}),
        },
      };

      if (sizeMode === 'none') {
        listing_data.size_chart = { mode: 'none' };
      } else if (sizeMode === 'template' && sizeChartId > 0) {
        listing_data.size_chart = {
          mode: 'template',
          size_chart_id: sizeChartId,
        };
      } else if (sizeMode === 'image' && sizeMediaAssetId > 0) {
        listing_data.size_chart = {
          mode: 'image',
          media_asset_id: sizeMediaAssetId,
        };
      }

      await productsApi.saveShopeeListingDraft(product.id, {
        marketplace_account_id: marketplaceAccountId,
        listing_data,
        variants: variantRows.map((row) => ({
          product_variant_id: row.product_variant_id,
          listing_price: row.listing_price
            ? Number(row.listing_price)
            : null,
          initial_seller_stock:
            !isLive && row.initial_stock !== ''
              ? [{ stock: Number(row.initial_stock) || 0 }]
              : undefined,
        })),
      });
      setMessage('Listing draft saved.');
      await onSaved();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save listing draft'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Shopee listing draft">
      <p className="mb-3 text-sm text-gray-600">
        Save desired channel fields before push. Logistics are create-only
        after the item exists on Shopee. Product name, description, weight,
        dimensions, and images come from the product form above.
      </p>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </div>
      )}

      <div className="space-y-6 text-sm text-gray-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Shopee shop
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={marketplaceAccountId || ''}
              disabled={Boolean(existing)}
              onChange={(e) =>
                setMarketplaceAccountId(Number(e.target.value) || 0)
              }
            >
              <option value="">Select shop…</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  Shop {s.shop_id} (account #{s.id})
                </option>
              ))}
            </select>
            {existing && (
              <p className="mt-1 text-xs text-gray-500">
                Shop is fixed for this listing.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Shopee category ID
            </label>
            {existing?.ext_category_id ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono">
                {existing.ext_category_id}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Input
                  value={mappingExtId}
                  onChange={(e) => setMappingExtId(e.target.value)}
                  placeholder="Shopee leaf category id"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={saving || !product.category_id}
                  onClick={() => void saveMapping()}
                >
                  Save mapping
                </Button>
              </div>
            )}
            {!product.category_id && (
              <p className="mt-1 text-xs text-amber-800">
                Set an internal category on the product to map a Shopee
                category.
              </p>
            )}
            {shopeeCategoryId > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Using category {shopeeCategoryId} for form options
                {loadingMeta ? ' (loading…)' : ''}.
              </p>
            )}
          </div>
        </div>

        <section>
          <h4 className="mb-2 font-medium text-gray-900">
            Variant prices{!isLive ? ' & initial stock' : ''}
          </h4>
          <div className="space-y-2">
            {variantRows.map((row) => {
              const variant = product.variants?.find(
                (v) => v.id === row.product_variant_id
              );
              return (
                <div
                  key={row.product_variant_id}
                  className="grid gap-2 rounded border border-gray-100 p-2 sm:grid-cols-3"
                >
                  <div className="text-xs text-gray-600">
                    {variant
                      ? variantOptionLabels(variant, product.options ?? [])
                      : `#${row.product_variant_id}`}
                    <div className="font-mono text-gray-900">
                      {variant?.sku || '—'}
                    </div>
                  </div>
                  <Input
                    label="Listing price (IDR)"
                    type="number"
                    min={0}
                    value={row.listing_price}
                    onChange={(e) =>
                      setVariantRows((prev) =>
                        prev.map((r) =>
                          r.product_variant_id === row.product_variant_id
                            ? { ...r, listing_price: e.target.value }
                            : r
                        )
                      )
                    }
                  />
                  {!isLive && (
                    <Input
                      label="Initial stock"
                      type="number"
                      min={0}
                      value={row.initial_stock}
                      onChange={(e) =>
                        setVariantRows((prev) =>
                          prev.map((r) =>
                            r.product_variant_id === row.product_variant_id
                              ? { ...r, initial_stock: e.target.value }
                              : r
                          )
                        )
                      }
                    />
                  )}
                </div>
              );
            })}
            {variantRows.length === 0 && (
              <p className="text-gray-600">No variants on this product.</p>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-gray-900">
            Logistics{isLive ? ' (read-only after create)' : ''}
          </h4>
          {channels.length === 0 ? (
            <p className="text-gray-600">
              {shopeeCategoryId
                ? 'No logistics channels loaded.'
                : 'Resolve a Shopee category to load logistics.'}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {channels.map((ch) => (
                <label
                  key={ch.logistics_channel_id}
                  className={`flex items-start gap-2 rounded border px-2 py-1.5 ${
                    isLive ? 'cursor-default opacity-70' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    disabled={isLive}
                    checked={logisticIds.includes(ch.logistics_channel_id)}
                    onChange={() => toggleLogistic(ch.logistics_channel_id)}
                  />
                  <span>
                    <span className="font-medium">
                      {ch.logistics_channel_name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      id {ch.logistics_channel_id}
                      {!ch.enabled ? ' · disabled on shop' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-2 font-medium text-gray-900">Brand</h4>
          <select
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
            value={brandId}
            onChange={(e) => {
              const id = Number(e.target.value) || 0;
              setBrandId(id);
              const found = brands.find((b) => b.brand_id === id);
              setBrandName(
                found?.original_brand_name ||
                  found?.display_brand_name ||
                  (id === 0 ? 'NoBrand' : brandName)
              );
            }}
          >
            <option value={0}>NoBrand</option>
            {brands.map((b) => (
              <option key={b.brand_id} value={b.brand_id}>
                {b.display_brand_name || b.original_brand_name || b.brand_id}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h4 className="mb-2 font-medium text-gray-900">Attributes</h4>
          {attributes.length === 0 ? (
            <p className="text-gray-600">No attributes for this category.</p>
          ) : (
            <div className="space-y-3">
              {attributes.map((node) => {
                const values = node.attribute_value_list ?? [];
                const current = attrValues[node.attribute_id] ?? '';
                return (
                  <div key={node.attribute_id}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {node.name || `Attribute ${node.attribute_id}`}
                      {node.mandatory ? ' *' : ''}
                    </label>
                    {values.length > 0 ? (
                      <select
                        className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
                        value={current}
                        onChange={(e) =>
                          setAttrValues((prev) => ({
                            ...prev,
                            [node.attribute_id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">—</option>
                        {values.map((v) => (
                          <option key={v.value_id} value={String(v.value_id)}>
                            {v.name || v.value_id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={current}
                        onChange={(e) =>
                          setAttrValues((prev) => ({
                            ...prev,
                            [node.attribute_id]: e.target.value,
                          }))
                        }
                        placeholder="Value"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {chartFlags.supported && (
          <section>
            <h4 className="mb-2 font-medium text-gray-900">
              Size chart{chartFlags.mandatory ? ' (required)' : ''}
            </h4>
            <select
              className="mb-2 w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={sizeMode}
              onChange={(e) =>
                setSizeMode(e.target.value as ListingDataSizeChartMode)
              }
            >
              <option value="">Leave unmanaged (imported charts untouched)</option>
              <option value="none">Clear size chart</option>
              <option value="template">Template</option>
              <option value="image">Image (media asset)</option>
            </select>
            {sizeMode === 'template' && (
              <div className="space-y-2">
                <select
                  className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
                  value={sizeChartId || ''}
                  onChange={(e) =>
                    setSizeChartId(Number(e.target.value) || 0)
                  }
                >
                  <option value="">Select template…</option>
                  {sizeCharts.map((sc) => (
                    <option key={sc.size_chart_id} value={sc.size_chart_id}>
                      Template {sc.size_chart_id}
                      {sizeDetail?.size_chart_id === sc.size_chart_id &&
                      sizeDetail.size_chart_name
                        ? ` — ${sizeDetail.size_chart_name}`
                        : ''}
                    </option>
                  ))}
                </select>
                {sizeDetail && (
                  <div className="overflow-x-auto rounded border border-gray-100">
                    <p className="bg-gray-50 px-2 py-1 text-xs font-medium">
                      {sizeDetail.size_chart_name ||
                        `Template ${sizeDetail.size_chart_id}`}
                    </p>
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500">
                          {sizeDetail.columns.map((col, i) => (
                            <th key={i} className="px-2 py-1">
                              {col.display_name || col.input_type || `Col ${i + 1}`}
                              {col.unit ? ` (${col.unit})` : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({
                          length: Math.max(
                            0,
                            ...sizeDetail.columns.map(
                              (c) => c.measurement_value_list?.length ?? 0
                            )
                          ),
                        }).map((_, rowIdx) => (
                          <tr key={rowIdx} className="border-t border-gray-100">
                            {sizeDetail.columns.map((col, colIdx) => {
                              const cell =
                                col.measurement_value_list?.[rowIdx];
                              let text = '—';
                              if (cell) {
                                if (cell.option) text = cell.option;
                                else if (cell.value) text = cell.value;
                                else if (cell.min_value || cell.max_value) {
                                  text = `${cell.min_value ?? ''}–${cell.max_value ?? ''}`;
                                }
                              }
                              return (
                                <td key={colIdx} className="px-2 py-1">
                                  {text}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {sizeMode === 'image' && (
              <select
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
                value={sizeMediaAssetId || ''}
                onChange={(e) =>
                  setSizeMediaAssetId(Number(e.target.value) || 0)
                }
              >
                <option value="">Select product image media asset…</option>
                {galleryAssets
                  .filter((img) => img.media_asset_id)
                  .map((img) => (
                    <option
                      key={img.id}
                      value={img.media_asset_id ?? undefined}
                    >
                      Image #{img.id} · asset {img.media_asset_id}
                      {img.is_primary ? ' (primary)' : ''}
                    </option>
                  ))}
              </select>
            )}
          </section>
        )}

        <section>
          <h4 className="mb-2 font-medium text-gray-900">Pre-order</h4>
          <label className="mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPreOrder}
              onChange={(e) => setIsPreOrder(e.target.checked)}
            />
            This is a pre-order item
          </label>
          {isPreOrder && (
            <Input
              label="Days to ship"
              type="number"
              min={dts.min ?? 0}
              max={dts.max}
              value={daysToShip}
              onChange={(e) => setDaysToShip(e.target.value)}
              className="max-w-xs"
            />
          )}
          {(dts.min != null || dts.max != null) && (
            <p className="mt-1 text-xs text-gray-500">
              Shopee DTS limit
              {dts.min != null ? ` min ${dts.min}` : ''}
              {dts.max != null ? ` max ${dts.max}` : ''}.
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loadingMeta}
            onClick={() => void loadProxies()}
          >
            Refresh Shopee options
          </Button>
          <Button
            type="button"
            isLoading={saving}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Save listing draft
          </Button>
        </div>
      </div>
    </Card>
  );
}
