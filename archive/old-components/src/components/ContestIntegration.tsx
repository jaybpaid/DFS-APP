/**
 * Contest Integration Component
 * Handles direct uploads to DraftKings, FanDuel, and SuperDraft
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Key,
  Globe,
  Clock,
  DollarSign,
} from 'lucide-react';

interface Contest {
  id: string;
  name: string;
  platform: 'draftkings' | 'fanduel' | 'superdraft';
  entry_fee: number;
  total_prizes: number;
  max_entries: number;
  start_time: string;
  slate_id: string;
  contest_type: 'gpp' | 'cash' | 'tournament';
  status: 'open' | 'closed' | 'live' | 'completed';
}

interface UploadStatus {
  contest_id: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  lineup_count: number;
  timestamp: string;
}

interface PlatformCredentials {
  platform: string;
  username: string;
  password: string;
  api_key?: string;
  enabled: boolean;
  last_sync: string;
}

export const ContestIntegration: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContests, setSelectedContests] = useState<Set<string>>(new Set());
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [credentials, setCredentials] = useState<PlatformCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedLineups, setSelectedLineups] = useState<any[]>([]);

  useEffect(() => {
    loadContests();
    loadCredentials();
    loadUploadHistory();
  }, []);

  const loadContests = async () => {
    try {
      const response = await fetch('/api/contests/available');
      const data = await response.json();

      if (data.success) {
        setContests(data.contests);
      }
    } catch (error) {
      console.error('Error loading contests:', error);
    }
  };

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/contests/credentials');
      const data = await response.json();

      if (data.success) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUploadHistory = async () => {
    try {
      const response = await fetch('/api/contests/upload-history');
      const data = await response.json();

      if (data.success) {
        setUploadStatuses(data.uploads);
      }
    } catch (error) {
      console.error('Error loading upload history:', error);
    }
  };

  const handleContestSelect = (contestId: string) => {
    const newSelected = new Set(selectedContests);
    if (newSelected.has(contestId)) {
      newSelected.delete(contestId);
    } else {
      newSelected.add(contestId);
    }
    setSelectedContests(newSelected);
  };

  const uploadToContests = async () => {
    if (selectedContests.size === 0 || selectedLineups.length === 0) return;

    setUploading(true);

    try {
      const response = await fetch('/api/contests/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contest_ids: Array.from(selectedContests),
          lineups: selectedLineups,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadStatuses(prev => [...prev, ...data.upload_results]);
        setSelectedContests(new Set());

        // Show success message
        alert(`Successfully uploaded lineups to ${selectedContests.size} contests!`);
      } else {
        alert(`Upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error uploading to contests:', error);
      alert('Upload failed due to network error');
    } finally {
      setUploading(false);
    }
  };

  const updateCredentials = async (
    platform: string,
    creds: Partial<PlatformCredentials>
  ) => {
    try {
      const response = await fetch('/api/contests/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          ...creds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCredentials(prev =>
          prev.map(c => (c.platform === platform ? { ...c, ...creds } : c))
        );
        alert('Credentials updated successfully!');
      } else {
        alert(`Failed to update credentials: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      alert('Failed to update credentials');
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'draftkings':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fanduel':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'superdraft':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Contest Integration</h2>
        <Button onClick={loadContests} variant='outline'>
          <Globe className='h-4 w-4 mr-2' />
          Refresh Contests
        </Button>
      </div>

      <Tabs defaultValue='contests' className='w-full'>
        <TabsList>
          <TabsTrigger value='contests'>Available Contests</TabsTrigger>
          <TabsTrigger value='upload'>Upload Lineups</TabsTrigger>
          <TabsTrigger value='history'>Upload History</TabsTrigger>
          <TabsTrigger value='settings'>Platform Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='contests' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Available Contests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {contests.map(contest => (
                  <div
                    key={contest.id}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                  >
                    <div className='flex items-center space-x-4'>
                      <input
                        type='checkbox'
                        checked={selectedContests.has(contest.id)}
                        onChange={() => handleContestSelect(contest.id)}
                        className='h-4 w-4'
                      />

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-semibold'>{contest.name}</h3>
                          <Badge className={getPlatformColor(contest.platform)}>
                            {contest.platform.toUpperCase()}
                          </Badge>
                          <Badge variant='outline'>
                            {contest.contest_type.toUpperCase()}
                          </Badge>
                        </div>

                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <DollarSign className='h-3 w-3' />
                            Entry: {formatCurrency(contest.entry_fee)}
                          </div>
                          <div className='flex items-center gap-1'>
                            <DollarSign className='h-3 w-3' />
                            Prizes: {formatCurrency(contest.total_prizes)}
                          </div>
                          <div>Max Entries: {contest.max_entries}</div>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatDateTime(contest.start_time)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={contest.status === 'open' ? 'default' : 'secondary'}
                        className={
                          contest.status === 'open' ? 'bg-green-100 text-green-800' : ''
                        }
                      >
                        {contest.status.toUpperCase()}
                      </Badge>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          window.open(
                            `https://${contest.platform}.com/contest/${contest.id}`,
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}

                {contests.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    No contests available. Check your platform credentials.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='upload' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Upload Lineups to Contests</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Select contests and lineups to upload. Make sure your platform
                  credentials are configured.
                </AlertDescription>
              </Alert>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <h4 className='font-semibold mb-2'>
                    Selected Contests ({selectedContests.size})
                  </h4>
                  <div className='space-y-2 max-h-40 overflow-y-auto'>
                    {Array.from(selectedContests).map(contestId => {
                      const contest = contests.find(c => c.id === contestId);
                      return contest ? (
                        <div
                          key={contestId}
                          className='flex items-center justify-between p-2 bg-gray-50 rounded'
                        >
                          <span className='text-sm'>{contest.name}</span>
                          <Badge
                            className={getPlatformColor(contest.platform)}
                            size='sm'
                          >
                            {contest.platform}
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold mb-2'>
                    Lineups to Upload ({selectedLineups.length})
                  </h4>
                  <Button
                    variant='outline'
                    onClick={() => {
                      // This would open a lineup selector modal
                      // For now, we'll simulate having lineups selected
                      setSelectedLineups([
                        { id: '1', projected_score: 145.2 },
                        { id: '2', projected_score: 143.8 },
                        { id: '3', projected_score: 142.1 },
                      ]);
                    }}
                  >
                    Select Lineups
                  </Button>
                </div>
              </div>

              <div className='flex justify-center pt-4'>
                <Button
                  onClick={uploadToContests}
                  disabled={
                    uploading ||
                    selectedContests.size === 0 ||
                    selectedLineups.length === 0
                  }
                  className='bg-green-600 hover:bg-green-700'
                >
                  {uploading ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className='h-4 w-4 mr-2' />
                      Upload to {selectedContests.size} Contest
                      {selectedContests.size !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {uploadStatuses.map((upload, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center space-x-3'>
                      {upload.status === 'success' ? (
                        <CheckCircle className='h-5 w-5 text-green-600' />
                      ) : upload.status === 'error' ? (
                        <AlertCircle className='h-5 w-5 text-red-600' />
                      ) : (
                        <Clock className='h-5 w-5 text-yellow-600' />
                      )}

                      <div>
                        <p className='font-medium'>Contest: {upload.contest_id}</p>
                        <p className='text-sm text-gray-600'>{upload.message}</p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <p className={`font-medium ${getStatusColor(upload.status)}`}>
                        {upload.status.toUpperCase()}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {upload.lineup_count} lineups
                      </p>
                      <p className='text-xs text-gray-400'>
                        {formatDateTime(upload.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {uploadStatuses.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    No upload history available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Platform Credentials</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {['draftkings', 'fanduel', 'superdraft'].map(platform => {
                const cred = credentials.find(c => c.platform === platform) || {
                  platform,
                  username: '',
                  password: '',
                  enabled: false,
                  last_sync: '',
                };

                return (
                  <div key={platform} className='border rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='font-semibold capitalize flex items-center gap-2'>
                        <Badge className={getPlatformColor(platform)}>{platform}</Badge>
                        Integration
                      </h3>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-500'>
                          {cred.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${cred.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium mb-1'>
                          Username
                        </label>
                        <Input
                          type='text'
                          value={cred.username}
                          onChange={e => {
                            const newCreds = credentials.map(c =>
                              c.platform === platform
                                ? { ...c, username: e.target.value }
                                : c
                            );
                            setCredentials(newCreds);
                          }}
                          placeholder='Enter username'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium mb-1'>
                          Password
                        </label>
                        <Input
                          type='password'
                          value={cred.password}
                          onChange={e => {
                            const newCreds = credentials.map(c =>
                              c.platform === platform
                                ? { ...c, password: e.target.value }
                                : c
                            );
                            setCredentials(newCreds);
                          }}
                          placeholder='Enter password'
                        />
                      </div>
                    </div>

                    <div className='flex items-center justify-between mt-4'>
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={cred.enabled}
                          onChange={e => {
                            const newCreds = credentials.map(c =>
                              c.platform === platform
                                ? { ...c, enabled: e.target.checked }
                                : c
                            );
                            setCredentials(newCreds);
                          }}
                          className='h-4 w-4'
                        />
                        <label className='text-sm'>Enable integration</label>
                      </div>

                      <Button
                        onClick={() => updateCredentials(platform, cred)}
                        size='sm'
                      >
                        <Settings className='h-4 w-4 mr-1' />
                        Save
                      </Button>
                    </div>

                    {cred.last_sync && (
                      <p className='text-xs text-gray-500 mt-2'>
                        Last sync: {formatDateTime(cred.last_sync)}
                      </p>
                    )}
                  </div>
                );
              })}

              <Alert>
                <Key className='h-4 w-4' />
                <AlertDescription>
                  Your credentials are encrypted and stored securely. They are only used
                  for contest uploads and never shared with third parties.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContestIntegration;
