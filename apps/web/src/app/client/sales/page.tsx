'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrackableView } from '@/components/analytics/tracker';

interface Listing {
  id: string;
  price: number;
  vehicle: { make: string; model: string; year: number };
}

export default function ClientSalesPage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    api<Listing[]>('/sales/listings').then(setListings).catch(console.error);
  }, []);

  const handleClick = async (id: string, target: string) => {
    await api(`/sales/listings/${id}/click`, {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Авто в продаже</h1>
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
              <button
                onClick={() => handleClick(l.id, 'contact')}
                className="mt-4 w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Связаться
              </button>
            </div>
          </TrackableView>
        ))}
      </div>
    </div>
  );
}
