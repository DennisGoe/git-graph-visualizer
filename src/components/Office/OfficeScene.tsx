import type { JSX } from 'react';
import { useAppSelector } from '../../store';
import type { GitBranch } from '../../types/git';
import type { PipelineState } from '../../store/pipelinesSlice';
import Character from './Character';

// ---------- Character palette ----------------------------------------------
const SKIN_TONES = ['#f3c9a3', '#e4b189', '#c68863', '#9a6a4a', '#6e4a34'];
const HAIR_COLORS = ['#2a1a12', '#5d3a20', '#8b4513', '#c9a227', '#5a5a5a', '#c66b3d'];
const PANTS_COLORS = ['#2c3e50', '#1b2838', '#3a3a3a', '#4a3b2a'];

// ---------- Layout constants -----------------------------------------------
// Top-down floor + facade-style back wall (á la Stardew Valley / top-down pixel games)
const WALL_H = 200;              // height of back wall facade
const WALL_CAP_H = 16;           // decorative cap between wall and floor
const DESK_W = 130;
const DESK_H = 78;
const DESK_ROW_Y = WALL_H + WALL_CAP_H + 40;   // top y of desks
const DESK_GAP = 22;
const AMBIENT_W_LEFT = 160;
const AMBIENT_W_RIGHT = 200;
const CHAR_SCALE = 2.5;
const CHAR_PIXEL_W = 16 * CHAR_SCALE;
const CHAR_PIXEL_H = 26 * CHAR_SCALE;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Props {
  activeBranches: GitBranch[];
}

// ===================================================================
// BACK WALL (facade, drawn as vertical panel at top of scene)
// ===================================================================

function BackWall({ width }: { width: number }) {
  // Creamy plaster wall with subtle horizontal texture
  const stripes: JSX.Element[] = [];
  for (let y = 0; y < WALL_H; y += 6) {
    const tone = (y / 6) % 2 === 0 ? '#e8c79a' : '#dcb985';
    stripes.push(
      <rect key={`st-${y}`} x={0} y={y} width={width} height={6} fill={tone} opacity={0.85} />,
    );
  }
  return (
    <g>
      {/* base */}
      <rect x={0} y={0} width={width} height={WALL_H} fill="#d8b280" />
      {stripes}
      {/* top shadow (ceiling) */}
      <rect x={0} y={0} width={width} height={14} fill="#000" opacity={0.4} />
      {/* crown molding */}
      <rect x={0} y={14} width={width} height={3} fill="#a87a44" />
      {/* wall-floor transition — darker skirting + thin highlight */}
      <rect x={0} y={WALL_H} width={width} height={WALL_CAP_H} fill="#5a3a24" />
      <rect x={0} y={WALL_H} width={width} height={2} fill="#8a5a34" />
      <rect x={0} y={WALL_H + WALL_CAP_H - 2} width={width} height={2} fill="#000" opacity={0.35} />
    </g>
  );
}

// ===================================================================
// FLOOR (top-down wooden planks)
// ===================================================================

function Floor({ width, height }: { width: number; height: number }) {
  const planks: JSX.Element[] = [];
  const PH = 34; // plank height
  const startY = WALL_H + WALL_CAP_H;
  let row = 0;
  for (let y = startY; y < height; y += PH) {
    // alternating plank shades
    const tone = row % 2 === 0 ? '#7a4a2c' : '#6a3e24';
    planks.push(<rect key={`pl-${y}`} x={0} y={y} width={width} height={PH} fill={tone} />);
    // grain lines
    const seed = row * 7;
    const numGrains = 5;
    for (let i = 0; i < numGrains; i++) {
      const gx = ((seed + i * 211) % width);
      const gw = 18 + ((seed + i) % 12);
      planks.push(
        <rect
          key={`gn-${y}-${i}`}
          x={gx}
          y={y + 6 + (i % 3) * 8}
          width={gw}
          height={1}
          fill="#000"
          opacity={0.18}
        />,
      );
    }
    // plank seam
    planks.push(
      <rect
        key={`seam-${y}`}
        x={0}
        y={y + PH - 1}
        width={width}
        height={1}
        fill="#000"
        opacity={0.35}
      />,
    );
    row++;
  }
  return <g>{planks}</g>;
}

// ===================================================================
// BACK WALL DECORATIONS
// ===================================================================

function SunsetWindow({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const gradId = `sunset-${x}-${y}`;
  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fbc27d" />
          <stop offset="45%" stopColor="#f07b5a" />
          <stop offset="100%" stopColor="#8a3a5c" />
        </linearGradient>
      </defs>
      {/* deep frame */}
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} fill="#2a1812" />
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill="#e8d0a0" />
      {/* sky */}
      <rect x={x} y={y} width={w} height={h} fill={`url(#${gradId})`} />
      {/* sun */}
      <circle cx={x + w * 0.6} cy={y + h * 0.55} r={h * 0.18} fill="#ffe0a8" />
      <circle cx={x + w * 0.6} cy={y + h * 0.55} r={h * 0.28} fill="#ffd18a" opacity={0.25} />
      {/* hills */}
      <path
        d={`M ${x} ${y + h * 0.75}
            L ${x + w * 0.25} ${y + h * 0.6}
            L ${x + w * 0.45} ${y + h * 0.72}
            L ${x + w * 0.7} ${y + h * 0.55}
            L ${x + w} ${y + h * 0.7}
            L ${x + w} ${y + h}
            L ${x} ${y + h} Z`}
        fill="#4a2f4a"
        opacity={0.85}
      />
      <path
        d={`M ${x} ${y + h * 0.85}
            L ${x + w * 0.35} ${y + h * 0.72}
            L ${x + w * 0.65} ${y + h * 0.82}
            L ${x + w} ${y + h * 0.78}
            L ${x + w} ${y + h}
            L ${x} ${y + h} Z`}
        fill="#2e1e34"
      />
      {/* palm silhouette */}
      <g fill="#1b101a">
        <rect x={x + w * 0.12} y={y + h * 0.55} width={1.5} height={h * 0.3} />
        <path d={`M ${x + w * 0.12} ${y + h * 0.56} L ${x + w * 0.05} ${y + h * 0.5} L ${x + w * 0.03} ${y + h * 0.55} Z`} />
        <path d={`M ${x + w * 0.13} ${y + h * 0.56} L ${x + w * 0.2} ${y + h * 0.5} L ${x + w * 0.22} ${y + h * 0.57} Z`} />
        <path d={`M ${x + w * 0.125} ${y + h * 0.55} L ${x + w * 0.1} ${y + h * 0.46} Z`} />
      </g>
      {/* mullions — cross */}
      <rect x={x + w / 2 - 1} y={y} width={2} height={h} fill="#e8d0a0" />
      <rect x={x} y={y + h / 2 - 1} width={w} height={2} fill="#e8d0a0" />
      {/* inner shadow */}
      <rect x={x} y={y} width={w} height={3} fill="#000" opacity={0.25} />
      <rect x={x} y={y} width={3} height={h} fill="#000" opacity={0.15} />
      {/* window sill */}
      <rect x={x - 8} y={y + h + 2} width={w + 16} height={5} fill="#a87a44" />
      <rect x={x - 8} y={y + h + 2} width={w + 16} height={2} fill="#d2a370" />
    </g>
  );
}

function NeonSign({ x, y }: { x: number; y: number }) {
  const pink = '#ff4a8b';
  const letters: [number, number, number, number][][] = [
    [[0, 0, 10, 2], [0, 0, 2, 7], [0, 6, 10, 2], [8, 6, 2, 7], [0, 12, 10, 2]],
    [[14, 0, 2, 14], [22, 0, 2, 14], [14, 6, 10, 2]],
    [[28, 0, 2, 14]],
    [[34, 0, 2, 14], [34, 0, 10, 2], [42, 0, 2, 7], [34, 6, 10, 2]],
    [[52, 0, 2, 14]],
    [[56, 0, 12, 2], [60, 0, 2, 14]],
  ];
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-8} y={-6} width={86} height={26} fill={pink} opacity={0.15} rx={2} />
      <rect x={-4} y={-2} width={78} height={18} fill={pink} opacity={0.22} rx={2} />
      {letters.flat().map((r, i) => (
        <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={pink} />
      ))}
    </g>
  );
}

function WallShelf({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      {/* plank */}
      <rect x={x} y={y} width={w} height={5} fill="#8a5a2e" />
      <rect x={x} y={y} width={w} height={1} fill="#b5813e" />
      <rect x={x} y={y + 4} width={w} height={1} fill="#000" opacity={0.4} />
      {/* brackets */}
      <rect x={x + 6} y={y + 5} width={2} height={5} fill="#5a3a1a" />
      <rect x={x + w - 8} y={y + 5} width={2} height={5} fill="#5a3a1a" />
      {/* books */}
      {['#58a6ff', '#ef4444', '#3fb950', '#d29922', '#bc8cff', '#39d2c0'].map((c, i) => (
        <g key={i}>
          <rect x={x + 8 + i * 5} y={y - 18} width={4} height={18} fill={c} />
          <rect x={x + 8 + i * 5} y={y - 18} width={4} height={1} fill="#fff" opacity={0.3} />
        </g>
      ))}
      {/* tilted book */}
      <polygon
        points={`${x + 42},${y} ${x + 54},${y} ${x + 54},${y - 4} ${x + 42},${y - 12}`}
        fill="#f778ba"
      />
      {/* mug */}
      <g>
        <rect x={x + 60} y={y - 12} width={10} height={12} fill="#f85149" />
        <rect x={x + 60} y={y - 12} width={10} height={2} fill="#fff" opacity={0.3} />
        <rect x={x + 70} y={y - 10} width={3} height={6} fill="#f85149" />
      </g>
      {/* trophy */}
      <g>
        <rect x={x + w - 28} y={y - 4} width={10} height={2} fill="#d29922" />
        <rect x={x + w - 26} y={y - 14} width={6} height={10} fill="#f4c030" />
        <rect x={x + w - 26} y={y - 14} width={6} height={2} fill="#fff" opacity={0.3} />
        <rect x={x + w - 28} y={y - 16} width={10} height={2} fill="#f4c030" />
      </g>
      {/* small plant */}
      <g>
        <rect x={x + w - 14} y={y - 10} width={8} height={10} fill="#a15a3e" />
        <rect x={x + w - 12} y={y - 14} width={4} height={4} fill="#3a6b3a" />
        <rect x={x + w - 11} y={y - 18} width={1} height={4} fill="#3a6b3a" />
        <rect x={x + w - 9} y={y - 20} width={1} height={6} fill="#3a6b3a" />
      </g>
    </g>
  );
}

function WallPoster({
  x,
  y,
  w,
  h,
  theme,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  theme: 'mountain' | 'quote' | 'text' | 'grid';
}) {
  return (
    <g>
      {/* frame */}
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill={theme === 'quote' ? '#f0e0c0' : '#1d1816'} />
      {theme === 'mountain' && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#f0c27d" />
          <path
            d={`M ${x} ${y + h * 0.75}
                L ${x + w * 0.3} ${y + h * 0.35}
                L ${x + w * 0.45} ${y + h * 0.55}
                L ${x + w * 0.7} ${y + h * 0.3}
                L ${x + w} ${y + h * 0.7}
                L ${x + w} ${y + h}
                L ${x} ${y + h} Z`}
            fill="#8a3a5c"
            opacity={0.9}
          />
          <circle cx={x + w * 0.65} cy={y + h * 0.35} r={h * 0.12} fill="#ffd58a" />
        </g>
      )}
      {theme === 'quote' && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#e8d8c0" />
          <text
            x={x + 6}
            y={y + h * 0.35}
            fill="#5a3020"
            fontSize={Math.min(13, h * 0.2)}
            fontFamily="'Inter', sans-serif"
            fontStyle="italic"
            fontWeight={600}
          >
            "it works on
          </text>
          <text
            x={x + 6}
            y={y + h * 0.6}
            fill="#5a3020"
            fontSize={Math.min(13, h * 0.2)}
            fontFamily="'Inter', sans-serif"
            fontStyle="italic"
            fontWeight={600}
          >
            my machine"
          </text>
          <text
            x={x + w - 6}
            y={y + h * 0.85}
            textAnchor="end"
            fill="#8a5530"
            fontSize={Math.min(9, h * 0.14)}
            fontFamily="'Inter', sans-serif"
          >
            — every dev, ever
          </text>
        </g>
      )}
      {theme === 'text' && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#2a1f18" />
          <text
            x={x + w / 2}
            y={y + h * 0.4}
            textAnchor="middle"
            fill="#ff6d5a"
            fontSize={Math.min(15, h * 0.22)}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={700}
          >
            MOVE FAST
          </text>
          <text
            x={x + w / 2}
            y={y + h * 0.7}
            textAnchor="middle"
            fill="#e8d8c0"
            fontSize={Math.min(10, h * 0.16)}
            fontFamily="'JetBrains Mono', monospace"
          >
            ship broken things
          </text>
        </g>
      )}
      {theme === 'grid' && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="#ecece4" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={x + 6 + col * (w - 12) / 4}
                y={y + 6 + row * (h - 12) / 4}
                width={(w - 14) / 4 - 1}
                height={(h - 14) / 4 - 1}
                fill={['#58a6ff', '#3fb950', '#f778ba', '#d29922', '#bc8cff', '#39d2c0', '#f85149', '#79c0ff'][(row * 4 + col) % 8]}
                opacity={0.85}
              />
            )),
          )}
        </g>
      )}
    </g>
  );
}

function WallClock({ x, y, r = 20 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 2} fill="#1d1816" />
      <circle cx={x} cy={y} r={r} fill="#f5efdd" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const major = i % 3 === 0;
        const r1 = r - (major ? 5 : 3);
        const r2 = r - 1.5;
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r1}
            y1={y + Math.sin(a) * r1}
            x2={x + Math.cos(a) * r2}
            y2={y + Math.sin(a) * r2}
            stroke="#2a1a10"
            strokeWidth={major ? 1.4 : 0.8}
          />
        );
      })}
      {/* hands — 9:41 */}
      <line x1={x} y1={y} x2={x - r * 0.55} y2={y - r * 0.1} stroke="#1a0f08" strokeWidth={1.6} />
      <line x1={x} y1={y} x2={x + r * 0.1} y2={y - r * 0.7} stroke="#1a0f08" strokeWidth={1.2} />
      <circle cx={x} cy={y} r={1.5} fill="#ef4444" />
    </g>
  );
}

function HangingPlant({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* hook */}
      <rect x={x - 1} y={y - 4} width={2} height={6} fill="#3a2414" />
      <circle cx={x} cy={y + 1} r={2} fill="#3a2414" />
      {/* chains */}
      <line x1={x - 6} y1={y + 8} x2={x} y2={y + 2} stroke="#555" strokeWidth={1} />
      <line x1={x + 6} y1={y + 8} x2={x} y2={y + 2} stroke="#555" strokeWidth={1} />
      {/* pot */}
      <polygon
        points={`${x - 10},${y + 8} ${x + 10},${y + 8} ${x + 8},${y + 22} ${x - 8},${y + 22}`}
        fill="#a15a3e"
      />
      <rect x={x - 10} y={y + 8} width={20} height={3} fill="#7a4028" />
      <rect x={x - 9} y={y + 8} width={18} height={1} fill="#c47046" />
      {/* leaves + vines */}
      <g fill="#3a6b3a">
        <ellipse cx={x - 4} cy={y + 14} rx={10} ry={6} />
        <ellipse cx={x + 4} cy={y + 12} rx={10} ry={6} />
        <rect x={x - 14} y={y + 20} width={3} height={16} />
        <rect x={x + 11} y={y + 18} width={3} height={20} />
        <rect x={x - 4} y={y + 22} width={2} height={22} />
        <rect x={x + 2} y={y + 20} width={2} height={18} />
      </g>
      <g fill="#4a7d4a">
        <rect x={x - 13} y={y + 34} width={2} height={3} />
        <rect x={x + 12} y={y + 36} width={2} height={3} />
        <rect x={x - 2} y={y + 42} width={2} height={3} />
      </g>
    </g>
  );
}

function PinBoard({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="#8a5a2e" />
      <rect x={x} y={y} width={w} height={h} fill="#b8864a" />
      {/* cork texture */}
      {[...Array(30)].map((_, i) => {
        const cx = x + ((i * 37) % (w - 4));
        const cy = y + ((i * 71) % (h - 4));
        return <rect key={i} x={cx} y={cy} width={1} height={1} fill="#6a4020" opacity={0.5} />;
      })}
      {/* post-its */}
      <g>
        <rect x={x + 6} y={y + 6} width={20} height={20} fill="#f4e68a" transform={`rotate(-4 ${x + 16} ${y + 16})`} />
        <rect x={x + 6} y={y + 6} width={20} height={3} fill="#d4c660" transform={`rotate(-4 ${x + 16} ${y + 16})`} />
        <rect x={x + 30} y={y + 4} width={22} height={20} fill="#9bd4f4" transform={`rotate(3 ${x + 41} ${y + 14})`} />
        <rect x={x + 30} y={y + 4} width={22} height={3} fill="#6fa8c8" transform={`rotate(3 ${x + 41} ${y + 14})`} />
        <rect x={x + 10} y={y + 32} width={20} height={18} fill="#f4a8a8" transform={`rotate(2 ${x + 20} ${y + 41})`} />
        <rect x={x + 34} y={y + 30} width={20} height={22} fill="#b0e8b0" transform={`rotate(-3 ${x + 44} ${y + 41})`} />
      </g>
      {/* push-pins */}
      <circle cx={x + 14} cy={y + 10} r={2} fill="#ef4444" />
      <circle cx={x + 40} cy={y + 8} r={2} fill="#58a6ff" />
      <circle cx={x + 18} cy={y + 36} r={2} fill="#3fb950" />
      <circle cx={x + 44} cy={y + 34} r={2} fill="#d29922" />
    </g>
  );
}

// ===================================================================
// FLOOR OBJECTS (top-down pixel art)
// ===================================================================

// Rug with ornament
function Rug({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#c14b6a" />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke="#f0d58a" strokeWidth={1.5} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="#a83858" opacity={0.9} />
      {/* center diamond */}
      <polygon
        points={`${x + w / 2},${y + h * 0.3} ${x + w * 0.7},${y + h / 2} ${x + w / 2},${y + h * 0.7} ${x + w * 0.3},${y + h / 2}`}
        fill="#8a2a4a"
      />
      <polygon
        points={`${x + w / 2},${y + h * 0.38} ${x + w * 0.62},${y + h / 2} ${x + w / 2},${y + h * 0.62} ${x + w * 0.38},${y + h / 2}`}
        fill="#f0d58a"
        opacity={0.7}
      />
      {/* fringes */}
      {Array.from({ length: Math.floor(w / 4) }).map((_, i) => (
        <rect key={`ft-${i}`} x={x + i * 4 + 1} y={y - 3} width={1} height={3} fill="#f0d58a" />
      ))}
      {Array.from({ length: Math.floor(w / 4) }).map((_, i) => (
        <rect key={`fb-${i}`} x={x + i * 4 + 1} y={y + h} width={1} height={3} fill="#f0d58a" />
      ))}
    </g>
  );
}

// Top-down desk — rectangle with 3/4 angled front (small front face)
function Desk({
  x,
  y,
  state,
  branchColor,
  branchName,
}: {
  x: number;
  y: number;
  state: PipelineState;
  branchColor: string;
  branchName: string;
}) {
  const w = DESK_W;
  const h = DESK_H;
  const working = state === 'working';
  const failed = state === 'failed';
  const screenFill = working ? '#0a1a2e' : failed ? '#2a0a0a' : '#1a1a1a';

  return (
    <g>
      {/* front 3D skirt to hint at thickness */}
      <rect x={x} y={y + h} width={w} height={5} fill="#5a3818" />
      <rect x={x} y={y + h + 5} width={w} height={1} fill="#000" opacity={0.4} />

      {/* desk top */}
      <rect x={x} y={y} width={w} height={h} fill="#c99766" />
      <rect x={x} y={y} width={w} height={2} fill="#e0b285" />
      <rect x={x + 1} y={y + h - 1} width={w - 2} height={1} fill="#000" opacity={0.2} />
      {/* wood grain */}
      <rect x={x + 10} y={y + 14} width={w - 26} height={1} fill="#000" opacity={0.12} />
      <rect x={x + 18} y={y + 40} width={w - 36} height={1} fill="#000" opacity={0.1} />

      {/* Monitor at back of desk */}
      <g>
        {/* monitor stand (top-down: small trapezoid behind) */}
        <rect x={x + w / 2 - 14} y={y + 8} width={28} height={4} fill="#222" />
        <rect x={x + w / 2 - 5} y={y + 4} width={10} height={4} fill="#222" />
        {/* bezel */}
        <rect x={x + w / 2 - 32} y={y + 6} width={64} height={30} fill="#1a1a1a" />
        {/* screen */}
        <rect x={x + w / 2 - 29} y={y + 9} width={58} height={24} fill={screenFill} />
        {/* content */}
        {working && (
          <g>
            <rect x={x + w / 2 - 27} y={y + 12} width={16} height={1.5} fill="#3fb950" />
            <rect x={x + w / 2 - 9} y={y + 12} width={10} height={1.5} fill="#f85149" />
            <rect x={x + w / 2 - 27} y={y + 16} width={22} height={1.5} fill="#58a6ff" />
            <rect x={x + w / 2 - 21} y={y + 20} width={18} height={1.5} fill="#d2a8ff" />
            <rect x={x + w / 2 - 21} y={y + 24} width={26} height={1.5} fill="#d29922" />
            <rect x={x + w / 2 - 27} y={y + 28} width={12} height={1.5} fill="#3fb950" />
          </g>
        )}
        {failed && (
          <g fill="#ef4444">
            <rect x={x + w / 2 - 14} y={y + 12} width={22} height={2} />
            <rect x={x + w / 2 - 18} y={y + 16} width={30} height={1.5} />
            <rect x={x + w / 2 - 8} y={y + 20} width={14} height={8} />
            <rect x={x + w / 2 - 5} y={y + 22} width={2} height={2} fill="#2a0a0a" />
            <rect x={x + w / 2 + 1} y={y + 22} width={2} height={2} fill="#2a0a0a" />
          </g>
        )}
        {state === 'waiting' && (
          <g fill="#d29922">
            <rect x={x + w / 2 - 7} y={y + 16} width={14} height={2} />
            <rect x={x + w / 2 - 5} y={y + 14} width={10} height={8} />
            <rect x={x + w / 2 - 3} y={y + 18} width={4} height={1.5} fill="#1a1a1a" />
          </g>
        )}
        {state === 'idle' && (
          <g>
            <rect x={x + w / 2 - 22} y={y + 16} width={2} height={2} fill="#39d2c0" />
            <rect x={x + w / 2 - 8} y={y + 22} width={2} height={2} fill="#bc8cff" />
            <rect x={x + w / 2 + 12} y={y + 14} width={2} height={2} fill="#58a6ff" />
            <rect x={x + w / 2 + 18} y={y + 26} width={2} height={2} fill="#f778ba" />
          </g>
        )}
        {/* power LED */}
        <rect x={x + w / 2 + 26} y={y + 32} width={2} height={1} fill="#3fb950" />
      </g>

      {/* Keyboard */}
      <rect x={x + w / 2 - 22} y={y + 44} width={44} height={10} fill="#3a3a3a" />
      <rect x={x + w / 2 - 22} y={y + 44} width={44} height={1} fill="#555" />
      {/* keys hint */}
      {[...Array(10)].map((_, i) => (
        <rect key={i} x={x + w / 2 - 20 + i * 4} y={y + 46} width={3} height={1} fill="#222" />
      ))}
      {[...Array(10)].map((_, i) => (
        <rect key={`r2-${i}`} x={x + w / 2 - 20 + i * 4} y={y + 48} width={3} height={1} fill="#222" />
      ))}
      {[...Array(10)].map((_, i) => (
        <rect key={`r3-${i}`} x={x + w / 2 - 20 + i * 4} y={y + 50} width={3} height={1} fill="#222" />
      ))}

      {/* Mouse */}
      <rect x={x + w / 2 + 24} y={y + 46} width={8} height={10} fill="#3a3a3a" />
      <rect x={x + w / 2 + 24} y={y + 46} width={8} height={1} fill="#555" />
      {/* mousepad */}
      <rect x={x + w / 2 + 22} y={y + 44} width={12} height={14} fill="#1a1a1a" opacity={0.4} rx={1} />

      {/* Coffee mug — branch color */}
      <g>
        <rect x={x + 10} y={y + 44} width={10} height={12} fill={branchColor} />
        <rect x={x + 10} y={y + 44} width={10} height={2} fill="#fff" opacity={0.3} />
        <rect x={x + 20} y={y + 46} width={3} height={6} fill={branchColor} />
        {/* steam when working */}
        {working && (
          <g fill="#fff" opacity={0.5}>
            <rect x={x + 12} y={y + 40} width={1} height={2} />
            <rect x={x + 16} y={y + 38} width={1} height={2} />
          </g>
        )}
      </g>

      {/* Small plant on desk */}
      <g>
        <rect x={x + w - 22} y={y + 48} width={12} height={10} fill="#a15a3e" />
        <rect x={x + w - 20} y={y + 42} width={8} height={6} fill="#3a6b3a" />
        <rect x={x + w - 18} y={y + 38} width={2} height={6} fill="#3a6b3a" />
        <rect x={x + w - 15} y={y + 36} width={2} height={8} fill="#3a6b3a" />
        <rect x={x + w - 12} y={y + 40} width={2} height={4} fill="#3a6b3a" />
      </g>

      {/* Post-it */}
      <g transform={`rotate(-6 ${x + w - 10} ${y + 16})`}>
        <rect x={x + w - 18} y={y + 10} width={14} height={14} fill="#f4e68a" />
        <rect x={x + w - 18} y={y + 10} width={14} height={2} fill="#d4c660" />
        <rect x={x + w - 16} y={y + 14} width={8} height={1} fill="#5a3020" opacity={0.6} />
        <rect x={x + w - 16} y={y + 17} width={10} height={1} fill="#5a3020" opacity={0.6} />
        <rect x={x + w - 16} y={y + 20} width={6} height={1} fill="#5a3020" opacity={0.6} />
      </g>

      {/* Nameplate on the front edge */}
      <rect x={x + 4} y={y + h - 11} width={w - 8} height={9} fill={branchColor} opacity={0.95} rx={1} />
      <text
        x={x + w / 2}
        y={y + h - 4}
        textAnchor="middle"
        fill="#fff"
        fontSize={7}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={700}
      >
        {branchName.length > 16 ? branchName.slice(0, 15) + '…' : branchName}
      </text>
    </g>
  );
}

// Top-down chair in branch color
function Chair({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      {/* backrest (slightly taller to hint at height) */}
      <rect x={x} y={y - 8} width={36} height={10} fill={color} />
      <rect x={x} y={y - 8} width={36} height={2} fill="#fff" opacity={0.2} />
      <rect x={x} y={y - 1} width={36} height={1} fill="#000" opacity={0.35} />
      {/* seat */}
      <rect x={x + 2} y={y} width={32} height={26} fill={color} />
      <rect x={x + 2} y={y} width={32} height={2} fill="#fff" opacity={0.25} />
      <rect x={x + 2} y={y + 24} width={32} height={2} fill="#000" opacity={0.3} />
      {/* armrests */}
      <rect x={x - 2} y={y + 4} width={4} height={14} fill="#222" />
      <rect x={x + 34} y={y + 4} width={4} height={14} fill="#222" />
      {/* wheels (top-down stub) */}
      <rect x={x + 6} y={y + 26} width={3} height={4} fill="#222" />
      <rect x={x + 18} y={y + 26} width={3} height={4} fill="#222" />
      <rect x={x + 28} y={y + 26} width={3} height={4} fill="#222" />
    </g>
  );
}

// Sofa top-down (3/4 with backrest along top edge)
function Sofa({ x, y }: { x: number; y: number }) {
  const w = 180;
  const h = 72;
  return (
    <g>
      {/* back shadow */}
      <rect x={x} y={y + h} width={w} height={4} fill="#000" opacity={0.25} />
      {/* backrest (top) */}
      <rect x={x} y={y} width={w} height={18} fill="#c88258" />
      <rect x={x} y={y} width={w} height={2} fill="#e0a77f" />
      <rect x={x} y={y + 16} width={w} height={2} fill="#000" opacity={0.25} />
      {/* armrests */}
      <rect x={x} y={y + 14} width={14} height={h - 14} fill="#a96848" />
      <rect x={x + w - 14} y={y + 14} width={14} height={h - 14} fill="#a96848" />
      {/* seat */}
      <rect x={x + 14} y={y + 18} width={w - 28} height={h - 22} fill="#d4956d" />
      {/* cushion seams */}
      <rect x={x + 14 + (w - 28) / 3} y={y + 18} width={1} height={h - 22} fill="#000" opacity={0.25} />
      <rect x={x + 14 + ((w - 28) / 3) * 2} y={y + 18} width={1} height={h - 22} fill="#000" opacity={0.25} />
      {/* pillow */}
      <rect x={x + 22} y={y + 22} width={22} height={20} fill="#6b8ec8" rx={2} />
      <rect x={x + 24} y={y + 24} width={18} height={3} fill="#8aa9d8" opacity={0.7} />
      {/* laptop on one cushion */}
      <g>
        <rect x={x + w - 60} y={y + 28} width={28} height={16} fill="#2a2a2a" rx={1} />
        <rect x={x + w - 58} y={y + 30} width={24} height={12} fill="#2a6bff" opacity={0.6} />
        <rect x={x + w - 54} y={y + 33} width={8} height={1} fill="#fff" opacity={0.5} />
        <rect x={x + w - 56} y={y + 36} width={14} height={1} fill="#fff" opacity={0.4} />
      </g>
      {/* front skirt hint */}
      <rect x={x} y={y + h} width={w} height={2} fill="#8d5538" />
    </g>
  );
}

// Coffee station (counter + espresso machine) top-down
function CoffeeStation({ x, y }: { x: number; y: number }) {
  const w = 130;
  const h = 56;
  return (
    <g>
      {/* counter shadow */}
      <rect x={x} y={y + h} width={w} height={4} fill="#000" opacity={0.25} />
      {/* counter top */}
      <rect x={x} y={y} width={w} height={h} fill="#e8c79a" />
      <rect x={x} y={y} width={w} height={2} fill="#fff" opacity={0.2} />
      <rect x={x} y={y + h - 2} width={w} height={2} fill="#000" opacity={0.25} />
      {/* espresso machine */}
      <g>
        <rect x={x + 8} y={y + 10} width={34} height={34} fill="#c0c0c0" />
        <rect x={x + 8} y={y + 10} width={34} height={3} fill="#e4e4e4" />
        <rect x={x + 10} y={y + 14} width={30} height={8} fill="#222" />
        <rect x={x + 12} y={y + 16} width={6} height={4} fill="#39d2c0" />
        <circle cx={x + 32} cy={y + 18} r={1.5} fill="#ef4444" />
        <rect x={x + 22} y={y + 28} width={3} height={8} fill="#222" />
        <rect x={x + 18} y={y + 36} width={11} height={6} fill="#222" />
        <rect x={x + 20} y={y + 36} width={7} height={2} fill="#e8c79a" />
      </g>
      {/* steam */}
      <g fill="#fff">
        <rect x={x + 26} y={y + 2} width={1} height={4} opacity={0.5} />
        <rect x={x + 28} y={y + 0} width={1} height={5} opacity={0.35} />
      </g>
      {/* mugs row */}
      <rect x={x + 50} y={y + 26} width={8} height={10} fill="#58a6ff" />
      <rect x={x + 62} y={y + 26} width={8} height={10} fill="#3fb950" />
      <rect x={x + 74} y={y + 26} width={8} height={10} fill="#f85149" />
      <rect x={x + 86} y={y + 26} width={8} height={10} fill="#d29922" />
      {/* coffee beans jar */}
      <rect x={x + 100} y={y + 20} width={18} height={22} fill="#3a2414" />
      <rect x={x + 100} y={y + 20} width={18} height={3} fill="#6b3a1f" />
      {[...Array(12)].map((_, i) => (
        <rect
          key={i}
          x={x + 102 + (i % 4) * 4}
          y={y + 26 + Math.floor(i / 4) * 4}
          width={2}
          height={3}
          fill="#1a0a04"
        />
      ))}
    </g>
  );
}

// Potted monstera top-down (leaves visible)
function Monstera({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* pot */}
      <polygon points={`${x - 14},${y} ${x + 14},${y} ${x + 12},${y + 22} ${x - 12},${y + 22}`} fill="#a15a3e" />
      <rect x={x - 14} y={y} width={28} height={3} fill="#7a4028" />
      <rect x={x - 13} y={y} width={26} height={1} fill="#c47046" />
      <rect x={x - 12} y={y + 20} width={24} height={2} fill="#000" opacity={0.25} />
      {/* soil */}
      <ellipse cx={x} cy={y + 2} rx={13} ry={2.5} fill="#2a1a10" />
      {/* leaves */}
      <g fill="#3a6b3a">
        <ellipse cx={x - 12} cy={y - 14} rx={14} ry={9} />
        <ellipse cx={x + 10} cy={y - 20} rx={16} ry={10} />
        <ellipse cx={x + 4} cy={y - 6} rx={12} ry={7} />
        <ellipse cx={x - 14} cy={y - 2} rx={9} ry={5} />
        <ellipse cx={x + 16} cy={y - 4} rx={10} ry={6} />
      </g>
      {/* cutouts */}
      <g fill="#1b1b1b">
        <rect x={x - 14} y={y - 16} width={3} height={1} />
        <rect x={x - 8} y={y - 12} width={3} height={1} />
        <rect x={x + 6} y={y - 22} width={3} height={1} />
        <rect x={x + 14} y={y - 18} width={3} height={1} />
        <rect x={x + 2} y={y - 6} width={3} height={1} />
        <rect x={x - 16} y={y - 2} width={3} height={1} />
        <rect x={x + 14} y={y - 4} width={3} height={1} />
      </g>
      {/* highlight */}
      <ellipse cx={x + 12} cy={y - 22} rx={3} ry={1} fill="#7bb87b" opacity={0.6} />
    </g>
  );
}

// Trash can top-down
function TrashCan({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y + 24} width={20} height={3} fill="#000" opacity={0.25} />
      <polygon points={`${x},${y} ${x + 20},${y} ${x + 18},${y + 26} ${x + 2},${y + 26}`} fill="#4a4a4a" />
      <rect x={x + 2} y={y} width={16} height={3} fill="#6a6a6a" />
      <rect x={x + 2} y={y + 6} width={16} height={1} fill="#222" />
      <rect x={x + 2} y={y + 14} width={16} height={1} fill="#222" />
      {/* paper sticking out */}
      <rect x={x + 6} y={y - 3} width={4} height={6} fill="#e8d8c0" />
      <rect x={x + 11} y={y - 2} width={5} height={5} fill="#f4ecd8" />
    </g>
  );
}

// Skateboard
function Skateboard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={56} height={16} fill="#ef4444" rx={7} />
      <rect x={x} y={y} width={56} height={2} fill="#fff" opacity={0.2} rx={2} />
      <rect x={x} y={y + 14} width={56} height={2} fill="#000" opacity={0.3} rx={2} />
      <rect x={x + 6} y={y + 4} width={44} height={8} fill="#c93434" opacity={0.6} />
      {/* trucks & wheels */}
      <rect x={x + 4} y={y - 3} width={10} height={3} fill="#888" />
      <rect x={x + 42} y={y - 3} width={10} height={3} fill="#888" />
      <rect x={x + 4} y={y + 16} width={10} height={3} fill="#888" />
      <rect x={x + 42} y={y + 16} width={10} height={3} fill="#888" />
      <circle cx={x + 6} cy={y - 2} r={2} fill="#222" />
      <circle cx={x + 12} cy={y - 2} r={2} fill="#222" />
      <circle cx={x + 44} cy={y - 2} r={2} fill="#222" />
      <circle cx={x + 50} cy={y - 2} r={2} fill="#222" />
      <circle cx={x + 6} cy={y + 18} r={2} fill="#222" />
      <circle cx={x + 12} cy={y + 18} r={2} fill="#222" />
      <circle cx={x + 44} cy={y + 18} r={2} fill="#222" />
      <circle cx={x + 50} cy={y + 18} r={2} fill="#222" />
    </g>
  );
}

// Tiny corgi
function OfficeDog({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* body (top-down: oval-ish) */}
      <ellipse cx={16} cy={14} rx={14} ry={8} fill="#d48a3a" />
      <ellipse cx={16} cy={11} rx={13} ry={3} fill="#f0b060" opacity={0.7} />
      {/* white chest */}
      <ellipse cx={22} cy={16} rx={5} ry={3} fill="#f4ecd8" />
      {/* head */}
      <rect x={26} y={10} width={9} height={8} fill="#d48a3a" rx={1} />
      {/* ears */}
      <polygon points={`27,10 29,4 31,10`} fill="#a66520" />
      <polygon points={`32,10 34,4 36,10`} fill="#a66520" />
      {/* eye */}
      <rect x={31} y={12} width={1.5} height={1.5} fill="#1a1a1a" />
      {/* nose */}
      <rect x={34} y={13} width={1.5} height={1.5} fill="#1a1a1a" />
      {/* legs */}
      <rect x={6} y={20} width={3} height={4} fill="#d48a3a" />
      <rect x={22} y={20} width={3} height={4} fill="#d48a3a" />
      {/* stubby tail */}
      <rect x={2} y={13} width={3} height={3} fill="#f0b060" />
    </g>
  );
}

// Whiteboard standalone on back wall (alternative decor slot)
function Whiteboard({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="#b5b5b5" />
      <rect x={x} y={y} width={w} height={h} fill="#f5f5f0" />
      {/* scribbles */}
      <g stroke="#2a6bff" strokeWidth={1.2} fill="#fff">
        <rect x={x + 10} y={y + 10} width={22} height={14} />
        <rect x={x + 40} y={y + 10} width={22} height={14} />
        <rect x={x + 70} y={y + 10} width={22} height={14} />
        <line x1={x + 32} y1={y + 17} x2={x + 40} y2={y + 17} />
        <line x1={x + 62} y1={y + 17} x2={x + 70} y2={y + 17} />
      </g>
      <circle
        cx={x + w * 0.8}
        cy={y + h * 0.45}
        r={14}
        fill="none"
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      {/* tray */}
      <rect x={x + w / 2 - 24} y={y + h} width={48} height={3} fill="#8a8a8a" />
      <rect x={x + w / 2 - 20} y={y + h - 2} width={4} height={3} fill="#ef4444" />
      <rect x={x + w / 2 - 14} y={y + h - 2} width={4} height={3} fill="#2a6bff" />
      <rect x={x + w / 2 - 8} y={y + h - 2} width={4} height={3} fill="#3fb950" />
    </g>
  );
}

// ---------- Floor lamp with police-siren head ------------------------------
// Tall floor lamp standing behind each desk. The bulb on top is styled as a
// police-siren dome and *rotates* when the pipeline is running (blue) or has
// failed (red). Idle/success (green), waiting (amber) and off (gray) stay
// static so the scene doesn't strobe when everything is fine.
const LAMP_HEIGHT = 140;   // stem + dome
const LAMP_BASE_OFFSET = 52; // base sits this far below DESK_ROW_Y (hidden by desk)

function FloorLamp({
  x,
  statusColor,
  rotating,
}: {
  x: number;
  statusColor?: string;
  rotating: boolean;
}) {
  const baseY = DESK_ROW_Y + LAMP_BASE_OFFSET;       // floor level (under desk)
  const topY = baseY - LAMP_HEIGHT;                  // where the siren sits
  const domeCx = x;
  const domeCy = topY + 6;
  const domeR = 10;
  const housingY = topY + 11;

  const hasStatus = Boolean(statusColor);
  const bulbColor = statusColor ?? '#ffe08a';
  // Red (failed) spins fastest; blue (running) a touch slower.
  const rotSpeed = statusColor === '#ef4444' ? '0.7s' : '1.2s';

  return (
    <g>
      {/* Floor shadow under the base (mostly covered by the desk) */}
      <ellipse cx={x} cy={baseY + 3} rx={14} ry={4} fill="#000" opacity={0.35} />

      {/* Round weighted base */}
      <ellipse cx={x} cy={baseY} rx={12} ry={3.5} fill="#1a1a1a" />
      <ellipse cx={x} cy={baseY - 1} rx={12} ry={3.5} fill="#3a3a3a" />
      <ellipse cx={x} cy={baseY - 1.5} rx={9} ry={2.2} fill="#555" />

      {/* Tall thin pole */}
      <rect x={x - 1.5} y={topY + 14} width={3} height={baseY - topY - 14} fill="#2a2a2a" />
      <rect x={x - 1.5} y={topY + 14} width={1} height={baseY - topY - 14} fill="#4a4a4a" />

      {/* Siren black housing under the dome */}
      <rect x={x - 12} y={housingY} width={24} height={4} fill="#141414" />
      <rect x={x - 12} y={housingY} width={24} height={1} fill="#3a3a3a" />
      <rect x={x - 13} y={housingY + 3} width={26} height={2} fill="#050505" />

      {/* Rotating beam (only for blue/red) — drawn under the dome so the
          dome glass tints it. Beam extends outward from the dome. */}
      {rotating && hasStatus && (
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${domeCx} ${domeCy}`}
            to={`360 ${domeCx} ${domeCy}`}
            dur={rotSpeed}
            repeatCount="indefinite"
          />
          {/* long soft searchlight cone */}
          <polygon
            points={`${domeCx},${domeCy} ${domeCx - 70},${domeCy - 18} ${domeCx - 70},${domeCy + 18}`}
            fill={bulbColor}
            opacity={0.22}
          />
          {/* tighter bright cone */}
          <polygon
            points={`${domeCx},${domeCy} ${domeCx - 34},${domeCy - 7} ${domeCx - 34},${domeCy + 7}`}
            fill={bulbColor}
            opacity={0.6}
          />
          {/* hot spot (the rotating bulb itself) */}
          <circle cx={domeCx - 5} cy={domeCy} r={3.5} fill={bulbColor} />
          <circle cx={domeCx - 5} cy={domeCy} r={2} fill="#fff" />
        </g>
      )}

      {/* Siren dome (half-sphere glass) */}
      <path
        d={`M ${domeCx - domeR} ${housingY} A ${domeR} ${domeR} 0 0 1 ${domeCx + domeR} ${housingY} Z`}
        fill={bulbColor}
        opacity={rotating ? 0.28 : 0.35}
      />
      <path
        d={`M ${domeCx - domeR} ${housingY} A ${domeR} ${domeR} 0 0 1 ${domeCx + domeR} ${housingY}`}
        fill="none"
        stroke={bulbColor}
        strokeWidth={1.2}
        opacity={0.85}
      />

      {/* Static inner bulb when the dome isn't rotating */}
      {!rotating && (
        <circle cx={domeCx} cy={domeCy - 1} r={4} fill={bulbColor} />
      )}

      {/* Glass highlight */}
      <ellipse cx={domeCx - 4} cy={topY + 3} rx={3} ry={1.5} fill="#fff" opacity={0.65} />

      {/* Ambient wall glow — brighter/larger when rotating */}
      {hasStatus && (
        <ellipse
          cx={domeCx}
          cy={housingY + 3}
          rx={rotating ? 42 : 24}
          ry={rotating ? 22 : 13}
          fill={bulbColor}
          opacity={rotating ? 0.32 : 0.22}
          pointerEvents="none"
        >
          {rotating && (
            <animate
              attributeName="opacity"
              values="0.22;0.5;0.22"
              dur={rotSpeed}
              repeatCount="indefinite"
            />
          )}
        </ellipse>
      )}
    </g>
  );
}

// ---------- Small rotating red alarm siren (wall-mounted) ------------------
// Shown in multiple places around the office whenever any branch's pipeline
// has failed. Rotates silently — classic "red alert" feel.
function AlarmLight({
  x,
  y,
  size = 1,
  phase = 0,
}: {
  x: number;
  y: number;
  size?: number;
  phase?: number; // 0..1 — staggers rotation starting angle
}) {
  const r = 5 * size;
  const color = '#ef4444';
  const speed = '0.7s';
  const startAngle = Math.round(phase * 360);
  const cy = y + r * 0.4;

  return (
    <g>
      {/* housing */}
      <rect x={x - r - 1} y={y + r} width={(r + 1) * 2} height={2} fill="#141414" />

      {/* rotating beam — under the dome */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`${startAngle} ${x} ${cy}`}
          to={`${startAngle + 360} ${x} ${cy}`}
          dur={speed}
          repeatCount="indefinite"
        />
        <polygon
          points={`${x},${cy} ${x - 28 * size},${cy - 7 * size} ${x - 28 * size},${cy + 7 * size}`}
          fill={color}
          opacity={0.35}
        />
        <polygon
          points={`${x},${cy} ${x - 14 * size},${cy - 3 * size} ${x - 14 * size},${cy + 3 * size}`}
          fill={color}
          opacity={0.7}
        />
        <circle cx={x - r * 0.6} cy={cy} r={1.8 * size} fill="#fff" />
      </g>

      {/* dome (drawn over beam so the glass tints it) */}
      <path
        d={`M ${x - r} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y + r} Z`}
        fill={color}
        opacity={0.35}
      />
      <path
        d={`M ${x - r} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y + r}`}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.9}
      />
      <ellipse cx={x - r * 0.4} cy={y + r * 0.3} rx={r * 0.35} ry={r * 0.18} fill="#fff" opacity={0.6} />

      {/* pulsing glow */}
      <ellipse cx={x} cy={y + r + 2} rx={r * 3} ry={r * 1.8} fill={color} opacity={0.22} pointerEvents="none">
        <animate attributeName="opacity" values="0.12;0.38;0.12" dur={speed} repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

// ---------- Status bulb color mapping ---------------------------------------
// Only branches whose most recent pipeline actually ran get a colored bulb;
// branches with no CI history (rawStatus 'none' / 'error') keep the neutral
// warm pendant light.
function statusBulbColor(
  state: PipelineState,
  rawStatus: string | undefined,
): string | undefined {
  if (state === 'working') return '#58a6ff'; // running — blue
  if (state === 'failed') return '#ef4444'; // failed — red
  if (state === 'waiting') return '#d29922'; // pending — amber
  if (state === 'off') return '#6a6a6a'; // canceled — gray
  // state === 'idle' covers success / manual / skipped / no-pipeline.
  // Only light up green when an actual successful pipeline is recorded.
  if (state === 'idle' && rawStatus && rawStatus !== 'none' && rawStatus !== 'error') {
    return '#3fb950'; // success — green
  }
  return undefined;
}

// ===================================================================
// MAIN SCENE
// ===================================================================

export default function OfficeScene({ activeBranches }: Props) {
  const pipelines = useAppSelector((s) => s.pipelines.byBranch);

  const N = activeBranches.length;

  // Room dimensions based on branch count
  const deskRowW = N * DESK_W + (N - 1) * DESK_GAP;
  const minRoomW = 980;
  const roomW = Math.max(minRoomW, AMBIENT_W_LEFT + deskRowW + AMBIENT_W_RIGHT + 80);
  const roomH = WALL_H + WALL_CAP_H + 440;

  // Where to start the desks (centered in the middle strip)
  const desksStartX = (roomW - deskRowW) / 2;

  // Any failed pipeline triggers the office-wide red alarm sirens.
  const hasFailure = activeBranches.some(
    (b) => pipelines[b.name]?.state === 'failed',
  );

  return (
    <svg
      viewBox={`0 0 ${roomW} ${roomH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      style={{ display: 'block', background: '#2a1812', flex: 1 }}
    >
      <defs>
        <radialGradient id="floorGlow" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#ff9a5a" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#ff9a5a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sceneFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.35} />
        </linearGradient>
      </defs>

      {/* ---- Back wall ---- */}
      <BackWall width={roomW} />

      {/* Windows above desks (dynamic count) */}
      {(() => {
        const winH = 96;
        const winY = 40;
        const winCount = Math.max(2, Math.min(N, 4));
        const totalWinW = Math.min(roomW - 280, winCount * 130 + (winCount - 1) * 18);
        const startX = (roomW - totalWinW) / 2;
        const winW = (totalWinW - (winCount - 1) * 18) / winCount;
        const wins: JSX.Element[] = [];
        for (let i = 0; i < winCount; i++) {
          wins.push(
            <SunsetWindow
              key={i}
              x={startX + i * (winW + 18)}
              y={winY}
              w={winW}
              h={winH}
            />,
          );
        }
        return wins;
      })()}

      {/* Shelf + poster left of windows */}
      <WallShelf x={16} y={70} w={130} />
      <HangingPlant x={60} y={18} />
      <WallClock x={118} y={128} r={18} />

      {/* Poster + pinboard right of windows */}
      <WallPoster x={roomW - 150} y={40} w={60} h={52} theme="text" />
      <WallPoster x={roomW - 82} y={40} w={64} h={52} theme="mountain" />
      <PinBoard x={roomW - 150} y={108} w={132} h={72} />
      <HangingPlant x={roomW - 60} y={18} />

      {/* Neon sign centered between shelf and windows */}
      <NeonSign x={158} y={152} />

      {/* Whiteboard below the poster (if room permits) */}
      {roomW > 1100 && <Whiteboard x={roomW - 280} y={108} w={118} h={64} />}

      {/* ---- Floor ---- */}
      <Floor width={roomW} height={roomH} />

      {/* Warm wash from the windows spilling onto the floor */}
      <rect x={0} y={WALL_H + WALL_CAP_H} width={roomW} height={roomH} fill="url(#floorGlow)" pointerEvents="none" />

      {/* Rug under the lounge area (left side, below desks) */}
      <Rug x={40} y={DESK_ROW_Y + DESK_H + 130} w={300} h={150} />

      {/* Sofa on the rug */}
      <Sofa x={80} y={DESK_ROW_Y + DESK_H + 150} />

      {/* Office dog on the rug */}
      <OfficeDog x={60} y={DESK_ROW_Y + DESK_H + 220} />

      {/* Skateboard next to the sofa */}
      <Skateboard x={260} y={DESK_ROW_Y + DESK_H + 260} />

      {/* Front-corner plants */}
      <Monstera x={30} y={WALL_H + WALL_CAP_H + 66} />

      {/* Coffee station on the right */}
      <CoffeeStation x={roomW - 170} y={DESK_ROW_Y + DESK_H + 150} />

      {/* Trash can next to coffee */}
      <TrashCan x={roomW - 50} y={DESK_ROW_Y + DESK_H + 160} />

      {/* Monsteras flanking the coffee area */}
      <Monstera x={roomW - 200} y={DESK_ROW_Y + DESK_H + 170} />
      <Monstera x={roomW - 30} y={WALL_H + WALL_CAP_H + 66} />

      {/* ---- Chairs + floor shadows (drawn behind desks so desks overlap them) ---- */}
      {activeBranches.map((branch, i) => {
        const pipe = pipelines[branch.name];
        const state: PipelineState = pipe?.state ?? 'idle';
        const dx = desksStartX + i * (DESK_W + DESK_GAP);
        const sitting = state === 'working';
        const chairX = dx + (DESK_W - 36) / 2;
        const chairY = DESK_ROW_Y + DESK_H + 18;
        const charX = dx + (DESK_W - CHAR_PIXEL_W) / 2;
        const shadowY = sitting ? chairY + 34 : chairY + 34 + CHAR_PIXEL_H + 2;
        return (
          <g key={`ch-${branch.name}`}>
            <Chair x={chairX} y={chairY} color={branch.color} />
            <ellipse
              cx={charX + CHAR_PIXEL_W / 2}
              cy={shadowY}
              rx={18}
              ry={4}
              fill="#000"
              opacity={0.3}
            />
          </g>
        );
      })}

      {/* Floor lamps standing behind each desk — drawn BEFORE the desks so
           the pole and base are covered by the desk top, making the lamp look
           like it stands behind the desk. The police-siren head sits above
           the desk on the wall and rotates on running (blue) / failed (red). */}
      {activeBranches.map((branch, i) => {
        const pipe = pipelines[branch.name];
        const state: PipelineState = pipe?.state ?? 'idle';
        const statusColor = statusBulbColor(state, pipe?.rawStatus);
        const rotating = state === 'working' || state === 'failed';
        return (
          <FloorLamp
            key={`fl-${branch.name}`}
            x={desksStartX + i * (DESK_W + DESK_GAP) + DESK_W / 2}
            statusColor={statusColor}
            rotating={rotating}
          />
        );
      })}

      {/* Desks drawn AFTER chairs but BEFORE characters so the character's upper body overlaps the desk when sitting */}
      {activeBranches.map((branch, i) => {
        const pipe = pipelines[branch.name];
        const state: PipelineState = pipe?.state ?? 'idle';
        const dx = desksStartX + i * (DESK_W + DESK_GAP);
        return (
          <Desk
            key={`desk-${branch.name}`}
            x={dx}
            y={DESK_ROW_Y}
            state={state}
            branchColor={branch.color}
            branchName={branch.name}
          />
        );
      })}

      {/* Finally the characters (standing chars overlap desk front; sitting chars peek from behind) */}
      {activeBranches.map((branch, i) => {
        const pipe = pipelines[branch.name];
        const state: PipelineState = pipe?.state ?? 'idle';
        const h = hashStr(branch.name);
        const skin = SKIN_TONES[h % SKIN_TONES.length];
        const hair = HAIR_COLORS[(h >> 3) % HAIR_COLORS.length];
        const pants = PANTS_COLORS[(h >> 5) % PANTS_COLORS.length];
        const dx = desksStartX + i * (DESK_W + DESK_GAP);
        const sitting = state === 'working';
        const chairY = DESK_ROW_Y + DESK_H + 18;
        const charX = dx + (DESK_W - CHAR_PIXEL_W) / 2;
        const charY = sitting ? chairY + 6 : chairY + 34;

        return (
          <Character
            key={`char-${branch.name}`}
            skinColor={skin}
            hairColor={hair}
            shirtColor={branch.color}
            pantsColor={pants}
            state={state}
            x={charX}
            y={charY}
            scale={CHAR_SCALE}
          />
        );
      })}

      {/* Office-wide red alarm sirens — triggered by any failed pipeline.
           Rotate silently. Staggered starting phases so they don't all flash
           in sync. */}
      {hasFailure && (
        <g>
          {/* subtle room-wide red tint (pulsing) */}
          <rect
            x={0}
            y={0}
            width={roomW}
            height={roomH}
            fill="#ef4444"
            opacity={0.05}
            pointerEvents="none"
          >
            <animate
              attributeName="opacity"
              values="0.03;0.1;0.03"
              dur="0.7s"
              repeatCount="indefinite"
            />
          </rect>

          {/* top-left: above the shelf */}
          <AlarmLight x={24} y={30} size={1} phase={0} />
          {/* top-left corner: near hanging plant */}
          <AlarmLight x={150} y={24} size={0.9} phase={0.25} />
          {/* between shelf area and first window */}
          <AlarmLight x={roomW / 2 - 180} y={18} size={0.85} phase={0.5} />
          {/* above the windows (center) */}
          <AlarmLight x={roomW / 2} y={12} size={1} phase={0.15} />
          {/* between last window and posters */}
          <AlarmLight x={roomW / 2 + 180} y={18} size={0.85} phase={0.75} />
          {/* top-right corner */}
          <AlarmLight x={roomW - 150} y={24} size={0.9} phase={0.4} />
          {/* top-right: near posters */}
          <AlarmLight x={roomW - 24} y={30} size={1} phase={0.6} />
          {/* lower left: near sofa area */}
          <AlarmLight
            x={30}
            y={DESK_ROW_Y + DESK_H + 110}
            size={0.9}
            phase={0.35}
          />
          {/* lower right: near coffee station */}
          <AlarmLight
            x={roomW - 30}
            y={DESK_ROW_Y + DESK_H + 110}
            size={0.9}
            phase={0.85}
          />
        </g>
      )}

      {/* Subtle scene vignette at the bottom */}
      <rect x={0} y={0} width={roomW} height={roomH} fill="url(#sceneFade)" pointerEvents="none" />
    </svg>
  );
}
