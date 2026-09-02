/**
 * cursor.js — Masterclass Pixel T-Rex Predator & Cartoon Meat Cursor
 *
 * Architecture & Design:
 *   • Pure Canvas 2D + Pixel Matrices (zero DOM allocations inside loop).
 *   • Theme-Aware Color Mapping (--fg & --bg CSS custom properties).
 *   • Desktop Only (ignores touch devices) & Respects prefers-reduced-motion.
 *   • Deterministic Finite State Machine (FSM):
 *       [LAZY_FOLLOW] ──(Mouse Stops)──> [WAITING] ──(1.6s)──> [ANTICIPATING]
 *             │                              │                     │
 *             │<──(Mouse Moves)──────────────┴─────────────────────┘
 *             ▼
 *         [CHASING] ──(Head reaches meat)──> [EATING] ──> [SATISFIED] ──> [LAZY_FOLLOW]
 *             │                                                              ▲
 *             └──(Mouse Moves during chase)──────────────────────────────────┘
 *   • Anatomically Authentic 26×18 T-Rex Sprite (Boxy skull, brow, jaw teeth, tiny arms,
 *     muscular thighs, tapered tail, and 4-frame dynamic run cycle with body bob).
 *   • Anime-style Cartoon Drumstick Meat on Bone Cursor.
 *   • Physical Snout-to-Food collision & multi-phase Chomp/Bite animation with crumbs.
 *   • Expanding Pixel Dust clouds kicked up from feet during sprint.
 *   • Zero (0,0) startup artifact guarantee.
 */

(function () {
  'use strict';

  // Device & accessibility checks
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('cursor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ═══════════════════════════════════════════════════════════
     1. CONFIGURABLE TUNING PARAMETERS
  ═══════════════════════════════════════════════════════════ */
  const PX               = 3;        // Pixel block scale (3px = crisp retro density)
  const IDLE_MS          = 1600;     // Wait duration after mouse stops before hunt (ms)
  const ANTICIPATE_MS    = 180;      // Crouch/anticipation duration before sprint (ms)
  
  const DINO_LAZY_ACCEL  = 0.0035;   // Sluggish drift while mouse moves
  const DINO_CHASE_ACCEL = 0.070;    // Aggressive sprint acceleration
  const MAX_LAZY_SPEED   = 1.4;      // Max speed during lazy follow
  const MAX_CHASE_SPEED  = 9.2;      // Top sprint velocity
  const DAMPING          = 0.86;     // Physical friction/inertia decay
  
  const EAT_DISTANCE     = 14;       // Physical distance between snout tip & meat center to trigger bite
  const EAT_DURATION     = 700;      // Total chomp & chew sequence time (ms)
  const SATISFIED_PAUSE  = 450;      // Idle pause after eating (ms)
  
  const MAX_DUST         = 30;       // Max active dust puffs
  const DUST_SPAWN_RATE  = 2;        // Particles per sprint tick

  /* ═══════════════════════════════════════════════════════════
     2. FINITE STATE MACHINE DEFINITION
  ═══════════════════════════════════════════════════════════ */
  const STATES = {
    LAZY_FOLLOW:  'LAZY_FOLLOW',
    WAITING:      'WAITING',
    ANTICIPATING: 'ANTICIPATING',
    CHASING:      'CHASING',
    EATING:       'EATING',
    SATISFIED:    'SATISFIED',
  };

  /* ═══════════════════════════════════════════════════════════
     3. PIXEL MATRICES (Facing Right)
     0 = transparent, 1 = solid body (FG), 2 = eye/socket, 3 = tooth/bone (BG/white)
  ═══════════════════════════════════════════════════════════ */

  /* ── Slanted Cartoon Roast Drumstick (15 Cols × 15 Rows) ─────────
     Tilted diagonally ~40° pointing up-left (↖) matching classic mouse pointer posture:
     - Active click pointer tip at top-left (col 2, row 0)
     - Thick roast thigh meat body in the upper-left
     - Dual-tone pixelated gray bone shaft & knuckles extending down-right (↘)
     0 = transparent
     1 = meat body (FG: black in light theme, white in dark theme)
     4 = bone mid-gray (#828288: high contrast on both themes)
     5 = bone light-gray (#b4b4ba: pixelated knuckle highlight)
  */
  const SPRITE_MEAT = [
    //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0  Tip of drumstick (active pointer tip)
    [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r1  Curved top of roast meat
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r2  Upper roast meat bulge
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // r3  Thick juicy drumstick body
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // r4  Thickest center contour
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r5  Lower meat bulge
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r6  Lower curve
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r7  Meat tapering toward bone
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 4, 5, 0, 0, 0], // r8  Meat-to-bone joint
    [0, 0, 0, 0, 0, 1, 1, 1, 4, 5, 4, 5, 0, 0, 0], // r9  Bone shaft diagonal
    [0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 5, 4, 5, 0, 0], // r10 Bone shaft extending
    [0, 0, 0, 0, 0, 0, 0, 0, 5, 4, 0, 4, 5, 5, 0], // r11 Upper knuckle lobe + notch
    [0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 0, 5, 4, 5, 4], // r12 Double knuckle lobes
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 4], // r13 Lower knuckle base
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 0], // r14 Bottom rounded end
  ];

  /* ── Head State 1: Normal Closed Mouth (26 Cols × 11 Rows) ───
     Eye at (col 17, row 2), Snout tip at (col 25, row 3)       */
  const HEAD_NORMAL = [
    //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // r0 Skull crest
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // r1 Forehead
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0], // r2 Eye brow & socket
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // r3 Snout top & nostril
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r4 Snout
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 0, 0], // r5 Upper teeth seam
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r6 Lower jaw
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r7 Throat & neck
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r8 Chest & back
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // r9 Tail base + arm
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r10 Belly + 2 claws
  ];

  /* ── Head State 2: Mouth Wide Open (Eating Lunging Frame) ──── */
  const HEAD_OPEN_WIDE = [
    //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 0, 0, 0], // Upper jaw lifted + teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Huge open mouth cavity
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3, 3, 3, 1, 1, 0, 0, 0], // Lower jaw dropped + teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── Head State 3: Snapping Chomp Frame ────────────────────── */
  const HEAD_CHOMP = [
    //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 1, 3, 1, 3, 1, 0, 0, 0], // Interlocking bite teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── 4-Frame Leg Running Cycle (26 Cols × 7 Rows) ──────────── */
  // Frame 0: Standing / Idle Pose
  const LEGS_STAND = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r11 Upper thigh & pelvis
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r12 Thigh muscle
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r13 Knee split
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r14 Shin
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r15 Ankle
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r16 Claw feet
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // Frame 1: Stride A (Forward reach - Left leg forward, Right leg behind)
  const LEGS_STRIDE_A = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Stride angle
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // Frame 2: Passing / Mid-Stride (Legs cross under body, torso lifts 1px)
  const LEGS_PASSING = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  // Frame 3: Stride B (Right leg forward, Left leg behind)
  const LEGS_STRIDE_B = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ═══════════════════════════════════════════════════════════
     4. SYSTEM STATE & DYNAMICS
  ═══════════════════════════════════════════════════════════ */
  let W = 0, H = 0;
  let mouseX = -999, mouseY = -999;
  let foodX  = -999, foodY  = -999;
  let dinoX  = 0, dinoY = 0;
  let velX   = 0, velY  = 0;
  
  let hasMoved    = false;
  let mouseInside = false;
  let lastMouseMoveTime = 0;

  // FSM tracking
  let currentState    = STATES.LAZY_FOLLOW;
  let stateTimer      = 0;
  let isFacingLeft    = false;
  let walkTick        = 0;
  let walkFrame       = 0;
  let foodScale       = 1.0;
  let foodVisible     = true;

  // Particle pools
  const dustParticles = [];
  const biteCrumbs    = [];

  /* ── Viewport Resize Handler ─────────────── */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Real-time Mouse Listener ─────────────── */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseMoveTime = performance.now();

    if (!hasMoved) {
      hasMoved    = true;
      mouseInside = true;
      foodX = mouseX;
      foodY = mouseY;
      dinoX = mouseX - 160;
      dinoY = mouseY + 70;
    }
    mouseInside = true;

    // Dynamic State Interruption: If mouse is actively moving, return to lazy follow
    if (currentState === STATES.WAITING || currentState === STATES.ANTICIPATING || currentState === STATES.CHASING) {
      currentState = STATES.LAZY_FOLLOW;
    }
  });

  document.addEventListener('mouseenter', () => { mouseInside = true; });
  document.addEventListener('mouseleave', () => { mouseInside = false; });

  /* ── Color Theme Extraction ──────────────── */
  function getFG() {
    return getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#000000';
  }
  function getBG() {
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
  }

  /* ── Optimized Pixel Matrix Renderer ─────── */
  function drawMatrix(grid, x, y, fg, bg, flipX, scale = 1.0) {
    const cols = grid[0].length;
    const rows = grid.length;
    const pxSize = PX * scale;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        if (val === 0) continue; // Transparent

        const colIdx = flipX ? (cols - 1 - c) : c;
        const drawX = Math.round(x + colIdx * pxSize);
        const drawY = Math.round(y + r * pxSize);

        if (val === 1) {
          // Solid Dinosaur / Meat body
          ctx.fillStyle = fg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 2) {
          // Eye (Background socket + tiny foreground pupil)
          ctx.fillStyle = bg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
          ctx.fillStyle = fg;
          const pupilX = flipX ? drawX : drawX + Math.round(pxSize * 0.4);
          ctx.fillRect(pupilX, drawY + Math.round(pxSize * 0.2), Math.max(1, Math.round(pxSize * 0.5)), Math.max(1, Math.round(pxSize * 0.5)));
        } else if (val === 3) {
          // Teeth (Cutout using bg)
          ctx.fillStyle = bg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 4) {
          // Bone Mid-Tone Gray (Balanced for high contrast on both white & black backgrounds)
          ctx.fillStyle = '#828288';
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 5) {
          // Bone Light-Tone Gray (Pixelated texture / highlight)
          ctx.fillStyle = '#b4b4ba';
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        }
      }
    }
  }

  /* ── Directional Dust & Bite Crumbs Spawners ─ */
  function spawnDust(x, y, dirX) {
    if (dustParticles.length >= MAX_DUST) return;
    for (let i = 0; i < DUST_SPAWN_RATE; i++) {
      dustParticles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 4,
        vx: -dirX * (Math.random() * 1.8 + 0.8), // Drifts opposite to running direction
        vy: -(Math.random() * 0.9 + 0.3),        // Gentle upward puff
        size: PX * (Math.random() * 0.6 + 0.8),  // Varied pixel sizes
        scale: 0.8,
        life: 1.0,
        decay: 0.045 + Math.random() * 0.03,
      });
    }
  }

  function spawnBiteCrumbs(x, y) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.8 + 1.2;
      const isBoneCrumb = Math.random() > 0.5;
      biteCrumbs.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() > 0.4 ? PX : PX * 0.65,
        color: isBoneCrumb ? '#94949a' : null,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.04,
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════
     5. MAIN ENGINE TICK LOOP (60 FPS)
  ═══════════════════════════════════════════════════════════ */
  function tick(now) {
    ctx.clearRect(0, 0, W, H);

    // Strict startup safety: do not render anything until real mouse interaction
    if (!hasMoved || !mouseInside) {
      requestAnimationFrame(tick);
      return;
    }

    const fg = getFG();
    const bg = getBG();

    /* ── A. Precise Food Tracking ───────────── */
    if (currentState !== STATES.EATING) {
      foodX = mouseX;
      foodY = mouseY;
    }

    const timeSinceMouseMove = now - lastMouseMoveTime;

    /* ── B. Snout Anchor & Spatial Math ─────── */
    const spriteCols = 26;
    const spriteRows = 18;
    const spriteW    = spriteCols * PX;
    const spriteH    = spriteRows * PX;

    // Physical coordinates of T-Rex snout/mouth tip
    const snoutRelX = isFacingLeft ? 0 : (spriteCols - 1) * PX;
    const snoutRelY = 4.5 * PX;
    const snoutWorldX = dinoX + snoutRelX;
    const snoutWorldY = dinoY + snoutRelY;

    // Vector from snout to food center
    const deltaX = foodX - snoutWorldX;
    const deltaY = foodY - snoutWorldY;
    const distToFood = Math.hypot(deltaX, deltaY);

    /* ── C. Deterministic FSM State Updates ─── */
    switch (currentState) {
      case STATES.LAZY_FOLLOW:
        if (timeSinceMouseMove >= IDLE_MS) {
          currentState = STATES.WAITING;
          stateTimer   = now;
        }
        break;

      case STATES.WAITING:
        if (now - stateTimer > 100) {
          currentState = STATES.ANTICIPATING;
          stateTimer   = now;
        }
        break;

      case STATES.ANTICIPATING:
        // Brief 180ms tension before burst sprint
        if (now - stateTimer >= ANTICIPATE_MS) {
          currentState = STATES.CHASING;
        }
        break;

      case STATES.CHASING:
        // Reached food with snout?
        if (distToFood <= EAT_DISTANCE) {
          currentState = STATES.EATING;
          stateTimer   = now;
          spawnBiteCrumbs(foodX, foodY);
        }
        break;

      case STATES.EATING: {
        const eatElapsed = now - stateTimer;
        const progress = Math.min(1.0, eatElapsed / EAT_DURATION);

        // Food shrinks and pulls into mouth
        foodScale = Math.max(0, 1.0 - progress * 1.8);
        if (progress > 0.4) foodVisible = false;

        // Second crunch chomp at 35% mark
        if (progress > 0.32 && progress < 0.38 && biteCrumbs.length < 4) {
          spawnBiteCrumbs(snoutWorldX, snoutWorldY);
        }

        if (progress >= 1.0) {
          currentState = STATES.SATISFIED;
          stateTimer   = now;
          foodVisible  = false;
        }
        break;
      }

      case STATES.SATISFIED:
        if (now - stateTimer >= SATISFIED_PAUSE) {
          currentState = STATES.LAZY_FOLLOW;
          foodVisible  = true;
          foodScale    = 1.0;
        }
        break;
    }

    /* ── D. Physics & Locomotion ────────────── */
    if (currentState === STATES.CHASING) {
      // Powerful sprint towards food
      velX += deltaX * DINO_CHASE_ACCEL;
      velY += deltaY * DINO_CHASE_ACCEL;

      const spd = Math.hypot(velX, velY);
      if (spd > MAX_CHASE_SPEED) {
        velX = (velX / spd) * MAX_CHASE_SPEED;
        velY = (velY / spd) * MAX_CHASE_SPEED;
      }
    } else if (currentState === STATES.LAZY_FOLLOW) {
      // Gentle lazy wander
      velX += deltaX * DINO_LAZY_ACCEL;
      velY += deltaY * DINO_LAZY_ACCEL;

      const spd = Math.hypot(velX, velY);
      if (spd > MAX_LAZY_SPEED) {
        velX = (velX / spd) * MAX_LAZY_SPEED;
        velY = (velY / spd) * MAX_LAZY_SPEED;
      }
    } else if (currentState === STATES.ANTICIPATING) {
      // Freeze in place & tense up
      velX *= 0.5;
      velY *= 0.5;
    } else {
      // Decelerate during eating / waiting / satisfied
      velX *= 0.7;
      velY *= 0.7;
    }

    velX *= DAMPING;
    velY *= DAMPING;
    dinoX += velX;
    dinoY += velY;

    const currentSpeed = Math.hypot(velX, velY);

    // Dynamic facing direction based on movement vector
    if (Math.abs(velX) > 0.3) {
      isFacingLeft = velX < 0;
    } else if (currentState === STATES.CHASING || currentState === STATES.ANTICIPATING) {
      isFacingLeft = deltaX < 0;
    }

    /* ── E. Footstep Dust Trail ─────────────── */
    if (currentState === STATES.CHASING && currentSpeed > 3.0) {
      const trailingFootX = dinoX + (isFacingLeft ? spriteW * 0.8 : spriteW * 0.2);
      const trailingFootY = dinoY + spriteH - 2 * PX;
      const moveDir = velX !== 0 ? Math.sign(velX) : (isFacingLeft ? -1 : 1);
      spawnDust(trailingFootX, trailingFootY, moveDir);
    }

    // Render & expand dust particles
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const p = dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.scale += 0.035; // Expand puff
      p.life -= p.decay;
      if (p.life <= 0) {
        dustParticles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = fg;
      ctx.globalAlpha = p.life * 0.28;
      const sz = Math.ceil(p.size * p.scale);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
    }

    // Render & simulate bite crumbs
    for (let i = biteCrumbs.length - 1; i >= 0; i--) {
      const p = biteCrumbs[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.20; // Gravity pull
      p.life -= p.decay;
      if (p.life <= 0) {
        biteCrumbs.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color || fg;
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1.0;

    /* ── F. Animation Step Selection ────────── */
    walkTick++;
    const isSprinting = currentState === STATES.CHASING;
    const strideCadence = isSprinting ? 3 : 7;

    if (currentSpeed > 0.4 && walkTick % strideCadence === 0) {
      walkFrame = (walkFrame + 1) % 4;
    } else if (currentSpeed <= 0.4 && currentState !== STATES.CHASING) {
      walkFrame = 0; // Solid stance
    }

    let activeLegs = LEGS_STAND;
    let verticalBob = 0;

    if (currentState === STATES.ANTICIPATING) {
      activeLegs = LEGS_STAND;
      verticalBob = 1; // Slight crouch
    } else if (currentSpeed > 0.4) {
      if (walkFrame === 0)      { activeLegs = LEGS_STRIDE_A; verticalBob = 1;  }
      else if (walkFrame === 1) { activeLegs = LEGS_PASSING;  verticalBob = -1; }
      else if (walkFrame === 2) { activeLegs = LEGS_STRIDE_B; verticalBob = 1;  }
      else if (walkFrame === 3) { activeLegs = LEGS_PASSING;  verticalBob = -1; }
    }

    // Choose appropriate head frame
    let activeHead = HEAD_NORMAL;
    if (currentState === STATES.EATING) {
      const eatElapsed = now - stateTimer;
      const progress = eatElapsed / EAT_DURATION;
      if (progress < 0.35) {
        activeHead = HEAD_OPEN_WIDE;
        verticalBob = -1; // Lunging head forward
      } else if (progress < 0.65) {
        activeHead = HEAD_CHOMP;
        verticalBob = 1;
      } else {
        activeHead = HEAD_OPEN_WIDE;
        verticalBob = 0;
      }
    }

    const fullDinoMatrix = [...activeHead, ...activeLegs];

    /* ── G. Draw T-Rex ──────────────────────── */
    drawMatrix(
      fullDinoMatrix,
      Math.round(dinoX),
      Math.round(dinoY + verticalBob * PX),
      fg,
      bg,
      isFacingLeft,
      1.0
    );

    /* ── H. Draw Slanted Cartoon Meat Cursor ────────── */
    if (foodVisible && mouseInside) {
      // Active pointer tip (col 2, row 0) aligns with mouse coordinates
      const drawMeatX = Math.round(foodX - 2 * PX * foodScale);
      const drawMeatY = Math.round(foodY - 1 * PX * foodScale);

      drawMatrix(
        SPRITE_MEAT,
        drawMeatX,
        drawMeatY,
        fg,
        bg,
        false,
        foodScale
      );
    }

    requestAnimationFrame(tick);
  }

  // Kick off render loop
  requestAnimationFrame(tick);
})();
