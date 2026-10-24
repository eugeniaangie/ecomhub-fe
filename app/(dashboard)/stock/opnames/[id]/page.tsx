'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  VariantSkuPicker,
  type PickedVariant,
} from '@/components/stock/VariantSkuPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { canWriteStock } from '@/lib/authHelpers';
import { stockApi } from '@/lib/services/stockApi';
import type { StockOpnameDetail } from '@/lib/types/stock';
import { formatQuantity } from '@/lib/utils/stockLabels';

type EditableLine = {
  product_variant_id: number;
  sku: string;
  product_name: string;
  system_quantity: number;
  counted_quantity: string;
  difference?: number;
};

export default function StockOpnameDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const canWrite = canWriteStock();

  const [detail, setDetail] = useState<StockOpnameDetail | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [addPicked, setAddPicked] = useState<PickedVariant | null>(null);
  const [addCounted, setAddCounted] = useState('0');

  const isDraft = detail?.status === 'draft';

  const applyDetail = (data: StockOpnameDetail) => {
    setDetail(data);
    setLines(
      (data.lines ?? []).map((l) => ({
        product_variant_id: l.product_variant_id,
        sku: l.sku,
        product_name: l.product_name,
        system_quantity: l.system_quantity,
        counted_quantity: String(l.counted_quantity),
        difference: l.difference,
      }))
    );
  };

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError('Invalid opname id');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const data = await stockApi.getOpname(id);
      applyDetail(data);
    } catch (err: unknown) {
      setDetail(null);
      setLines([]);
      setError(err instanceof Error ? err.message : 'Failed to load opname');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = `Opname #${id} · EcomHub`;
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveLines = async () => {
    if (!detail || !isDraft) return;
    const body = [];
    for (const line of lines) {
      const counted = Number(line.counted_quantity);
      if (!Number.isFinite(counted) || counted < 0) {
        setError('Counted quantity must be a number ≥ 0');
        return;
      }
      body.push({
        product_variant_id: line.product_variant_id,
        counted_quantity: counted,
      });
    }
    try {
      setBusy('save');
      setError('');
      const data = await stockApi.replaceOpnameLines(detail.id, { lines: body });
      applyDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save lines');
    } finally {
      setBusy('');
    }
  };

  const refreshSystem = async () => {
    if (!detail || !isDraft) return;
    try {
      setBusy('refresh');
      setError('');
      const data = await stockApi.refreshOpnameSystem(detail.id);
      applyDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setBusy('');
    }
  };

  const complete = async () => {
    if (!detail || !isDraft) return;
    if (
      !confirm(
        'Complete this opname? Core rejects if system qty drifted; otherwise posts opname_adjustment movements.'
      )
    ) {
      return;
    }
    try {
      setBusy('complete');
      setError('');
      // Persist counted first so complete sees latest counts
      const body = lines.map((line) => ({
        product_variant_id: line.product_variant_id,
        counted_quantity: Number(line.counted_quantity),
      }));
      if (body.some((l) => !Number.isFinite(l.counted_quantity) || l.counted_quantity < 0)) {
        setError('Counted quantity must be a number ≥ 0');
        return;
      }
      await stockApi.replaceOpnameLines(detail.id, { lines: body });
      const data = await stockApi.completeOpname(detail.id);
      applyDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    } finally {
      setBusy('');
    }
  };

  const addLine = () => {
    if (!addPicked) {
      setError('Pick a variant to add');
      return;
    }
    if (lines.some((l) => l.product_variant_id === addPicked.product_variant_id)) {
      setError('Variant already on this opname');
      return;
    }
    const counted = Number(addCounted);
    if (!Number.isFinite(counted) || counted < 0) {
      setError('Counted quantity must be ≥ 0');
      return;
    }
    setError('');
    setLines((prev) => [
      ...prev,
      {
        product_variant_id: addPicked.product_variant_id,
        sku: addPicked.sku,
        product_name: addPicked.product_name,
        system_quantity: 0,
        counted_quantity: String(counted),
      },
    ]);
    setAddPicked(null);
    setAddCounted('0');
  };

  const removeLine = (variantId: number) => {
    setLines((prev) => prev.filter((l) => l.product_variant_id !== variantId));
  };

  if (isLoading && !detail) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <PageHeader title="Opname" parent={{ label: 'Opname', href: '/stock/opnames' }} />
        <Card>
          <p className="text-sm text-red-700">{error || 'Not found'}</p>
          <Link href="/stock/opnames" className="mt-2 inline-block text-sm text-sky-700">
            Back to list
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Opname #${detail.id}`}
        parent={{ label: 'Opname', href: '/stock/opnames' }}
        actions={
          canWrite && isDraft ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={Boolean(busy)}
                isLoading={busy === 'refresh'}
                onClick={() => void refreshSystem()}
              >
                Refresh system qty
              </Button>
              <Button
                variant="secondary"
                disabled={Boolean(busy)}
                isLoading={busy === 'save'}
                onClick={() => void saveLines()}
              >
                Save lines
              </Button>
              <Button
                disabled={Boolean(busy) || lines.length === 0}
                isLoading={busy === 'complete'}
                onClick={() => void complete()}
              >
                Complete
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-wrap gap-4 text-sm text-gray-800">
          <p>
            <span className="text-gray-500">Date:</span>{' '}
            {String(detail.opname_date).slice(0, 10)}
          </p>
          <p>
            <span className="text-gray-500">Warehouse:</span>{' '}
            {detail.warehouse_code || `#${detail.warehouse_id}`}
            {detail.warehouse_name ? ` — ${detail.warehouse_name}` : ''}
          </p>
          <p>
            <span className="text-gray-500">Status:</span>{' '}
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                detail.status === 'completed'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-amber-50 text-amber-900'
              }`}
            >
              {detail.status}
            </span>
          </p>
          {detail.notes ? (
            <p>
              <span className="text-gray-500">Notes:</span> {detail.notes}
            </p>
          ) : null}
        </div>
      </Card>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Card title="Lines">
        {lines.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No lines yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">System</th>
                  <th className="px-2 py-2 font-medium">Counted</th>
                  <th className="px-2 py-2 font-medium">Difference</th>
                  {canWrite && isDraft ? (
                    <th className="px-2 py-2 font-medium" />
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line) => (
                  <tr key={line.product_variant_id} className="text-gray-900">
                    <td className="px-2 py-2 font-mono text-xs">{line.sku}</td>
                    <td className="px-2 py-2">{line.product_name}</td>
                    <td className="px-2 py-2">
                      {formatQuantity(line.system_quantity)}
                    </td>
                    <td className="px-2 py-2">
                      {canWrite && isDraft ? (
                        <input
                          type="number"
                          step="any"
                          min={0}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                          value={line.counted_quantity}
                          disabled={Boolean(busy)}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l) =>
                                l.product_variant_id === line.product_variant_id
                                  ? { ...l, counted_quantity: e.target.value }
                                  : l
                              )
                            )
                          }
                        />
                      ) : (
                        formatQuantity(Number(line.counted_quantity))
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {line.difference != null
                        ? formatQuantity(line.difference)
                        : '—'}
                    </td>
                    {canWrite && isDraft ? (
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          className="cursor-pointer text-xs text-red-600 hover:underline"
                          disabled={Boolean(busy)}
                          onClick={() => removeLine(line.product_variant_id)}
                        >
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canWrite && isDraft ? (
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700">Add line</p>
            <VariantSkuPicker
              value={addPicked}
              onChange={setAddPicked}
              disabled={Boolean(busy)}
            />
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-32">
                <Input
                  label="Counted"
                  type="number"
                  step="any"
                  min={0}
                  value={addCounted}
                  disabled={Boolean(busy)}
                  onChange={(e) => setAddCounted(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={Boolean(busy)}
                onClick={addLine}
              >
                Add to draft
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Save lines to snapshot system qty for new rows. Complete posts
              adjustments from the API (difference = counted − system).
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
