import { PlayerWithProjection } from '@shared/schema';

interface PlayerLockBanControlsProps {
  player: PlayerWithProjection;
  onPlayerUpdate: (updates: Partial<PlayerWithProjection>) => void;
}

export default function PlayerLockBanControls({
  player,
  onPlayerUpdate,
}: PlayerLockBanControlsProps) {
  return <div>Player Lock Ban Controls Component</div>;
}
