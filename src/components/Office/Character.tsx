import { useEffect, useState, memo } from 'react';
import type { PipelineState } from '../../store/pipelinesSlice';

interface Props {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  state: PipelineState;
  x: number; // top-left in scene units
  y: number;
  scale?: number;
}

// Body grid is 16 wide × 26 tall "pixels". A scale of 3 renders crisp
// 48×78 px characters. We build the whole character from <rect>s.
const GRID_W = 16;
const GRID_H = 26;

// --- Reusable parts ---------------------------------------------------------

function Head({
  skin,
  hair,
  blush,
  tilted,
  down,
}: {
  skin: string;
  hair: string;
  blush: string;
  tilted?: boolean;
  down?: boolean;
}) {
  const dy = down ? 1 : 0; // failed state: head drops a pixel
  return (
    <g transform={`translate(0, ${dy})`}>
      {/* hair back */}
      <rect x={4} y={1} width={8} height={3} fill={hair} />
      {/* face / skin */}
      <rect x={5} y={2} width={6} height={5} fill={skin} />
      {/* hair top fringe */}
      <rect x={4} y={2} width={7} height={2} fill={hair} />
      {/* hair side */}
      <rect x={11} y={3} width={1} height={2} fill={hair} />
      {/* neck */}
      <rect x={7} y={7} width={2} height={1} fill={skin} />
      {/* eyes (closed when head is down) */}
      {down ? (
        <>
          <rect x={6} y={5} width={2} height={1} fill="#222" />
          <rect x={9} y={5} width={2} height={1} fill="#222" />
        </>
      ) : tilted ? (
        <>
          <rect x={6} y={5} width={1} height={1} fill="#222" />
          <rect x={10} y={5} width={1} height={1} fill="#222" />
        </>
      ) : (
        <>
          <rect x={6} y={4} width={1} height={1} fill="#222" />
          <rect x={9} y={4} width={1} height={1} fill="#222" />
        </>
      )}
      {/* blush */}
      <rect x={5} y={6} width={1} height={1} fill={blush} opacity={0.55} />
      <rect x={10} y={6} width={1} height={1} fill={blush} opacity={0.55} />
      {/* mouth */}
      {down ? (
        <rect x={7} y={6} width={2} height={1} fill="#3a2a28" />
      ) : (
        <rect x={7} y={6} width={2} height={1} fill="#c88272" />
      )}
    </g>
  );
}

function Torso({ shirt }: { shirt: string }) {
  return (
    <g>
      {/* shoulders */}
      <rect x={4} y={8} width={8} height={2} fill={shirt} />
      {/* body */}
      <rect x={4} y={10} width={8} height={6} fill={shirt} />
      {/* subtle shirt shading */}
      <rect x={4} y={10} width={8} height={1} fill="#ffffff" opacity={0.08} />
      <rect x={4} y={15} width={8} height={1} fill="#000000" opacity={0.12} />
    </g>
  );
}

function Legs({ pants, skin }: { pants: string; skin: string }) {
  return (
    <g>
      <rect x={5} y={16} width={3} height={6} fill={pants} />
      <rect x={8} y={16} width={3} height={6} fill={pants} />
      {/* shoes */}
      <rect x={5} y={22} width={3} height={2} fill="#222" />
      <rect x={8} y={22} width={3} height={2} fill="#222" />
      {/* hand rest (wrists peeking) */}
      <rect x={3} y={14} width={1} height={1} fill={skin} />
      <rect x={12} y={14} width={1} height={1} fill={skin} />
    </g>
  );
}

// Arms change per pose
function Arms({
  shirt,
  skin,
  pose,
  frame,
}: {
  shirt: string;
  skin: string;
  pose: 'stand' | 'type' | 'coffee' | 'slump' | 'wait';
  frame: number;
}) {
  if (pose === 'type') {
    // Arms forward & down, slight up/down shift for keystroke feel
    const dy = frame % 2 === 0 ? 0 : 1;
    return (
      <g transform={`translate(0, ${dy})`}>
        {/* left upper arm */}
        <rect x={3} y={9} width={1} height={3} fill={shirt} />
        {/* left forearm forward */}
        <rect x={2} y={11} width={3} height={1} fill={shirt} />
        <rect x={1} y={12} width={2} height={1} fill={skin} />
        {/* right upper arm */}
        <rect x={12} y={9} width={1} height={3} fill={shirt} />
        {/* right forearm forward */}
        <rect x={11} y={11} width={3} height={1} fill={shirt} />
        <rect x={13} y={12} width={2} height={1} fill={skin} />
      </g>
    );
  }

  if (pose === 'coffee') {
    // Right arm holds a mug near the chin. Left arm rests down.
    const mugBob = frame % 2 === 0 ? 0 : -1;
    return (
      <g>
        {/* left arm down */}
        <rect x={3} y={9} width={1} height={5} fill={shirt} />
        <rect x={3} y={14} width={1} height={1} fill={skin} />
        {/* right arm bent up */}
        <rect x={12} y={9} width={1} height={2} fill={shirt} />
        <rect x={11} y={8} width={1} height={2} fill={shirt} />
        <rect x={10} y={7} width={1} height={1} fill={skin} />
        {/* mug */}
        <g transform={`translate(0, ${mugBob})`}>
          <rect x={9} y={6} width={3} height={2} fill="#e8e8e8" />
          <rect x={9} y={7} width={3} height={1} fill="#c0c0c0" />
          <rect x={12} y={7} width={1} height={1} fill="#e8e8e8" />
          {/* steam */}
          <rect x={10} y={4} width={1} height={1} fill="#ffffff" opacity={0.5 + ((frame % 2) * 0.3)} />
          <rect x={11} y={3} width={1} height={1} fill="#ffffff" opacity={0.3 + ((frame % 2) * 0.3)} />
        </g>
      </g>
    );
  }

  if (pose === 'slump') {
    // Arms hanging, shoulders rolled forward
    return (
      <g>
        <rect x={3} y={9} width={1} height={5} fill={shirt} />
        <rect x={3} y={14} width={1} height={1} fill={skin} />
        <rect x={12} y={9} width={1} height={5} fill={shirt} />
        <rect x={12} y={14} width={1} height={1} fill={skin} />
      </g>
    );
  }

  if (pose === 'wait') {
    // One arm checks phantom wrist-watch
    const twitch = frame % 2 === 0 ? 0 : 1;
    return (
      <g>
        <rect x={3} y={9} width={1} height={5} fill={shirt} />
        <rect x={3} y={14} width={1} height={1} fill={skin} />
        <rect x={12} y={9} width={1} height={2} fill={shirt} />
        <rect x={9 + twitch} y={10} width={3} height={1} fill={shirt} />
        <rect x={8 + twitch} y={10} width={1} height={1} fill={skin} />
      </g>
    );
  }

  // stand
  return (
    <g>
      <rect x={3} y={9} width={1} height={5} fill={shirt} />
      <rect x={3} y={14} width={1} height={1} fill={skin} />
      <rect x={12} y={9} width={1} height={5} fill={shirt} />
      <rect x={12} y={14} width={1} height={1} fill={skin} />
    </g>
  );
}

// --- Character --------------------------------------------------------------

function poseForState(state: PipelineState): 'stand' | 'type' | 'coffee' | 'slump' | 'wait' {
  switch (state) {
    case 'working':
      return 'type';
    case 'waiting':
      return 'wait';
    case 'failed':
      return 'slump';
    case 'off':
      return 'stand';
    default:
      return 'coffee';
  }
}

const Character = memo(function Character({
  skinColor,
  hairColor,
  shirtColor,
  pantsColor,
  state,
  x,
  y,
  scale = 3,
}: Props) {
  const pose = poseForState(state);

  // Animation frame counter — ticks every 350ms
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % 2), 350);
    return () => clearInterval(id);
  }, []);

  // Sitting offset: when typing, the character sits 3 "pixels" lower
  const sitDy = pose === 'type' ? 3 : 0;
  const tilted = pose === 'type';
  const down = pose === 'slump';
  const blush = '#f4a09a';

  // Extra decorations floating above head
  const bangOffset = pose === 'type' && frame % 2 ? -1 : 0;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} shapeRendering="crispEdges">
      <g transform={`translate(0, ${sitDy})`}>
        {/* subtle body sway when idle coffee */}
        <g transform={pose === 'coffee' ? `translate(0, ${frame % 2 === 0 ? 0 : -1})` : ''}>
          <g transform={`translate(0, ${bangOffset})`}>
            <Head
              skin={skinColor}
              hair={hairColor}
              blush={blush}
              tilted={tilted}
              down={down}
            />
          </g>
          <Torso shirt={shirtColor} />
          {pose !== 'type' && <Legs pants={pantsColor} skin={skinColor} />}
          <Arms shirt={shirtColor} skin={skinColor} pose={pose} frame={frame} />
        </g>
      </g>

      {/* State indicator above head */}
      {pose === 'slump' && (
        <g transform={`translate(0, ${frame % 2 === 0 ? 0 : -1})`}>
          <rect x={7} y={-4} width={2} height={3} fill="#ef4444" />
          <rect x={7} y={0} width={2} height={1} fill="#ef4444" />
        </g>
      )}
      {pose === 'wait' && (
        <g opacity={frame % 2 === 0 ? 1 : 0.4}>
          <rect x={6} y={-4} width={1} height={1} fill="#d29922" />
          <rect x={8} y={-4} width={1} height={1} fill="#d29922" />
          <rect x={10} y={-4} width={1} height={1} fill="#d29922" />
        </g>
      )}
      {pose === 'type' && (
        <>
          {/* tiny flying code particles */}
          <rect
            x={14}
            y={4 + (frame % 2) * -1}
            width={1}
            height={1}
            fill="#3fb950"
            opacity={0.8}
          />
          <rect
            x={15}
            y={6 + (frame % 2) * 1}
            width={1}
            height={1}
            fill="#58a6ff"
            opacity={0.8}
          />
        </>
      )}

      {/* invisible bounding box for layout debugging */}
      <rect x={0} y={0} width={GRID_W} height={GRID_H} fill="transparent" />
    </g>
  );
});

export default Character;
