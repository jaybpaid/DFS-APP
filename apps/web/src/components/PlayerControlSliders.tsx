import { PlayerWithProjection } from '@shared/schema';

interface PlayerControlSlidersProps {
  player: PlayerWithProjection;
  onPlayerUpdate: (updates: Partial<PlayerWithProjection>) => void;
}

export default function PlayerControlSliders({
  player,
  onPlayerUpdate,
}: PlayerControlSlidersProps) {
  return <div>Player Control Sliders Component</div>;
}
