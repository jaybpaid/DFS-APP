import { PlayerWithProjection } from '@shared/schema';

interface PlayerStatusIndicatorsProps {
  player: PlayerWithProjection;
  onPlayerUpdate: (updates: Partial<PlayerWithProjection>) => void;
}

export default function PlayerStatusIndicators({
  player,
  onPlayerUpdate,
}: PlayerStatusIndicatorsProps) {
  return <div>Player Status Indicators Component</div>;
}
