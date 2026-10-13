'use client';

import {
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

  const listings = product.listings ?? [];

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
    const variants = (listing.variants ?? []).map((lv) => {
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

  return (
    <Card title="Channel listings">
      {actionError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
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

            return (
              <div
                key={listing.id}
                className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={SYNC_STATUS_LABELS[sync] || listing.sync_status}
                    colorClass={
                      SYNC_STATUS_COLORS[sync] || 'bg-gray-100 text-gray-800'
                    }
                  />
                  <span className="text-gray-900">
                    Account #{listing.marketplace_account_id}
                  </span>
                  {leaseBusy && (
                    <span className="text-xs text-amber-800">
                      Push in progress…
                    </span>
                  )}
                </div>

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
                          <th className="py-1">Ext. stock</th>
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
                            <td className="py-1">{lv.ext_stock ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                      disabled={leaseBusy || Boolean(busyKey)}
                      isLoading={busyKey === `${prefix}-dry`}
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
                        leaseBusy ||
                        Boolean(busyKey) ||
                        (conflict && !overwriteConflict)
                      }
                      isLoading={busyKey === `${prefix}-push`}
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
                          disabled={
                            leaseBusy || Boolean(busyKey) || conflict
                          }
                          isLoading={busyKey === `${prefix}-publish`}
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
                          disabled={
                            leaseBusy || Boolean(busyKey) || conflict
                          }
                          isLoading={busyKey === `${prefix}-unlist`}
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
                          disabled={
                            leaseBusy || Boolean(busyKey) || conflict
                          }
                          onClick={() => openStockModal(listing)}
                        >
                          Update stock
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {canWrite && (live || conflict) && (
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
  const rows = useMemo(() => listing.variants ?? [], [listing.variants]);

  return (
    <div className="space-y-3 text-sm text-gray-900">
      <p className="text-gray-600">
        Absolute stock only. Expected stock must match the current Shopee value
        (race guard). Pull first if unsure.
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
