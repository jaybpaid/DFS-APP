export default function AttributionPanel() {
  return (
    <div className='bg-card border border-border rounded-lg p-4'>
      <h3 className='text-sm font-medium mb-3'>Data Attribution</h3>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-xs'>
        <div>
          <span className='font-medium'>Core Stats:</span>
          <p className='text-muted-foreground'>nflfastR, NBA API</p>
        </div>
        <div>
          <span className='font-medium'>Injuries:</span>
          <p className='text-muted-foreground'>NFL.com, FantasyPros</p>
        </div>
        <div>
          <span className='font-medium'>Vegas Lines:</span>
          <p className='text-muted-foreground'>TheOddsAPI</p>
        </div>
        <div>
          <span className='font-medium'>Weather:</span>
          <p className='text-muted-foreground'>OpenWeather, NOAA</p>
        </div>
      </div>
      <p className='text-xs text-muted-foreground mt-2'>
        All data sources used in accordance with their respective Terms of Service. Last
        updated: <span>2 minutes ago</span>
      </p>
    </div>
  );
}
