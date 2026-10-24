'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/Card';

export default function StockHubPage() {
  useEffect(() => {
    document.title = 'Stock · EcomHub';
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock</h1>
      </div>
      <Card title="Coming soon">
        <p className="text-sm text-gray-600">
          Stock screens land with FE52 / FE53 after Core F9d / F9e. This hub is
          reserved so the top bar matches the target IA (FE57).
        </p>
      </Card>
    </div>
  );
}
