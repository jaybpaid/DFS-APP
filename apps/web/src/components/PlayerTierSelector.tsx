import { PlayerWithProjection } from '@shared/schema';

interface PlayerTierSelectorProps {
  player: PlayerWithProjection;
  onPlayerUpdate: (updates: Partial<PlayerWithProjection>) => void;
}

export default function PlayerTierSelector({
  player,
  onPlayerUpdate,
}: PlayerTierSelectorProps) {
  return <div>Player Tier Selector Component</div>;
}
