'use client';

import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ChannelListingDetail,
  ListingSyncStatus,
  ProductDetail,
  ShopeeProductPushResult,
  ShopeeRebindResult,
  ShopeeRebindSuggestion,
  ShopeeRelinkSuggestion,
  UnmatchedShopeeModel,
} from '@/lib/types/product';
import {
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
} from '@/lib/utils/productLabels';

const PUSH_LEASE_MS = 10 * 60 * 1000;

function isLeaseBusy(listing: ChannelListingDetail): boolean {
  if (!listing.push_started_at) return false;
  const started = new Date(listing.push_started_at).getTime();
  if (Number.isNaN(started)) return false;
  return Date.now() - started < PUSH_LEASE_MS;
}

function isLiveStatus(extStatus?: string | null): boolean {
  return (extStatus || '').toUpperCase() === 'NORMAL';
}

function formatAbsentSince(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function parseUnmatchedModels(
  channelData?: Record<string, unknown> | null
): UnmatchedShopeeModel[] {
  if (!channelData) return [];
  const raw = channelData.unmatched_models;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is UnmatchedShopeeModel =>
      row != null && typeof row === 'object' && !Array.isArray(row)
  );
}

function listingBlockedReason(listing: ChannelListingDetail): string | null {
  if (listing.absent_since) {
    return `Listing is no longer on Shopee (since ${formatAbsentSince(listing.absent_since)}). Run Check Shopee / Pull to re-check.`;
  }
  const absentVariants = (listing.variants ?? []).filter((v) => v.absent_since);
  if (absentVariants.length > 0) {
    return `${absentVariants.length} variant(s) gone from Shopee — re-link or Pull before push.`;
  }
  if (parseUnmatchedModels(listing.channel_data).length > 0) {
    return 'Listing has unmatched Shopee models — re-link before push.';
  }
  return null;
}

/** F8p / F8r — unlink or re-bind when never pushed, or marked gone (not while still live). */
function canUnlinkOrRebindListing(listing: ChannelListingDetail): boolean {
  if (isLeaseBusy(listing)) return false;
  const ext = (listing.ext_product_id || '').trim();
  if (!ext) return true;
  return Boolean(listing.absent_since);
}

type Props = {
  product: ProductDetail;
  canWrite: boolean;
  onChanged: () => Promise<void> | void;
};

export function ChannelListingsPanel({ product, canWrite, onChanged }: Props) {
  const [busyKey, setBusyKey] = useState('');
  const [actionError, setActionError] = useState('');
  const [resultModal, setResultModal] = useState<ShopeeProductPushResult | null>(
    null
  );
  const [stockModalListing, setStockModalListing] =
    useState<ChannelListingDetail | null>(null);
  const [stockInputs, setStockInputs] = useState<
    Record<number, { expected: string; next: string }>
  >({});
  const [confirmLiveById, setConfirmLiveById] = useState<
    Record<number, boolean>
  >({});
  const [overwriteById, setOverwriteById] = useState<Record<number, boolean>>(
    {}
  );
  const [stockConfirmLive, setStockConfirmLive] = useState(false);

  const [relinkListingId, setRelinkListingId] = useState<number | null>(null);
  const [relinkSuggestions, setRelinkSuggestions] = useState<
    ShopeeRelinkSuggestion[]
  >([]);
  const [selectedRelinks, setSelectedRelinks] = useState<
    Record<number, boolean>
  >({});
  const [relinkBusy, setRelinkBusy] = useState(false);
  const [relinkError, setRelinkError] = useState('');
  const [relinkMessage, setRelinkMessage] = useState('');
  const [unlinkBusyId, setUnlinkBusyId] = useState<number | null>(null);

  const [rebindListing, setRebindListing] =
    useState<ChannelListingDetail | null>(null);
  const [rebindSuggestions, setRebindSuggestions] = useState<
    ShopeeRebindSuggestion[]
  >([]);
  const [rebindHasNextPage, setRebindHasNextPage] = useState(false);
  const [rebindExtId, setRebindExtId] = useState('');
  const [rebindBusy, setRebindBusy] = useState(false);
  const [rebindError, setRebindError] = useState('');
  const [rebindResult, setRebindResult] = useState<ShopeeRebindResult | null>(
    null
  );

  const listings = product.listings ?? [];

  const handleUnlink = async (listing: ChannelListingDetail) => {
    if (!canUnlinkOrRebindListing(listing)) {
      setActionError(
        'Cannot unlink while the listing still looks live on Shopee. Run Check Shopee / Pull until it is marked gone.'
      );
      return;
    }
    if (
      !confirm(
        'Unlink this channel listing from the product? This does not delete the item on Shopee — only the local link. Required before archiving.'
      )
    ) {
      return;
    }
    setUnlinkBusyId(listing.id);
    setActionError('');
    try {
      await productsApi.unlinkListing(product.id, listing.id);
      await onChanged();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Unlink failed');
    } finally {
      setUnlinkBusyId(null);
    }
  };

  const openRebindModal = async (listing: ChannelListingDetail) => {
    if (!canUnlinkOrRebindListing(listing)) {
      setActionError(
        'Cannot re-bind while the listing still looks live on Shopee. Run Check Shopee / Pull until it is marked gone.'
      );
      return;
    }
    setRebindListing(listing);
    setRebindExtId('');
    setRebindError('');
    setRebindResult(null);
    setRebindSuggestions([]);
    setRebindHasNextPage(false);
    setRebindBusy(true);
    try {
      const data = await productsApi.getRebindSuggestions(
        product.id,
        listing.id
      );
      setRebindSuggestions(data?.suggestions ?? []);
      setRebindHasNextPage(Boolean(data?.has_next_page));
      const first = data?.suggestions?.[0];
      if (first?.ext_product_id) {
        setRebindExtId(first.ext_product_id);
      }
    } catch (err: unknown) {
      setRebindError(
        err instanceof Error ? err.message : 'Failed to load re-bind suggestions'
      );
    } finally {
      setRebindBusy(false);
    }
  };

  const confirmRebind = async () => {
    if (!rebindListing) return;
    const ext = rebindExtId.trim();
    if (!ext) {
      setRebindError('Enter or select a Shopee item_id (ext_product_id).');
      return;
    }
    if (
      !confirm(
        `Re-bind this listing to Shopee item ${ext}? Variants rematch by SKU; unmatched models may appear.`
      )
    ) {
      return;
    }
    setRebindBusy(true);
    setRebindError('');
    try {
      const result = await productsApi.rebindListing(
        product.id,
        rebindListing.id,
        ext
      );
      setRebindResult(result);
      await onChanged();
    } catch (err: unknown) {
      setRebindError(err instanceof Error ? err.message : 'Re-bind failed');
    } finally {
      setRebindBusy(false);
    }
  };

  const runAction = async (
    key: string,
    fn: () => Promise<ShopeeProductPushResult>
  ) => {
    setBusyKey(key);
    setActionError('');
    try {
      const result = await fn();
      setResultModal(result);
      await onChanged();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyKey('');
    }
  };

  const openStockModal = (listing: ChannelListingDetail) => {
    const initial: Record<number, { expected: string; next: string }> = {};
    for (const lv of listing.variants ?? []) {
      if (lv.absent_since) continue;
      const stock = lv.ext_stock ?? 0;
      initial[lv.product_variant_id] = {
        expected: String(stock),
        next: String(stock),
      };
    }
    setStockInputs(initial);
    setStockConfirmLive(false);
    setStockModalListing(listing);
  };

  const submitStock = async (
    listing: ChannelListingDetail,
    dryRun: boolean
  ) => {
    const live = isLiveStatus(listing.ext_status);
    if (live && !stockConfirmLive) {
      setActionError('Confirm live listing write before updating stock.');
      return;
    }
    const variants = (listing.variants ?? [])
      .filter((lv) => !lv.absent_since)
      .map((lv) => {
        const row = stockInputs[lv.product_variant_id] || {
          expected: '0',
          next: '0',
        };
        return {
          product_variant_id: lv.product_variant_id,
          expected_stock: Number(row.expected) || 0,
          seller_stock: [{ stock: Number(row.next) || 0 }],
        };
      });
    if (variants.length === 0) {
      setActionError('No listing variants to update.');
      return;
    }
    await runAction(dryRun ? 'stock-dry' : 'stock-run', () =>
      productsApi.updateListingStock(
        product.id,
        listing.id,
        { is_live_confirmed: live, variants },
        { is_dry_run: dryRun }
      )
    );
    if (!dryRun) setStockModalListing(null);
  };

  const loadRelinkSuggestions = useCallback(
    async (listingId: number) => {
      setRelinkListingId(listingId);
      setRelinkError('');
      setRelinkMessage('');
      setRelinkBusy(true);
      try {
        const data = await productsApi.getRelinkSuggestions(
          product.id,
          listingId
        );
        const suggestions = data?.suggestions ?? [];
        setRelinkSuggestions(suggestions);
        const selected: Record<number, boolean> = {};
        for (const s of suggestions) {
          selected[s.listing_variant_id] = true;
        }
        setSelectedRelinks(selected);
      } catch (err: unknown) {
        setRelinkSuggestions([]);
        setRelinkError(
          err instanceof Error ? err.message : 'Failed to load re-link suggestions'
        );
      } finally {
        setRelinkBusy(false);
      }
    },
    [product.id]
  );

  const confirmRelinks = async () => {
    if (relinkListingId == null) return;
    const links = relinkSuggestions
      .filter((s) => selectedRelinks[s.listing_variant_id])
      .map((s) => ({
        listing_variant_id: s.listing_variant_id,
        ext_variant_id: s.ext_variant_id,
      }));
    if (links.length === 0) {
      setRelinkError('Select at least one suggested pair to confirm.');
      return;
    }
    setRelinkBusy(true);
    setRelinkError('');
    try {
      const result = await productsApi.relinkVariants(
        product.id,
        relinkListingId,
        links
      );
      setRelinkMessage(`Re-linked ${result.relinked} variant(s).`);
      setRelinkSuggestions([]);
      setRelinkListingId(null);
      await onChanged();
    } catch (err: unknown) {
      setRelinkError(err instanceof Error ? err.message : 'Re-link failed');
    } finally {
      setRelinkBusy(false);
    }
  };

  return (
    <Card title="Channel listings">
      {actionError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {relinkMessage && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {relinkMessage}
        </div>
      )}

      {listings.length === 0 ? (
        <p className="text-sm text-gray-600">
          No channel listings yet. Import from Shopee or save a Shopee listing
          draft below, then push.
        </p>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const sync = (listing.sync_status ||
              'not_published') as ListingSyncStatus;
            const leaseBusy = isLeaseBusy(listing);
            const hasExt = Boolean(listing.ext_product_id);
            const live = isLiveStatus(listing.ext_status);
            const conflict = sync === 'conflict';
            const prefix = `listing-${listing.id}`;
            const confirmLive = Boolean(confirmLiveById[listing.id]);
            const overwriteConflict = Boolean(overwriteById[listing.id]);
            const blocked = listingBlockedReason(listing);
            const unmatched = parseUnmatchedModels(listing.channel_data);
            const listingGone = Boolean(listing.absent_since);
            const actionsBlocked = Boolean(blocked) || leaseBusy || Boolean(busyKey);

            return (
              <div
                key={listing.id}
                className={`rounded-md border p-3 text-sm ${
                  listingGone
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={SYNC_STATUS_LABELS[sync] || listing.sync_status}
                    colorClass={
                      SYNC_STATUS_COLORS[sync] || 'bg-gray-100 text-gray-800'
                    }
                  />
                  {listingGone && (
                    <StatusBadge
                      label="Gone from Shopee"
                      colorClass="bg-amber-100 text-amber-900"
                    />
                  )}
                  {unmatched.length > 0 && (
                    <StatusBadge
                      label={`${unmatched.length} unmatched model(s)`}
                      colorClass="bg-orange-100 text-orange-900"
                    />
                  )}
                  <span className="text-gray-900">
                    Account #{listing.marketplace_account_id}
                  </span>
                  {leaseBusy && (
                    <span className="text-xs text-amber-800">
                      Push in progress…
                    </span>
                  )}
                </div>

                {listingGone && (
                  <p className="mt-2 text-xs text-amber-900">
                    Absent since {formatAbsentSince(listing.absent_since)}. Push /
                    publish / unlist / stock are blocked until this listing is
                    present again (Pull or Check Shopee).
                  </p>
                )}

                {blocked && !listingGone && (
                  <p className="mt-2 rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-900">
                    {blocked}
                  </p>
                )}

                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">External product ID</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">
                      {listing.ext_product_id || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">External status</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {listing.ext_status || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">External SKU</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {listing.ext_sku || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Shopee category</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">
                      {listing.ext_category_id || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Last synced</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {listing.last_synced_at
                        ? new Date(listing.last_synced_at).toLocaleString()
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Last pushed</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {listing.last_pushed_at
                        ? new Date(listing.last_pushed_at).toLocaleString()
                        : '—'}
                    </dd>
                  </div>
                </dl>

                {listing.last_push_error && (
                  <p className="mt-2 rounded border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-800">
                    {listing.last_push_error}
                  </p>
                )}

                {(listing.variants ?? []).length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs text-gray-900">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-1 pr-2">Variant</th>
                          <th className="py-1 pr-2">Ext. SKU</th>
                          <th className="py-1 pr-2">Listing price</th>
                          <th className="py-1 pr-2">Ext. price</th>
                          <th className="py-1 pr-2">Ext. stock</th>
                          <th className="py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listing.variants.map((lv) => (
                          <tr key={lv.id} className="border-t border-gray-200">
                            <td className="py-1 pr-2">
                              #{lv.product_variant_id}
                            </td>
                            <td className="py-1 pr-2">{lv.ext_sku || '—'}</td>
                            <td className="py-1 pr-2">
                              {lv.listing_price != null
                                ? String(lv.listing_price)
                                : '—'}
                            </td>
                            <td className="py-1 pr-2">
                              {lv.ext_price != null
                                ? `${lv.ext_price}${lv.currency ? ` ${lv.currency}` : ''}`
                                : '—'}
                            </td>
                            <td className="py-1 pr-2">{lv.ext_stock ?? '—'}</td>
                            <td className="py-1">
                              {lv.absent_since ? (
                                <span
                                  className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900"
                                  title={`Absent since ${formatAbsentSince(lv.absent_since)}`}
                                >
                                  Gone
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {unmatched.length > 0 && (
                  <div className="mt-3 rounded border border-orange-200 bg-white p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-orange-900">
                        Unmatched Shopee models ({unmatched.length})
                      </p>
                      {canWrite && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={relinkBusy || Boolean(busyKey)}
                          isLoading={
                            relinkBusy && relinkListingId === listing.id
                          }
                          onClick={() => void loadRelinkSuggestions(listing.id)}
                        >
                          Suggest re-links
                        </Button>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-700">
                      {unmatched.map((m, idx) => (
                        <li key={`${m.model_id ?? 'x'}-${idx}`} className="font-mono">
                          model_id={m.model_id ?? '—'} · sku={m.model_sku || '—'}
                          {m.stock != null ? ` · stock=${m.stock}` : ''}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      No auto “add as variant” yet — create the variant in the
                      product form if needed, then confirm a re-link.
                    </p>

                    {relinkListingId === listing.id && (
                      <div className="mt-3 border-t border-orange-100 pt-2">
                        {relinkError && (
                          <p className="mb-2 text-xs text-red-700">{relinkError}</p>
                        )}
                        {relinkSuggestions.length === 0 && !relinkBusy ? (
                          <p className="text-xs text-gray-600">
                            No SKU matches suggested. Check master SKUs vs Shopee
                            model_sku, or create the missing variant first.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {relinkSuggestions.map((s) => (
                              <label
                                key={s.listing_variant_id}
                                className="flex items-start gap-2 text-xs text-gray-800"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5"
                                  checked={Boolean(
                                    selectedRelinks[s.listing_variant_id]
                                  )}
                                  onChange={(e) =>
                                    setSelectedRelinks((prev) => ({
                                      ...prev,
                                      [s.listing_variant_id]: e.target.checked,
                                    }))
                                  }
                                />
                                <span>
                                  Absent variant #{s.product_variant_id} (
                                  <span className="font-mono">{s.master_sku}</span>
                                  ) → Shopee model{' '}
                                  <span className="font-mono">{s.ext_variant_id}</span>{' '}
                                  / {s.model_sku || '—'}
                                  <span className="text-gray-500">
                                    {' '}
                                    · {s.reason}
                                  </span>
                                </span>
                              </label>
                            ))}
                            <Button
                              size="sm"
                              disabled={relinkBusy}
                              isLoading={relinkBusy}
                              onClick={() => void confirmRelinks()}
                            >
                              Confirm re-link
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {canWrite && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasExt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={leaseBusy || Boolean(busyKey)}
                        isLoading={busyKey === `${prefix}-pull`}
                        onClick={() =>
                          runAction(`${prefix}-pull`, () =>
                            productsApi.pullListing(product.id, listing.id)
                          )
                        }
                      >
                        Pull
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionsBlocked || (conflict && !overwriteConflict)}
                      isLoading={busyKey === `${prefix}-dry`}
                      title={blocked || undefined}
                      onClick={() =>
                        runAction(`${prefix}-dry`, () =>
                          productsApi.pushListing(product.id, listing.id, {
                            is_dry_run: true,
                            body: {
                              is_live_confirmed: live || confirmLive,
                              overwrite_conflict: conflict && overwriteConflict,
                            },
                          })
                        )
                      }
                    >
                      Dry-run push
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        actionsBlocked || (conflict && !overwriteConflict)
                      }
                      isLoading={busyKey === `${prefix}-push`}
                      title={blocked || undefined}
                      onClick={() => {
                        if (live && !confirmLive) {
                          setActionError(
                            'Confirm live listing write before pushing a NORMAL item.'
                          );
                          return;
                        }
                        void runAction(`${prefix}-push`, () =>
                          productsApi.pushListing(product.id, listing.id, {
                            body: {
                              is_live_confirmed: live ? confirmLive : false,
                              overwrite_conflict:
                                conflict && overwriteConflict,
                            },
                          })
                        );
                      }}
                    >
                      Push
                    </Button>
                    {hasExt && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionsBlocked || conflict}
                          isLoading={busyKey === `${prefix}-publish`}
                          title={blocked || undefined}
                          onClick={() =>
                            runAction(`${prefix}-publish`, () =>
                              productsApi.publishListing(
                                product.id,
                                listing.id,
                                { is_live_confirmed: live }
                              )
                            )
                          }
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionsBlocked || conflict}
                          isLoading={busyKey === `${prefix}-unlist`}
                          title={blocked || undefined}
                          onClick={() =>
                            runAction(`${prefix}-unlist`, () =>
                              productsApi.unlistListing(
                                product.id,
                                listing.id,
                                { is_live_confirmed: live }
                              )
                            )
                          }
                        >
                          Unlist
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actionsBlocked || conflict}
                          title={blocked || undefined}
                          onClick={() => openStockModal(listing)}
                        >
                          Update stock
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        !canUnlinkOrRebindListing(listing) ||
                        rebindBusy ||
                        Boolean(busyKey)
                      }
                      title={
                        canUnlinkOrRebindListing(listing)
                          ? 'Point this listing at a new Shopee item_id (same shop)'
                          : 'Listing still live on Shopee — Check Shopee / Pull first'
                      }
                      onClick={() => void openRebindModal(listing)}
                    >
                      Re-bind
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={
                        !canUnlinkOrRebindListing(listing) ||
                        unlinkBusyId === listing.id ||
                        Boolean(busyKey)
                      }
                      isLoading={unlinkBusyId === listing.id}
                      title={
                        canUnlinkOrRebindListing(listing)
                          ? 'Remove local listing link (not Shopee delete)'
                          : 'Listing still live on Shopee — Check Shopee / Pull first'
                      }
                      onClick={() => void handleUnlink(listing)}
                    >
                      Unlink
                    </Button>
                  </div>
                )}

                {canWrite && (live || conflict) && !listingGone && (
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-800">
                    {live && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={confirmLive}
                          onChange={(e) =>
                            setConfirmLiveById((prev) => ({
                              ...prev,
                              [listing.id]: e.target.checked,
                            }))
                          }
                        />
                        Confirm live listing write
                      </label>
                    )}
                    {conflict && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={overwriteConflict}
                          onChange={(e) =>
                            setOverwriteById((prev) => ({
                              ...prev,
                              [listing.id]: e.target.checked,
                            }))
                          }
                        />
                        Overwrite Shopee conflict (prefer Pull)
                      </label>
                    )}
                  </div>
                )}
                {canWrite && conflict && (
                  <p className="mt-1 text-xs text-orange-800">
                    Conflict: Pull to adopt Shopee changes, or check overwrite
                    to push EcomHub over Shopee. Publish/Unlist/Stock require
                    Pull first.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(resultModal)}
        onClose={() => setResultModal(null)}
        title="Listing action result"
        size="lg"
        footer={
          <Button onClick={() => setResultModal(null)}>Close</Button>
        }
      >
        {resultModal && (
          <div className="space-y-2 text-sm text-gray-900">
            <p>
              <span className="text-gray-500">Action:</span>{' '}
              {resultModal.action} ·{' '}
              <span className="text-gray-500">Status:</span>{' '}
              {resultModal.status}
              {resultModal.is_dry_run ? ' (dry run)' : ''}
            </p>
            {resultModal.ext_product_id && (
              <p>
                <span className="text-gray-500">External ID:</span>{' '}
                <span className="font-mono">{resultModal.ext_product_id}</span>
              </p>
            )}
            {resultModal.message && <p>{resultModal.message}</p>}
            {resultModal.request_preview && (
              <pre className="max-h-80 overflow-auto rounded bg-gray-50 p-2 text-xs">
                {JSON.stringify(resultModal.request_preview, null, 2)}
              </pre>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(rebindListing)}
        onClose={() => {
          if (rebindBusy) return;
          setRebindListing(null);
          setRebindResult(null);
          setRebindError('');
        }}
        title="Re-bind Shopee item"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={rebindBusy}
              onClick={() => {
                setRebindListing(null);
                setRebindResult(null);
                setRebindError('');
              }}
            >
              {rebindResult ? 'Close' : 'Cancel'}
            </Button>
            {!rebindResult && (
              <Button
                disabled={rebindBusy || !rebindExtId.trim()}
                isLoading={rebindBusy}
                onClick={() => void confirmRebind()}
              >
                Confirm re-bind
              </Button>
            )}
          </>
        }
      >
        {rebindListing && (
          <div className="space-y-3 text-sm text-gray-900">
            <p className="text-gray-600">
              Point this listing at a recreated Shopee item on the same shop.
              Eligible when the listing is gone or never pushed. Does not call
              Shopee delete.
            </p>
            {rebindListing.ext_product_id ? (
              <p className="text-xs text-gray-500">
                Current ext_product_id:{' '}
                <span className="font-mono">{rebindListing.ext_product_id}</span>
                {rebindListing.absent_since
                  ? ` · gone since ${formatAbsentSince(rebindListing.absent_since)}`
                  : ''}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Draft listing (no ext_product_id yet).</p>
            )}

            {rebindError && (
              <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                {rebindError}
              </p>
            )}

            {rebindResult ? (
              <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                <p>
                  Bound to{' '}
                  <span className="font-mono">{rebindResult.ext_product_id}</span>
                  {rebindResult.previous_ext_product_id
                    ? ` (was ${rebindResult.previous_ext_product_id})`
                    : ''}
                  .
                </p>
                <p className="mt-1 text-xs">
                  Variants rematched: {rebindResult.variants_rematched} ·
                  unmatched models: {rebindResult.unmatched_models}
                </p>
              </div>
            ) : (
              <>
                <Input
                  label="Shopee item_id (ext_product_id)"
                  value={rebindExtId}
                  onChange={(e) => setRebindExtId(e.target.value)}
                  placeholder="Paste item_id or pick a suggestion"
                  disabled={rebindBusy}
                />

                <div>
                  <p className="mb-1 text-xs font-medium text-gray-700">
                    Suggestions (exact item_sku ↔ product_code / listing SKU)
                  </p>
                  {rebindBusy && rebindSuggestions.length === 0 ? (
                    <p className="text-xs text-gray-500">Loading…</p>
                  ) : rebindSuggestions.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No SKU matches on the first shop page. Paste the new
                      item_id manually if you know it.
                    </p>
                  ) : (
                    <ul className="max-h-48 space-y-1 overflow-auto rounded border border-gray-100 p-2">
                      {rebindSuggestions.map((s) => (
                        <li key={s.ext_product_id}>
                          <label className="flex cursor-pointer items-start gap-2 text-xs">
                            <input
                              type="radio"
                              name="rebind-suggestion"
                              className="mt-0.5"
                              checked={rebindExtId === s.ext_product_id}
                              onChange={() => setRebindExtId(s.ext_product_id)}
                            />
                            <span>
                              <span className="font-mono">{s.ext_product_id}</span>
                              {s.item_sku ? ` · ${s.item_sku}` : ''}
                              {s.item_name ? (
                                <span className="text-gray-600">
                                  {' '}
                                  — {s.item_name}
                                </span>
                              ) : null}
                              <span className="block text-gray-500">
                                {s.reason}
                                {s.item_status ? ` · ${s.item_status}` : ''}
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {rebindHasNextPage ? (
                    <p className="mt-1 text-xs text-amber-800">
                      Shop has more items beyond the first page — paste
                      item_id if the match is not listed.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(stockModalListing)}
        onClose={() => setStockModalListing(null)}
        title="Update Shopee stock"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setStockModalListing(null)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={Boolean(busyKey)}
              isLoading={busyKey === 'stock-dry'}
              onClick={() => {
                if (!stockModalListing) return;
                void submitStock(stockModalListing, true);
              }}
            >
              Dry-run
            </Button>
            <Button
              disabled={Boolean(busyKey)}
              isLoading={busyKey === 'stock-run'}
              onClick={() => {
                if (!stockModalListing) return;
                void submitStock(stockModalListing, false);
              }}
            >
              Set stock
            </Button>
          </>
        }
      >
        {stockModalListing && (
          <StockFormBody
            listing={stockModalListing}
            stockInputs={stockInputs}
            setStockInputs={setStockInputs}
            confirmLive={stockConfirmLive}
            setConfirmLive={setStockConfirmLive}
            live={isLiveStatus(stockModalListing.ext_status)}
          />
        )}
      </Modal>
    </Card>
  );
}

function StockFormBody({
  listing,
  stockInputs,
  setStockInputs,
  confirmLive,
  setConfirmLive,
  live,
}: {
  listing: ChannelListingDetail;
  stockInputs: Record<number, { expected: string; next: string }>;
  setStockInputs: Dispatch<
    SetStateAction<Record<number, { expected: string; next: string }>>
  >;
  confirmLive: boolean;
  setConfirmLive: (v: boolean) => void;
  live: boolean;
}) {
  const rows = useMemo(
    () => (listing.variants ?? []).filter((lv) => !lv.absent_since),
    [listing.variants]
  );

  return (
    <div className="space-y-3 text-sm text-gray-900">
      <p className="text-gray-600">
        Absolute stock only. Expected stock must match the current Shopee value
        (race guard). Pull first if unsure. Gone variants are excluded.
      </p>
      {live && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={confirmLive}
            onChange={(e) => setConfirmLive(e.target.checked)}
          />
          Confirm live listing write
        </label>
      )}
      <div className="space-y-3">
        {rows.map((lv) => {
          const row = stockInputs[lv.product_variant_id] || {
            expected: '0',
            next: '0',
          };
          return (
            <div
              key={lv.id}
              className="grid gap-2 rounded border border-gray-100 p-2 sm:grid-cols-3"
            >
              <div className="text-xs text-gray-600">
                Variant #{lv.product_variant_id}
                <div className="font-mono text-gray-900">
                  {lv.ext_sku || '—'}
                </div>
              </div>
              <Input
                label="Expected (current)"
                type="number"
                min={0}
                value={row.expected}
                onChange={(e) =>
                  setStockInputs((prev) => ({
                    ...prev,
                    [lv.product_variant_id]: {
                      ...row,
                      expected: e.target.value,
                    },
                  }))
                }
              />
              <Input
                label="New stock"
                type="number"
                min={0}
                value={row.next}
                onChange={(e) =>
                  setStockInputs((prev) => ({
                    ...prev,
                    [lv.product_variant_id]: {
                      ...row,
                      next: e.target.value,
                    },
                  }))
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
