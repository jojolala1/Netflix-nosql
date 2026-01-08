'use client';

import { useEffect, useState } from 'react';

interface Stats {
  users: number;
  contents: number;
  watchHistory: number;
}

interface TopContent {
  title: string;
  type: string;
  genres: string[];
  totalViews: number;
}

interface TopUser {
  email: string;
  country: string;
  age: number;
  totalWatchTimeHours: number;
}

interface AverageAge {
  averageAge: number;
  minAge: number;
  maxAge: number;
  uniqueUsers: number;
}

interface CountryView {
  country: string;
  totalViews: number;
  uniqueUsers: number;
  averageViewsPerUser: number;
}

interface DeviceView {
  device: string;
  totalViews: number;
  totalWatchTimeHours: number;
  uniqueUsers: number;
}

interface GenreView {
  genre: string;
  totalViews: number;
  totalWatchTimeHours: number;
}

const API_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3000' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topContents, setTopContents] = useState<TopContent[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [averageAge, setAverageAge] = useState<AverageAge | null>(null);
  const [viewsByCountry, setViewsByCountry] = useState<CountryView[]>([]);
  const [viewsByDevice, setViewsByDevice] = useState<DeviceView[]>([]);
  const [topGenres, setTopGenres] = useState<GenreView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, topContentsRes, topUsersRes, averageAgeRes, countryRes, deviceRes, genresRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/top-contents`),
        fetch(`${API_URL}/api/top-users`),
        fetch(`${API_URL}/api/average-age`),
        fetch(`${API_URL}/api/views-by-country`),
        fetch(`${API_URL}/api/views-by-device`),
        fetch(`${API_URL}/api/top-genres`)
      ]);

      const [statsData, topContentsData, topUsersData, averageAgeData, countryData, deviceData, genresData] = await Promise.all([
        statsRes.json(),
        topContentsRes.json(),
        topUsersRes.json(),
        averageAgeRes.json(),
        countryRes.json(),
        deviceRes.json(),
        genresRes.json()
      ]);

      setStats(statsData);
      setTopContents(topContentsData);
      setTopUsers(topUsersData);
      setAverageAge(averageAgeData);
      setViewsByCountry(countryData);
      setViewsByDevice(deviceData);
      setTopGenres(genresData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Plateforme de Streaming</h1>
          <p className="text-gray-400 text-lg">Tableau de bord d&apos;analyse</p>
        </header>

        {/* Statistiques générales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard title="Utilisateurs" value={stats.users.toLocaleString()} />
            <StatCard title="Contenus" value={stats.contents.toLocaleString()} />
            <StatCard title="Visionnages" value={stats.watchHistory.toLocaleString()} />
          </div>
        )}

        {/* Statistiques des spectateurs */}
        {averageAge && (
          <div className="bg-[#141414] rounded-lg border border-gray-800 p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Statistiques des spectateurs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">Âge moyen</div>
                <div className="text-2xl font-semibold text-white">{averageAge.averageAge} ans</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Âge minimum</div>
                <div className="text-2xl font-semibold text-white">{averageAge.minAge} ans</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Âge maximum</div>
                <div className="text-2xl font-semibold text-white">{averageAge.maxAge} ans</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Utilisateurs actifs</div>
                <div className="text-2xl font-semibold text-[#E50914]">{averageAge.uniqueUsers.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 5 contenus */}
          <div className="bg-[#141414] rounded-lg border border-gray-800 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Top 5 contenus les plus regardés</h2>
            <div className="space-y-4">
              {topContents.map((content, index) => (
                <div key={index} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{content.title}</div>
                      <div className="text-sm text-gray-400">
                        {content.type} • {content.genres.join(', ')}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-[#E50914]">
                        {content.totalViews.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">vues</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top genres */}
          <div className="bg-[#141414] rounded-lg border border-gray-800 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Genres les plus regardés</h2>
            <div className="space-y-4">
              {topGenres.slice(0, 5).map((genre, index) => (
                <div key={index} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-white">{genre.genre}</div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[#E50914]">
                        {genre.totalViews.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {genre.totalWatchTimeHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Répartition par appareil */}
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Répartition par type d&apos;appareil</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {viewsByDevice.map((device, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">{device.device}</div>
                <div className="text-2xl font-semibold text-white mb-1">
                  {device.totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {device.totalWatchTimeHours.toFixed(1)}h • {device.uniqueUsers} utilisateurs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par pays */}
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Répartition des vues par pays</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {viewsByCountry.slice(0, 8).map((country, index) => (
              <div key={index}>
                <div className="text-sm text-gray-400 mb-1">{country.country}</div>
                <div className="text-xl font-semibold text-white mb-1">
                  {country.totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {country.uniqueUsers} utilisateurs • {country.averageViewsPerUser.toFixed(1)} vues/user
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top utilisateurs */}
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Top 10 utilisateurs les plus actifs</h2>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div key={index} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{user.email}</div>
                    <div className="text-sm text-gray-400">
                      {user.country} • {user.age} ans
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-semibold text-[#E50914]">
                      {user.totalWatchTimeHours.toFixed(1)}h
                    </div>
                    <div className="text-xs text-gray-500">visionnage</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#141414] rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      <div className="text-sm text-gray-400 mb-2 uppercase tracking-wide">{title}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
