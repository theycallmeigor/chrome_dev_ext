'use client';

import { useState, useEffect } from 'react';

export default function StatsBar() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch((err) => console.error('Error fetching stats:', err));
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <StatCard
        label="Total Funnels"
        value={stats.totalFunnels}
        icon="📊"
      />
      <StatCard
        label="Total Pages"
        value={stats.totalPages}
        icon="📄"
      />
      <StatCard
        label="Favorite Funnels"
        value={stats.favoriteFunnels}
        icon="⭐"
      />
      <StatCard
        label="Favorite Pages"
        value={stats.favoritePages}
        icon="💫"
      />
      <StatCard
        label="A/B Tests"
        value={stats.splitTestPages}
        icon="🔀"
      />
      <StatCard
        label="Domains"
        value={stats.uniqueDomains}
        icon="🌐"
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
