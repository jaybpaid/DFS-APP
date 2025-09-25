import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface RSSEpisode {
  title: string;
  description: string;
  published_date: string;
  link: string;
  guid: string;
  duration?: string;
  author?: string;
  categories: string[];
  enclosure_url?: string;
  player_mentions: string[];
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  source_type: string;
  categories: string[];
  url?: string;
  cost_tier: string;
  update_frequency: string;
  reliability_score: number;
  priority: number;
  tags: string[];
  is_active: boolean;
}

const RSSFeedViewer: React.FC = () => {
  const [feedData, setFeedData] = useState<RSSEpisode[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fantasyOnly, setFantasyOnly] = useState(true);
  const [recentDays, setRecentDays] = useState<number>(7);
  const [activeTab, setActiveTab] = useState('episodes');

  // Fetch RSS episodes
  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        fantasy_only: fantasyOnly.toString(),
        recent_days: recentDays.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/rss/episodes/recent?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFeedData(data.episodes || []);
      }
    } catch (error) {
      console.error('Error fetching RSS episodes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data sources
  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources/by-category/news_content');
      if (response.ok) {
        const data = await response.json();
        setDataSources(data.sources || []);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  useEffect(() => {
    fetchEpisodes();
    fetchDataSources();
  }, [fantasyOnly, recentDays]);

  // Filter episodes based on search
  const filteredEpisodes = feedData.filter(
    episode =>
      episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.player_mentions.some(player =>
        player.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const EpisodeCard: React.FC<{ episode: RSSEpisode }> = ({ episode }) => (
    <div className='bg-white shadow rounded-lg p-6 mb-4 hover:shadow-md transition-shadow'>
      <div className='flex justify-between items-start mb-3'>
        <h3 className='text-lg font-semibold text-gray-900 leading-tight pr-4'>
          {episode.title}
        </h3>
        <button
          onClick={() => window.open(episode.link, '_blank')}
          className='flex-shrink-0 p-1 text-gray-400 hover:text-gray-600'
        >
          <ArrowTopRightOnSquareIcon className='h-5 w-5' />
        </button>
      </div>

      <div className='flex items-center gap-4 text-sm text-gray-500 mb-3'>
        <div className='flex items-center gap-1'>
          <CalendarIcon className='h-4 w-4' />
          {formatDate(episode.published_date)}
        </div>
        {episode.duration && (
          <div className='flex items-center gap-1'>
            <ClockIcon className='h-4 w-4' />
            {episode.duration}
          </div>
        )}
        {episode.author && (
          <div className='flex items-center gap-1'>
            <UserIcon className='h-4 w-4' />
            {episode.author}
          </div>
        )}
      </div>

      <p className='text-gray-600 mb-3 line-clamp-3'>{episode.description}</p>

      {episode.player_mentions.length > 0 && (
        <div className='mb-3'>
          <p className='text-sm font-medium text-gray-700 mb-2'>Player Mentions:</p>
          <div className='flex flex-wrap gap-1'>
            {episode.player_mentions.slice(0, 8).map((player, index) => (
              <span
                key={index}
                className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
              >
                {player}
              </span>
            ))}
            {episode.player_mentions.length > 8 && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                +{episode.player_mentions.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {episode.categories.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {episode.categories.map((category, index) => (
            <span
              key={index}
              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
            >
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const DataSourceCard: React.FC<{ source: DataSource }> = ({ source }) => (
    <div className='bg-white shadow rounded-lg p-6 mb-4'>
      <div className='flex justify-between items-start mb-3'>
        <h3 className='text-lg font-semibold text-gray-900'>{source.name}</h3>
        <div className='flex items-center gap-2'>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              source.cost_tier === 'free'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {source.cost_tier}
          </span>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              source.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {source.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <p className='text-gray-600 mb-4'>{source.description}</p>

      <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
        <div>
          <span className='font-medium text-gray-700'>Type:</span> {source.source_type}
        </div>
        <div>
          <span className='font-medium text-gray-700'>Priority:</span> {source.priority}
        </div>
        <div>
          <span className='font-medium text-gray-700'>Frequency:</span>{' '}
          {source.update_frequency}
        </div>
        <div>
          <span className='font-medium text-gray-700'>Reliability:</span>{' '}
          {(source.reliability_score * 100).toFixed(0)}%
        </div>
      </div>

      {source.tags.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {source.tags.map((tag, index) => (
            <span
              key={index}
              className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Fantasy Football Content Hub
        </h1>
        <p className='text-gray-600'>
          Latest fantasy football insights from RSS feeds and data sources
        </p>
      </div>

      {/* Tab Navigation */}
      <div className='border-b border-gray-200 mb-6'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('episodes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'episodes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            RSS Episodes
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sources'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Sources
          </button>
        </nav>
      </div>

      {activeTab === 'episodes' && (
        <div className='space-y-6'>
          {/* Controls */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Filters & Controls
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='relative'>
                <MagnifyingGlassIcon className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search episodes...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <select
                value={recentDays.toString()}
                onChange={e => setRecentDays(parseInt(e.target.value))}
                className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='1'>Last 24 hours</option>
                <option value='3'>Last 3 days</option>
                <option value='7'>Last week</option>
                <option value='14'>Last 2 weeks</option>
                <option value='30'>Last month</option>
              </select>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='fantasy-only'
                  checked={fantasyOnly}
                  onChange={e => setFantasyOnly(e.target.checked)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label
                  htmlFor='fantasy-only'
                  className='ml-2 block text-sm text-gray-900'
                >
                  Fantasy only
                </label>
              </div>

              <button
                onClick={fetchEpisodes}
                disabled={loading}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
              >
                <ArrowPathIcon
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Episodes List */}
          <div>
            {loading ? (
              <div className='text-center py-8'>
                <ArrowPathIcon className='h-8 w-8 animate-spin mx-auto mb-4 text-gray-400' />
                <p className='text-gray-500'>Loading episodes...</p>
              </div>
            ) : filteredEpisodes.length > 0 ? (
              <>
                <div className='text-sm text-gray-500 mb-4'>
                  Showing {filteredEpisodes.length} episodes
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
                {filteredEpisodes.map((episode, index) => (
                  <EpisodeCard key={episode.guid || index} episode={episode} />
                ))}
              </>
            ) : (
              <div className='bg-white shadow rounded-lg p-8 text-center'>
                <p className='text-gray-500'>
                  No episodes found. Try adjusting your filters or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className='space-y-6'>
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-2'>
              Available Data Sources
            </h2>
            <p className='text-gray-600'>
              Comprehensive list of fantasy football data sources and RSS feeds
            </p>
          </div>

          <div>
            {dataSources.length > 0 ? (
              dataSources.map(source => (
                <DataSourceCard key={source.id} source={source} />
              ))
            ) : (
              <div className='bg-white shadow rounded-lg p-8 text-center'>
                <p className='text-gray-500'>Loading data sources...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RSSFeedViewer;
