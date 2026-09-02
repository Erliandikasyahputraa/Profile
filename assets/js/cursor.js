/**
 * cursor.js — Pixel T-Rex Predator & Bone Drumstick Cursor
 *
 * B&W / Minimal / Predator — no cute/kawaii elements.
 *
 * Architecture:
 *   • Pure Canvas 2D + Pixel Matrices (zero DOM allocations inside loop).
 *   • Theme-Aware Color Mapping (--fg & --bg CSS custom properties).
 *   • Desktop Only. Respects prefers-reduced-motion.
 *   • FSM: LAZY_FOLLOW → WAITING → ANTICIPATING → CHASING → EATING → SATISFIED
 *   • Click on dino: ROAR — head tilts up, low deep rumble pulse, b&w shockwave ring.
 *     Not cute. Not bouncy. Cold predator.
 *   • Dino eats meat (not hearts).
 *   • Walking trail: thin footstep marks (minimal, always visible).
 *   • Cursor is offset FAR enough from dino that clicking doesn't accidentally hit dino hitbox.
 */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('cursor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ═══════════════════════════════════════════════════════════
     1. TUNING PARAMETERS
  ═══════════════════════════════════════════════════════════ */
  const PX               = 2;       // Smaller pixel blocks — cursor-sized
  const IDLE_MS          = 1800;    // ms before hunt starts
  const ANTICIPATE_MS    = 200;

  const DINO_LAZY_ACCEL  = 0.0032;
  const DINO_CHASE_ACCEL = 0.065;
  const MAX_LAZY_SPEED   = 1.2;
  const MAX_CHASE_SPEED  = 8.5;
  const DAMPING          = 0.84;

  const EAT_DISTANCE     = 11;
  const EAT_DURATION     = 650;
  const SATISFIED_PAUSE  = 500;

  // Dino starts this many pixels away from the cursor horizontally
  // Large enough that clicking cursor doesn't trigger dino hitbox
  const INIT_OFFSET_X    = 160;
  const INIT_OFFSET_Y    = 50;

  const MAX_DUST         = 24;
  const DUST_SPAWN_RATE  = 2;

  /* ═══════════════════════════════════════════════════════════
     2. FSM
  ═══════════════════════════════════════════════════════════ */
  const STATES = {
    LAZY_FOLLOW:  'LAZY_FOLLOW',
    WAITING:      'WAITING',
    ANTICIPATING: 'ANTICIPATING',
    CHASING:      'CHASING',
    EATING:       'EATING',
    SATISFIED:    'SATISFIED',
    ROARING:      'ROARING',  // Cold predator growl on click
  };

  /* ═══════════════════════════════════════════════════════════
     3. PIXEL SPRITES
     0=transparent, 1=body(fg), 2=eye(bg socket+fg pupil),
     3=tooth(bg/white), 4=bone mid-gray(#828288), 5=bone light(#b4b4ba)
  ═══════════════════════════════════════════════════════════ */

  /* ── Roast Drumstick Cursor (12×12) ─────────────────────────
     Three-tone: 1=meat(fg), 4=bone-mid(#828288), 5=bone-light(#b4b4ba)
     Pointer tip at top-left (col 1, row 0). Angled ↖↘ like a mouse cursor.
  */
  const SPRITE_MEAT = [
    //0  1  2  3  4  5  6  7  8  9 10 11
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0  tip
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r1  meat bulge
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // r2  thickest meat
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r3  meat body
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r4  meat lower
    [0, 0, 1, 1, 1, 1, 1, 1, 4, 5, 0, 0], // r5  meat→bone
    [0, 0, 0, 1, 1, 1, 4, 5, 4, 5, 0, 0], // r6  bone joint
    [0, 0, 0, 0, 4, 5, 4, 5, 4, 0, 0, 0], // r7  bone shaft
    [0, 0, 0, 0, 0, 5, 4, 0, 4, 5, 0, 0], // r8  knuckle
    [0, 0, 0, 0, 0, 4, 5, 0, 5, 4, 5, 0], // r9  knuckle
    [0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 4], // r10 end
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5], // r11 tip
  ];

  /* ── Head: Normal Closed ─────────── */
  const HEAD_NORMAL = [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── Head: Mouth Wide Open (lunging) ── */
  const HEAD_OPEN_WIDE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3, 3, 3, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── Head: Chomp bite ── */
  const HEAD_CHOMP = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 1, 3, 1, 3, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── Head: ROAR — Head lifted, jaw wide, cold predator (replaces cute surprised) ── */
  const HEAD_ROAR = [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Skull lifted
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // Forehead
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0], // Eye — cold, no blush
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // Snout raised up
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0], // Upper jaw teeth exposed
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Open mouth void
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 1, 3, 1, 3, 0, 0, 0, 0, 0], // Lower jaw jagged teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  ];

  /* ── Leg Frames ── */
  const LEGS_STAND = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const LEGS_STRIDE_A = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const LEGS_PASSING = [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
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
     4. STATE & DYNAMICS
  ═══════════════════════════════════════════════════════════ */
  let W = 0, H = 0;
  let mouseX = -999, mouseY = -999;
  let foodX  = -999, foodY  = -999;
  let dinoX  = 0, dinoY = 0;
  let velX   = 0, velY  = 0;

  let hasMoved    = false;
  let mouseInside = false;
  let lastMouseMoveTime = 0;

  let currentState    = STATES.LAZY_FOLLOW;
  let stateTimer      = 0;
  let isFacingLeft    = false;
  let walkTick        = 0;
  let walkFrame       = 0;
  let foodScale       = 1.0;
  let foodVisible     = true;

  // Roar state
  let isRoaring      = false;
  let roarStartTime  = 0;
  const ROAR_DURATION = 700;

  // Walking footstep trail marks
  const footprints = [];
  const MAX_FOOTPRINTS = 18;
  let lastFootstepX = -999, lastFootstepY = -999;

  const dustParticles = [];
  const biteCrumbs    = [];

  /* ── Resize ── */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Touch Detection ── */
  let isTouchActive = false;
  window.addEventListener('touchstart', () => {
    isTouchActive = true;
    mouseInside   = false;
    document.documentElement.classList.remove('custom-cursor-active');
    if (ctx) ctx.clearRect(0, 0, W, H);
  }, { passive: true });

  /* ── Mouse Tracking ── */
  document.addEventListener('mousemove', e => {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;

    isTouchActive = false;
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseMoveTime = performance.now();

    if (!hasMoved) {
      hasMoved = true;
      foodX    = mouseX;
      foodY    = mouseY;
      // Dino starts far from cursor — large offset so clicking cursor ≠ clicking dino
      dinoX = Math.max(10, Math.min(W - 80, mouseX - INIT_OFFSET_X));
      dinoY = Math.max(10, Math.min(H - 60, mouseY + INIT_OFFSET_Y));
    }
    mouseInside = true;
    document.documentElement.classList.add('custom-cursor-active');

    if (currentState === STATES.WAITING || currentState === STATES.ANTICIPATING || currentState === STATES.CHASING) {
      currentState = STATES.LAZY_FOLLOW;
    }
  });

  document.addEventListener('mouseenter', () => {
    if (!isTouchActive) {
      mouseInside = true;
      document.documentElement.classList.add('custom-cursor-active');
    }
  });
  document.addEventListener('mouseleave', () => {
    mouseInside = false;
    document.documentElement.classList.remove('custom-cursor-active');
  });

  /* ── Click: Predator Roar ── */
  document.addEventListener('click', e => {
    if (!mouseInside || isTouchActive) return;

    // Only trigger roar if click is within dino hitbox
    const spriteCols = 26;
    const spriteRows = 18;
    const spriteW    = spriteCols * PX;
    const spriteH    = spriteRows * PX;
    const clickX = e.clientX, clickY = e.clientY;

    const onDino = (
      clickX >= dinoX - 8 &&
      clickX <= dinoX + spriteW + 8 &&
      clickY >= dinoY - 8 &&
      clickY <= dinoY + spriteH + 8
    );

    if (onDino && !isRoaring && currentState !== STATES.EATING) {
      isRoaring     = true;
      roarStartTime = performance.now();
      // Spawn B&W shockwave rings and debris
      spawnRoarShockwave(dinoX + spriteW * 0.6, dinoY + spriteH * 0.25);
      playRoarSound();
    }
  });

  /* ── Color Extraction ── */
  function getFG() {
    return getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#000000';
  }
  function getBG() {
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#ffffff';
  }

  /* ── Pixel Matrix Renderer ── */
  function drawMatrix(grid, x, y, fg, bg, flipX, scale = 1.0) {
    const cols = grid[0].length;
    const rows = grid.length;
    const pxSize = PX * scale;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        if (val === 0) continue;

        const colIdx = flipX ? (cols - 1 - c) : c;
        const drawX = Math.round(x + colIdx * pxSize);
        const drawY = Math.round(y + r * pxSize);

        if (val === 1) {
          ctx.fillStyle = fg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 2) {
          // Eye socket + pupil
          ctx.fillStyle = bg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
          ctx.fillStyle = fg;
          const pupilX = flipX ? drawX : drawX + Math.round(pxSize * 0.4);
          ctx.fillRect(pupilX, drawY + Math.round(pxSize * 0.2), Math.max(1, Math.round(pxSize * 0.5)), Math.max(1, Math.round(pxSize * 0.5)));
        } else if (val === 3) {
          // Teeth (bg color)
          ctx.fillStyle = bg;
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 4) {
          // Bone mid-gray
          ctx.fillStyle = '#828288';
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        } else if (val === 5) {
          // Bone light-gray
          ctx.fillStyle = '#b4b4ba';
          ctx.fillRect(drawX, drawY, Math.ceil(pxSize), Math.ceil(pxSize));
        }
      }
    }
  }

  /* ── Footprint Trail (appears when walking slowly) ── */
  function spawnFootprint(x, y, fg) {
    const dist = Math.hypot(x - lastFootstepX, y - lastFootstepY);
    if (dist < 18) return; // Only stamp every 18px of movement
    lastFootstepX = x;
    lastFootstepY = y;
    footprints.push({
      x: x + (Math.random() - 0.5) * 4,
      y,
      life: 1.0,
      decay: 0.008,
      color: fg,
    });
    if (footprints.length > MAX_FOOTPRINTS) footprints.shift();
  }

  /* ── Dust Spawner ── */
  function spawnDust(x, y, dirX) {
    if (dustParticles.length >= MAX_DUST) return;
    for (let i = 0; i < DUST_SPAWN_RATE; i++) {
      dustParticles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 4,
        vx: -dirX * (Math.random() * 1.6 + 0.6),
        vy: -(Math.random() * 0.8 + 0.2),
        size: PX * (Math.random() * 0.6 + 0.7),
        scale: 0.8,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.03,
      });
    }
  }

  /* ── Bite Crumbs ── */
  function spawnBiteCrumbs(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1.0;
      biteCrumbs.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: Math.random() > 0.4 ? PX : PX * 0.65,
        color: Math.random() > 0.5 ? '#828288' : null, // Bone or meat
        life: 1.0,
        decay: 0.055 + Math.random() * 0.04,
      });
    }
  }

  /* ── Roar Shockwave (B&W expanding rings + debris) ── */
  const roarRings = [];
  const roarDebris = [];

  function spawnRoarShockwave(x, y) {
    // 3 expanding concentric rings, B&W
    for (let i = 0; i < 3; i++) {
      roarRings.push({
        x, y,
        r: 4 + i * 8,
        maxR: 45 + i * 18,
        life: 1.0,
        decay: 0.028 + i * 0.01,
        delay: i * 80, // ms
        born: performance.now() + i * 80,
      });
    }
    // Debris — small B&W squares
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.0;
      roarDebris.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() > 0.5 ? PX * 1.5 : PX,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
      });
    }
  }

  /* ── Roar Sound: Deep low growl pulse ── */
  function playRoarSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      const now = actx.currentTime;

      // Low rumble oscillator
      const osc1 = actx.createOscillator();
      const gain1 = actx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(60, now);
      osc1.frequency.exponentialRampToValueAtTime(28, now + 0.5);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.07, now + 0.06);
      gain1.gain.linearRampToValueAtTime(0.04, now + 0.35);
      gain1.gain.linearRampToValueAtTime(0, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(actx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Mid growl harmonic
      const osc2 = actx.createOscillator();
      const gain2 = actx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(90, now);
      osc2.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(actx.destination);
      osc2.start(now);
      osc2.stop(now + 0.5);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════
     5. MAIN LOOP
  ═══════════════════════════════════════════════════════════ */
  function tick(now) {
    ctx.clearRect(0, 0, W, H);

    if (!hasMoved || !mouseInside || isTouchActive) {
      requestAnimationFrame(tick);
      return;
    }

    const fg = getFG();
    const bg = getBG();

    /* ── A. Food tracking ── */
    if (currentState !== STATES.EATING) {
      foodX = mouseX;
      foodY = mouseY;
    }

    const timeSinceMouseMove = now - lastMouseMoveTime;

    /* ── B. Spatial math ── */
    const spriteCols = 26;
    const spriteRows = 18;
    const spriteW    = spriteCols * PX;
    const spriteH    = spriteRows * PX;

    const snoutRelX = isFacingLeft ? 0 : (spriteCols - 1) * PX;
    const snoutRelY = 4.5 * PX;
    const snoutWorldX = dinoX + snoutRelX;
    const snoutWorldY = dinoY + snoutRelY;

    const deltaX = foodX - snoutWorldX;
    const deltaY = foodY - snoutWorldY;
    const distToFood = Math.hypot(deltaX, deltaY);

    /* ── C. Hover Detection ── */
    // Cursor is far from dino (by INIT_OFFSET_X offset), so this rarely triggers accidentally.
    // Keep a tighter hitbox to avoid false triggers.
    const isHoveringDino = (
      foodX >= dinoX + 4 &&
      foodX <= dinoX + spriteW - 4 &&
      foodY >= dinoY + 4 &&
      foodY <= dinoY + spriteH - 4
    );

    /* ── C2. FSM ── */
    switch (currentState) {
      case STATES.LAZY_FOLLOW:
        if (timeSinceMouseMove >= IDLE_MS) {
          currentState = STATES.WAITING;
          stateTimer   = now;
        }
        break;

      case STATES.WAITING:
        if (now - stateTimer > 120) {
          currentState = STATES.ANTICIPATING;
          stateTimer   = now;
        }
        break;

      case STATES.ANTICIPATING:
        if (now - stateTimer >= ANTICIPATE_MS) {
          currentState = STATES.CHASING;
        }
        break;

      case STATES.CHASING:
        if (distToFood <= EAT_DISTANCE) {
          currentState = STATES.EATING;
          stateTimer   = now;
          spawnBiteCrumbs(foodX, foodY);
        }
        break;

      case STATES.EATING: {
        const eatElapsed = now - stateTimer;
        const progress = Math.min(1.0, eatElapsed / EAT_DURATION);

        foodScale = Math.max(0, 1.0 - progress * 1.8);
        if (progress > 0.4) foodVisible = false;

        if (progress > 0.30 && progress < 0.36 && biteCrumbs.length < 4) {
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

      case STATES.ROARING:
        if (now - stateTimer >= ROAR_DURATION) {
          currentState = STATES.LAZY_FOLLOW;
        }
        break;
    }

    /* ── D. Physics ── */
    if (currentState === STATES.CHASING) {
      velX += deltaX * DINO_CHASE_ACCEL;
      velY += deltaY * DINO_CHASE_ACCEL;
      const spd = Math.hypot(velX, velY);
      if (spd > MAX_CHASE_SPEED) {
        velX = (velX / spd) * MAX_CHASE_SPEED;
        velY = (velY / spd) * MAX_CHASE_SPEED;
      }
    } else if (currentState === STATES.LAZY_FOLLOW) {
      velX += deltaX * DINO_LAZY_ACCEL;
      velY += deltaY * DINO_LAZY_ACCEL;
      const spd = Math.hypot(velX, velY);
      if (spd > MAX_LAZY_SPEED) {
        velX = (velX / spd) * MAX_LAZY_SPEED;
        velY = (velY / spd) * MAX_LAZY_SPEED;
      }
    } else if (currentState === STATES.ANTICIPATING) {
      velX *= 0.5;
      velY *= 0.5;
    } else if (currentState === STATES.ROARING) {
      // Very slow drifting stop — predator stance
      velX *= 0.3;
      velY *= 0.3;
    } else {
      velX *= 0.7;
      velY *= 0.7;
    }

    velX *= DAMPING;
    dinoX += velX;
    dinoY += velY;

    dinoX = Math.max(0, Math.min(W - spriteW, dinoX));
    dinoY = Math.max(0, Math.min(H - spriteH, dinoY));

    const currentSpeed = Math.hypot(velX, velY);

    if (Math.abs(velX) > 0.3) {
      isFacingLeft = velX < 0;
    } else if (currentState === STATES.CHASING || currentState === STATES.ANTICIPATING) {
      isFacingLeft = deltaX < 0;
    }

    /* ── E. Footprint Trail (slow walk only) ── */
    if (currentSpeed > 0.3 && currentSpeed < 2.2 && currentState === STATES.LAZY_FOLLOW) {
      const footX = dinoX + (isFacingLeft ? spriteW * 0.75 : spriteW * 0.25);
      const footY = dinoY + spriteH - PX;
      spawnFootprint(footX, footY, fg);
    }

    // Render fading footprints
    for (let i = footprints.length - 1; i >= 0; i--) {
      const fp = footprints[i];
      fp.life -= fp.decay;
      if (fp.life <= 0) { footprints.splice(i, 1); continue; }
      ctx.fillStyle = fp.color;
      ctx.globalAlpha = fp.life * 0.18;
      // Two tiny dots (left/right foot)
      ctx.fillRect(Math.round(fp.x - PX), Math.round(fp.y), PX, PX);
      ctx.fillRect(Math.round(fp.x + PX), Math.round(fp.y), PX, PX);
    }

    /* ── E2. Sprint Dust ── */
    if (currentState === STATES.CHASING && currentSpeed > 3.0) {
      const trailingFootX = dinoX + (isFacingLeft ? spriteW * 0.8 : spriteW * 0.2);
      const trailingFootY = dinoY + spriteH - 2 * PX;
      const moveDir = velX !== 0 ? Math.sign(velX) : (isFacingLeft ? -1 : 1);
      spawnDust(trailingFootX, trailingFootY, moveDir);
    }

    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const p = dustParticles[i];
      p.x += p.vx; p.y += p.vy;
      p.scale += 0.03;
      p.life -= p.decay;
      if (p.life <= 0) { dustParticles.splice(i, 1); continue; }
      ctx.fillStyle = fg;
      ctx.globalAlpha = p.life * 0.22;
      const sz = Math.ceil(p.size * p.scale);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
    }

    /* ── E3. Bite Crumbs ── */
    for (let i = biteCrumbs.length - 1; i >= 0; i--) {
      const p = biteCrumbs[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.18;
      p.life -= p.decay;
      if (p.life <= 0) { biteCrumbs.splice(i, 1); continue; }
      ctx.fillStyle = p.color || fg;
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }

    /* ── E4. Roar Shockwave Rings & Debris ── */
    for (let i = roarRings.length - 1; i >= 0; i--) {
      const rr = roarRings[i];
      if (now < rr.born) continue;
      const elapsed = now - rr.born;
      const t = Math.min(1, elapsed / 400);
      rr.r = 4 + t * (rr.maxR - 4);
      rr.life -= rr.decay;
      if (rr.life <= 0) { roarRings.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(rr.x, rr.y, rr.r, 0, Math.PI * 2);
      ctx.strokeStyle = fg;
      ctx.globalAlpha = rr.life * 0.55;
      ctx.lineWidth = Math.max(0.5, rr.life * PX * 0.8);
      ctx.stroke();
    }
    for (let i = roarDebris.length - 1; i >= 0; i--) {
      const p = roarDebris[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12;
      p.life -= p.decay;
      if (p.life <= 0) { roarDebris.splice(i, 1); continue; }
      ctx.fillStyle = fg;
      ctx.globalAlpha = p.life * 0.7;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }

    ctx.globalAlpha = 1.0;

    /* ── F. Animation Selection ── */
    walkTick++;
    const isSprinting = currentState === STATES.CHASING;
    const strideCadence = isSprinting ? 3 : 8;

    if (currentSpeed > 0.4 && walkTick % strideCadence === 0) {
      walkFrame = (walkFrame + 1) % 4;
    } else if (currentSpeed <= 0.4 && currentState !== STATES.CHASING) {
      walkFrame = 0;
    }

    let activeLegs = LEGS_STAND;
    let verticalBob = 0;

    if (currentState === STATES.ROARING) {
      activeLegs = LEGS_STAND;
      verticalBob = -1; // Slight lift — chest puff
    } else if (currentState === STATES.ANTICIPATING) {
      activeLegs = LEGS_STAND;
      verticalBob = 1;
    } else if (currentSpeed > 0.4) {
      if (walkFrame === 0)      { activeLegs = LEGS_STRIDE_A; verticalBob = 1;  }
      else if (walkFrame === 1) { activeLegs = LEGS_PASSING;  verticalBob = -1; }
      else if (walkFrame === 2) { activeLegs = LEGS_STRIDE_B; verticalBob = 1;  }
      else if (walkFrame === 3) { activeLegs = LEGS_PASSING;  verticalBob = -1; }
    }

    let activeHead = HEAD_NORMAL;
    if (currentState === STATES.ROARING) {
      // Roar: head oscillates between ROAR and CHOMP for angry snapping effect
      const roarT = (now - roarStartTime) / ROAR_DURATION;
      const snapPhase = Math.floor(roarT * 5) % 2;
      activeHead = snapPhase === 0 ? HEAD_ROAR : HEAD_CHOMP;
      verticalBob = -2; // Head throws back then forward
    } else if (currentState === STATES.EATING) {
      const eatElapsed = now - stateTimer;
      const progress = eatElapsed / EAT_DURATION;
      if (progress < 0.35) {
        activeHead = HEAD_OPEN_WIDE;
        verticalBob = -1;
      } else if (progress < 0.65) {
        activeHead = HEAD_CHOMP;
        verticalBob = 1;
      } else {
        activeHead = HEAD_OPEN_WIDE;
      }
    }

    const fullDinoMatrix = [...activeHead, ...activeLegs];

    /* ── G. Draw Dino ── */
    drawMatrix(
      fullDinoMatrix,
      Math.round(dinoX),
      Math.round(dinoY + verticalBob * PX),
      fg,
      bg,
      isFacingLeft,
      1.0
    );

    /* ── H. Draw Meat Cursor ── */
    if (foodVisible && mouseInside) {
      const drawMeatX = Math.round(foodX - 1 * PX * foodScale);
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

  requestAnimationFrame(tick);
})();
