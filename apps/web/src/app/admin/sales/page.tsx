'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrackableView } from '@/components/analytics/tracker';

interface Listing {
  id: string;
  price: number;
  views: number;
  clicks: number;
  vehicle: { make: string; model: string; year: number };
}

export default function AdminSalesPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    api<Listing[]>('/sales/listings').then(setListings).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Продажа авто</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <TrackableView key={l.id} metric="listing.views" dimensions={{ listing_id: l.id }}>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold">
                {l.vehicle.make} {l.vehicle.model} {l.vehicle.year}
              </h3>
              <p className="mt-2 text-2xl font-bold text-brand-700">
                ${l.price.toLocaleString()}
              </p>
              <div className="mt-4 flex gap-4 text-sm text-slate-500">
                <span>👁 {l.views}</span>
                <span>🖱 {l.clicks}</span>
              </div>
            </div>
          </TrackableView>
        ))}
        {listings.length === 0 && (
          <p className="text-slate-500">Объявлений пока нет</p>
        )}
      </div>
    </div>
  );
}
