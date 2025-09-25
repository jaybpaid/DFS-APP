import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Upload, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { csvUploadFile } from '@/lib/csvUtils';
import DashboardNav from './DashboardNav';

interface SidebarProps {
  selectedSport: 'nfl' | 'nba';
  selectedSite: 'dk' | 'fd';
  onSportChange: (sport: 'nfl' | 'nba') => void;
  onSiteChange: (site: 'dk' | 'fd') => void;
  onSlateUploaded: (slateId: string) => void;
  onRefreshData: () => void;
}

export default function Sidebar({
  selectedSport,
  selectedSite,
  onSportChange,
  onSiteChange,
  onSlateUploaded,
  onRefreshData,
}: SidebarProps) {
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    stats: string;
  } | null>(null);
  const [dataSources, setDataSources] = useState({
    nflfastr: true,
    injuries: true,
    weather: true,
    odds: true,
  });
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');

    try {
      const result = await csvUploadFile(file);

      if (result.success) {
        setUploadedFile({
          name: file.name,
          stats: `${result.playersImported} players • $${result.slate?.salaryCap?.toLocaleString()} cap`,
        });
        setUploadStatus('success');

        if (result.slate?.id) {
          onSlateUploaded(result.slate.id);
        }

        toast({
          title: 'CSV Imported Successfully',
          description: `Imported ${result.playersImported} players for ${result.slate?.sport?.toUpperCase()} ${result.slate?.site?.toUpperCase()}`,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description:
          'There was an error importing your CSV file. Please check the format and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshData = async () => {
    try {
      await onRefreshData();
      toast({
        title: 'Data Refreshed',
        description: 'All data sources have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'There was an error refreshing data sources.',
        variant: 'destructive',
      });
    }
  };

  return (
    <aside className='w-72 border-r border-border bg-card/50 p-6 space-y-6'>
      {/* Dashboard Navigation */}
      <div>
        <DashboardNav />
      </div>

      <Separator />

      {/* Configuration */}
      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
          Configuration
        </h3>
        <div className='grid grid-cols-2 gap-2'>
          <Select value={selectedSport} onValueChange={onSportChange}>
            <SelectTrigger data-testid='select-sport'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='nfl'>NFL</SelectItem>
              <SelectItem value='nba'>NBA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSite} onValueChange={onSiteChange}>
            <SelectTrigger data-testid='select-site'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='dk'>DraftKings</SelectItem>
              <SelectItem value='fd'>FanDuel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CSV Import */}
      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
          Salary Import
        </h3>

        <div className='border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors'>
          <Upload className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-sm text-muted-foreground mb-2'>
            Drop CSV file or click to browse
          </p>
          <Input
            type='file'
            accept='.csv'
            onChange={handleFileUpload}
            className='hidden'
            id='csv-upload'
            data-testid='input-csv-upload'
          />
          <Label
            htmlFor='csv-upload'
            className='text-sm text-primary hover:underline cursor-pointer'
          >
            Upload Salary CSV
          </Label>
        </div>

        {uploadedFile && uploadStatus === 'success' && (
          <div className='bg-primary/10 border border-primary/20 rounded-md p-3'>
            <div className='flex items-center gap-2'>
              <span className='status-dot status-success'></span>
              <span className='text-sm font-medium'>{uploadedFile.name}</span>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>{uploadedFile.stats}</p>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className='bg-accent/10 border border-accent/20 rounded-md p-3'>
            <div className='flex items-center gap-2'>
              <RefreshCw className='w-4 h-4 animate-spin' />
              <span className='text-sm font-medium'>Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Data Sources */}
      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
          Data Sources
        </h3>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <Checkbox
              id='nflfastr'
              checked={dataSources.nflfastr}
              onCheckedChange={checked =>
                setDataSources(prev => ({ ...prev, nflfastr: checked as boolean }))
              }
            />
            <Label htmlFor='nflfastr' className='text-sm'>
              NFLfastR (Core Stats)
            </Label>
            <span className='status-dot status-success ml-auto'></span>
          </div>

          <div className='flex items-center gap-3'>
            <Checkbox
              id='injuries'
              checked={dataSources.injuries}
              onCheckedChange={checked =>
                setDataSources(prev => ({ ...prev, injuries: checked as boolean }))
              }
            />
            <Label htmlFor='injuries' className='text-sm'>
              Injury Reports
            </Label>
            <span className='status-dot status-success ml-auto'></span>
          </div>

          <div className='flex items-center gap-3'>
            <Checkbox
              id='weather'
              checked={dataSources.weather}
              onCheckedChange={checked =>
                setDataSources(prev => ({ ...prev, weather: checked as boolean }))
              }
            />
            <Label htmlFor='weather' className='text-sm'>
              Weather Data
            </Label>
            <span className='status-dot status-warning ml-auto'></span>
          </div>

          <div className='flex items-center gap-3'>
            <Checkbox
              id='odds'
              checked={dataSources.odds}
              onCheckedChange={checked =>
                setDataSources(prev => ({ ...prev, odds: checked as boolean }))
              }
            />
            <Label htmlFor='odds' className='text-sm'>
              Vegas Odds
            </Label>
            <span className='status-dot status-success ml-auto'></span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
          Quick Actions
        </h3>
        <div className='space-y-2'>
          <Button
            onClick={handleRefreshData}
            className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
            data-testid='button-refresh-data'
          >
            <RefreshCw className='w-4 h-4 mr-2' />
            Refresh Data Sources
          </Button>

          <Button
            variant='secondary'
            className='w-full'
            data-testid='button-generate-projections'
          >
            <TrendingUp className='w-4 h-4 mr-2' />
            Generate Projections
          </Button>

          <Button
            className='w-full bg-accent text-accent-foreground hover:bg-accent/90'
            data-testid='button-optimize-lineups'
          >
            <Zap className='w-4 h-4 mr-2' />
            Optimize Lineups
          </Button>
        </div>
      </div>
    </aside>
  );
}
