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
  const IDLE_MS          = 1200;    // ms before hunt starts (1.2 detik, cepat & responsif!)
  const IDLE_SLEEP_MS    = 15000;   // ms idle before stuffed sleep (15 seconds)
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
  const INIT_OFFSET_X    = 160;
  const INIT_OFFSET_Y    = 50;

  // Dead zone: if cursor center is within this many px of dino center,
  // stop all dino movement and lock facing direction — prevents rapid flip jitter.
  const DEAD_ZONE_RADIUS = 55;

  const MAX_DUST         = 24;
  const DUST_SPAWN_RATE  = 2;

  /* ═══════════════════════════════════════════════════════════
     2. FSM
  ═══════════════════════════════════════════════════════════ */
  const STATES = {
    LAZY_FOLLOW:      'LAZY_FOLLOW',
    WALKING_TO_FOOD:  'WALKING_TO_FOOD', // 3 times normal walking pursuit
    WAITING:          'WAITING',         // 4th time: hunter wait
    ANTICIPATING:     'ANTICIPATING',    // 4th time: hunter crouch
    CHASING:          'CHASING',         // 4th time: hunter sprint
    EATING:           'EATING',
    SATISFIED:        'SATISFIED',
    ROARING:          'ROARING',  // Cold predator growl on click
    SLEEPING:         'SLEEPING', // Stuffed / gemoy sleep after 15s idle or 10 drumsticks
    WAKING:           'WAKING',   // Seamless cat stretch & yawn when waking up
  };

  /* ═══════════════════════════════════════════════════════════
     3. PIXEL SPRITES
     0=transparent, 1=body(fg), 2=eye(bg socket+fg pupil),
     3=tooth(bg/white), 4=bone mid-gray(#828288), 5=bone light(#b4b4ba)
  ═══════════════════════════════════════════════════════════ */

  /* ── Roast Drumstick Cursor Variants (12×12) ──────────────────
     Three-tone: 1=meat(fg), 4=bone-mid(#828288), 5=bone-light(#b4b4ba)
     Pointer tip at top-left (col 1, row 0). Angled ↖↘ like a mouse cursor.
  */

  // 1. Normal Default Drumstick
  const SPRITE_MEAT_NORMAL = [
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

  // 2. Bitten Pointer Drumstick (Hover on clickable links & buttons)
  // Has a distinct exposed inner meat section in high-contrast opposite color (3 = bg)
  const SPRITE_MEAT_HOVER = [
    //0  1  2  3  4  5  6  7  8  9 10 11
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0  pointer tip (fg)
    [1, 3, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r1  exposed bite meat (bg)
    [1, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0], // r2  deep bite cavity (bg)
    [1, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0], // r3  exposed inner meat (bg)
    [0, 1, 3, 3, 3, 3, 1, 1, 0, 0, 0, 0], // r4  meat contour (fg + bg)
    [0, 0, 1, 1, 1, 1, 1, 1, 4, 5, 0, 0], // r5  meat→bone
    [0, 0, 0, 1, 1, 1, 4, 5, 4, 5, 0, 0], // r6  bone joint
    [0, 0, 0, 0, 4, 5, 4, 5, 4, 0, 0, 0], // r7  bone shaft
    [0, 0, 0, 0, 0, 5, 4, 0, 4, 5, 0, 0], // r8  knuckle
    [0, 0, 0, 0, 0, 4, 5, 0, 5, 4, 5, 0], // r9  knuckle
    [0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 4], // r10 end
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5], // r11 tip
  ];

  // 3. Chomped Drumstick (Active pointerdown click)
  // Deep bite with exposed inner meat and bone joint
  const SPRITE_MEAT_CLICK = [
    //0  1  2  3  4  5  6  7  8  9 10 11
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0  pointer bone tip
    [1, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r1  
    [1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0], // r2  chomp cavity (bg)
    [0, 1, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0], // r3  
    [0, 0, 1, 3, 3, 1, 1, 0, 0, 0, 0, 0], // r4  
    [0, 0, 0, 1, 1, 1, 1, 4, 5, 0, 0, 0], // r5  
    [0, 0, 0, 0, 1, 4, 5, 4, 5, 0, 0, 0], // r6  
    [0, 0, 0, 0, 4, 5, 4, 5, 4, 0, 0, 0], // r7  
    [0, 0, 0, 0, 0, 5, 4, 0, 4, 5, 0, 0], // r8  
    [0, 0, 0, 0, 0, 4, 5, 0, 5, 4, 5, 0], // r9  
    [0, 0, 0, 0, 0, 0, 0, 0, 4, 5, 4, 4], // r10 
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 5], // r11 
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

  /* ── Head: ROAR ── */
  const HEAD_ROAR = [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Skull lifted
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // Forehead
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 0], // Eye
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

  /* ── Sleeping Cat Curled Pose (Dino Sleeping Like a Cat Loaf) ──
     Head nestled down resting on front paws, smooth curved sleeping cat back,
     peaceful closed eye slit (^_^), tail curled around front embracing body.
  ── */
  const DINO_CAT_SLEEP = [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r0
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r1
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r2
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r3 smooth sleeping cat arch
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // r4 arched back & upper head
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r5 head resting cozy & low
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // r6 forehead & resting snout
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 0], // r7 sleeping eye slit (^_^)
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r8 snout resting on paws
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 0, 0, 0], // r9 mouth nestled
    [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r10 tail curving around side
    [1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r11 chin on tucked paws
    [1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // r12 tail wrapping around front
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r13 cat loaf front tuck
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // r14 belly & tail tip hugging paws
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r15 bottom resting on ground
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r16 flat ground level
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r17 ground line
  ];

  /* ── Morning Cat Stretch & Yawn Pose (Waking State) ──
     Downward cat stretch: front paws extended forward on the floor,
     chest lowered, hind legs standing high, head tilted yawning with sleepy eyes.
  ── */
  const DINO_STRETCH_YAWN = [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // r0 tilted head
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // r1 forehead
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 3, 1, 1, 1, 1, 0, 0], // r2 closed yawn eye slit
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // r3 snout
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3, 3, 3, 3, 3, 0, 0, 0], // r4 upper teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // r5 open yawning void
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3, 3, 1, 1, 0, 0], // r6 lower teeth
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r7 neck
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r8 tail stretching up
    [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // r9 arched back
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // r10 front arms stretching
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0], // r11 downward slope
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0], // r12 rear haunches high
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0], // r13 front paws reaching
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1], // r14 front paws extended
    [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1], // r15 paws touching floor
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1], // r16 flat ground level
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // r17 ground line
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
  let consecutiveEats = 0;
  let idleChaseCount  = 0; // 0, 1, 2 = normal walk, 3 = hunter sprint

  // Smoothed velocity for jitter-free direction (Exponential Moving Average)
  // Prevents rapid left-right flip when dino oscillates around cursor.
  let smoothVelX = 0;
  let smoothVelY = 0;
  const VEL_SMOOTH = 0.15; // EMA weight (lower = more smoothing)

  // Roar state
  let roarStartTime  = 0;
  const ROAR_DURATION = 750; // Refined duration

  // Walking footstep trail marks
  const footprints = [];
  const MAX_FOOTPRINTS = 16;
  let lastFootstepX = -999, lastFootstepY = -999;

  function spawnFootprint(x, y, fg) {
    const dist = Math.hypot(x - lastFootstepX, y - lastFootstepY);
    if (dist < 22) return; // Drop footprint only after moving at least 22px
    lastFootstepX = x;
    lastFootstepY = y;
    footprints.push({
      x: x + (Math.random() - 0.5) * 2,
      y,
      life: 1.0,
      decay: 0.012,
      color: fg,
    });
    if (footprints.length > MAX_FOOTPRINTS) footprints.shift();
  }

  // Walking state
  const dustParticles = [];
  const biteCrumbs    = [];

  // Sleeping Zzz particles
  const zzzParticles = [];
  let lastZzzTime = 0;

  function spawnZzz(x, y) {
    zzzParticles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: (isFacingLeft ? -0.28 : 0.28) + (Math.random() - 0.5) * 0.1,
      vy: -0.45 - Math.random() * 0.15,
      char: 'Zzz',
      size: 9,
      life: 1.0,
      decay: 0.011,
    });
  }

  /* ── Resize ── */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Interactive Cursor State (Meat Transforms) ── */
  let isHoveringClickable = false;
  let isPointerDown       = false;

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

    // Check if hovering over clickable / interactive elements
    const target = e.target;
    if (target && target.closest) {
      isHoveringClickable = !!target.closest(
        'a, button, [role="button"], [role="tab"], input, select, textarea, label, ' +
        '.project-card, .parow, .hero__photo, .fan-card, [tabindex], .map-waypoint-group, ' +
        '.map-mystery-group, .pdetail__thumb-btn, .navbar__lang-pill, .navbar__toggle'
      );
    } else {
      isHoveringClickable = false;
    }

    if (currentState === STATES.SLEEPING) {
      // Waking up: start cute morning cat stretch & yawn transition!
      currentState = STATES.WAKING;
      stateTimer   = performance.now();
      consecutiveEats = 0;
      zzzParticles.length = 0;
      playYawnSound();
    } else if (currentState === STATES.WAITING || currentState === STATES.ANTICIPATING || currentState === STATES.CHASING || currentState === STATES.WALKING_TO_FOOD) {
      currentState = STATES.LAZY_FOLLOW;
      consecutiveEats = 0;
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    isPointerDown = true;
    // Tiny crunchy tactile crumb on click
    spawnBiteCrumbs(mouseX, mouseY);
  });

  document.addEventListener('pointerup', () => {
    isPointerDown = false;
  });

  document.addEventListener('mouseenter', () => {
    if (!isTouchActive) {
      mouseInside = true;
      document.documentElement.classList.add('custom-cursor-active');
    }
  });
  document.addEventListener('mouseleave', () => {
    mouseInside = false;
    isHoveringClickable = false;
    isPointerDown = false;
    document.documentElement.classList.remove('custom-cursor-active');
  });

  /* ── Click: Predator Roar — triggers on clicks, except on toggles/controls ── */
  document.addEventListener('click', (e) => {
    if (!mouseInside || isTouchActive) return;
    // Don't trigger roar on theme toggle or language toggle to prevent audio/performance clash
    if (e.target.closest('#themeToggle, #themeToggleMobile, #langToggle, #langToggleMobile, .navbar__toggle, .navbar__lang-pill, .modal-close-btn')) {
      return;
    }
    // Trigger roar on any click — it's a cool surprise, no hitbox required.
    // Guard: don't interrupt eating, don't stack.
    if (currentState !== STATES.EATING && currentState !== STATES.ROARING) {
      currentState  = STATES.ROARING;
      stateTimer    = performance.now();
      roarStartTime = stateTimer;
      const spriteCols = 26, spriteW = spriteCols * PX;
      const spriteRows = 18, spriteH = spriteRows * PX;
      spawnRoarShockwave(dinoX + spriteW * 0.6, dinoY + spriteH * 0.3);
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

  /* ── Dust Spawner (Subtle Running Smoke Puffs) ── */
  function spawnDust(x, y, dirX) {
    if (dustParticles.length >= MAX_DUST) return;
    for (let i = 0; i < DUST_SPAWN_RATE; i++) {
      dustParticles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 2,
        vx: -dirX * (Math.random() * 1.2 + 0.35),
        vy: -(Math.random() * 0.5 + 0.15), // gentle upward smoke drift
        baseR: 1.5 + Math.random() * 0.5,  // subtle starting radius: 1.5 - 2.0px
        maxR: 2.8 + Math.random() * 0.6,   // gentle puff expansion: 2.8 - 3.4px
        satOffsetX: -dirX * (Math.random() * 2 + 1),
        satOffsetY: -(Math.random() * 2 + 1),
        satR: 1.0 + Math.random() * 0.4,
        life: 1.0,
        decay: 0.048 + Math.random() * 0.02,
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

  /* ── Roar Shockwave — Refined & Crisp ── */
  const roarRings = [];
  const roarDebris = [];
  let shakeIntensity = 0; // Canvas shake state

  function spawnRoarShockwave(x, y) {
    const now = performance.now();

    // 3 subtle, crisp concentric rings
    const ringConfig = [
      { delay:  0, initR:  3, maxR: 38,  decay: 0.024, lw: 1.4 },
      { delay: 80, initR:  6, maxR: 62,  decay: 0.020, lw: 1.1 },
      { delay:170, initR: 10, maxR: 88,  decay: 0.016, lw: 0.8 },
    ];
    for (const cfg of ringConfig) {
      roarRings.push({
        x, y,
        r: cfg.initR,
        maxR: cfg.maxR,
        life: 1.0,
        decay: cfg.decay,
        lw: cfg.lw,
        born: now + cfg.delay,
      });
    }

    // Cardinal pixel bursts — 8 directions, minimal elegant bursts
    const directions = [
      [0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]
    ];
    for (const [dx, dy] of directions) {
      const burstCount = 3;
      for (let j = 0; j < burstCount; j++) {
        const speed = 2.2 + j * 1.0;
        roarDebris.push({
          x: x + dx * (3 + j * 2),
          y: y + dy * (3 + j * 2),
          vx: dx * speed + (Math.random() - 0.5) * 0.5,
          vy: dy * speed - 0.3 + (Math.random() - 0.5) * 0.5,
          size: j === 0 ? PX * 1.8 : PX,
          life: 1.0,
          decay: 0.022 + Math.random() * 0.012,
        });
      }
    }

    // Subtle random scatter debris
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      roarDebris.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: PX,
        life: 1.0,
        decay: 0.024 + Math.random() * 0.015,
      });
    }

    // Subtle canvas shake
    shakeIntensity = 2.4;
  }

  /* ── Shared Web Audio Synthesizer ── */
  let sharedAudioCtx = null;
  function getAudioContext() {
    try {
      if (!sharedAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }
      return sharedAudioCtx;
    } catch (e) {
      return null;
    }
  }

  // Prime Web Audio on any user interaction so it is instantly unlocked and ready
  ['click', 'pointerdown', 'mousedown', 'keydown', 'touchstart', 'mousemove', 'wheel'].forEach(evt => {
    window.addEventListener(evt, () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    }, { passive: true });
  });

  /* ── ASMR Crispy Munch & Crunch Audio Synthesizer ── */
  function playAsmrBite(actx, startTime, intensity = 1.0) {
    const t = startTime;
    const master = actx.createGain();
    master.gain.setValueAtTime(0.35, t);
    master.connect(actx.destination);

    // 1. ASMR Micro-Crackles: 6 staggered filtered noise bursts (crispy skin / chips crunch)
    const grainCount = 6;
    for (let g = 0; g < grainCount; g++) {
      const gOffset = t + g * 0.011 + (Math.random() * 0.007);
      const gLen = Math.floor(actx.sampleRate * 0.024);
      const gBuf = actx.createBuffer(1, gLen, actx.sampleRate);
      const gData = gBuf.getChannelData(0);
      for (let i = 0; i < gLen; i++) {
        gData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (gLen * 0.24));
      }
      const gSource = actx.createBufferSource();
      gSource.buffer = gBuf;

      const gFilter = actx.createBiquadFilter();
      gFilter.type = 'bandpass';
      gFilter.frequency.setValueAtTime(2600 + Math.random() * 2600, gOffset);
      gFilter.Q.setValueAtTime(4.2, gOffset);

      const gGain = actx.createGain();
      gGain.gain.setValueAtTime(0.32 * intensity, gOffset);
      gGain.gain.exponentialRampToValueAtTime(0.001, gOffset + 0.022);

      gSource.connect(gFilter);
      gFilter.connect(gGain);
      gGain.connect(master);
      gSource.start(gOffset);
      gSource.stop(gOffset + 0.025);
    }

    // 2. Soft Chewing Squelch
    const chewOsc = actx.createOscillator();
    const chewGain = actx.createGain();
    chewOsc.type = 'sine';
    chewOsc.frequency.setValueAtTime(380 * intensity, t);
    chewOsc.frequency.exponentialRampToValueAtTime(160 * intensity, t + 0.065);
    chewGain.gain.setValueAtTime(0.18 * intensity, t);
    chewGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    chewOsc.connect(chewGain);
    chewGain.connect(master);
    chewOsc.start(t);
    chewOsc.stop(t + 0.075);

    // 3. Crisp snap transient (High-pass bite click)
    const snapOsc = actx.createOscillator();
    const snapGain = actx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1400 * intensity, t);
    snapOsc.frequency.exponentialRampToValueAtTime(360 * intensity, t + 0.035);
    snapGain.gain.setValueAtTime(0.14 * intensity, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    snapOsc.connect(snapGain);
    snapGain.connect(master);
    snapOsc.start(t);
    snapOsc.stop(t + 0.045);
  }

  // Full ASMR Chewing Sequence: 3 rhythmic chomps (Crisp Bite -> Soft Munch -> Final Crunch)
  function playEatSound() {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      if (actx.state === 'suspended') actx.resume();
      const now = actx.currentTime;

      // Bite 1: Crispy big bite (t = 0s)
      playAsmrBite(actx, now, 1.15);

      // Bite 2: Soft juicy munch (t = 150ms)
      playAsmrBite(actx, now + 0.15, 0.85);

      // Bite 3: ASMR crispy final chew (t = 300ms)
      playAsmrBite(actx, now + 0.30, 1.0);
    } catch (e) {}
  }

  /* ── ASMR Melodic Pitter-Patter Footstep Synthesizer ── */
  let lastStepSoundTime = 0;
  let isLeftStep = false;

  function playFootstepSound(isSprint = false) {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      if (actx.state === 'suspended') {
        actx.resume().catch(() => {});
      }
      const now = actx.currentTime;

      // Rhythm throttle: walk ~110ms, sprint ~75ms
      const minInterval = isSprint ? 0.075 : 0.11;
      if (now - lastStepSoundTime < minInterval) return;
      lastStepSoundTime = now;
      isLeftStep = !isLeftStep;

      const t = now;
      const master = actx.createGain();
      // Audible, crisp, satisfying ASMR volume (walk 0.23, sprint 0.30)
      const vol = isSprint ? 0.30 : 0.23;
      master.gain.setValueAtTime(vol, t);
      master.connect(actx.destination);

      // Alternating melodious pentatonic frequencies: Left = 440Hz (A4), Right = 523Hz (C5)
      const baseFreq = isLeftStep ? 440 : 523.25;
      const pitchMul = isSprint ? 0.92 : 1.0;

      // 1. Tactile Wood / Marimba Pop (Soft resonant sine + triangle overtone)
      const osc = actx.createOscillator();
      const oscGain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((baseFreq + (Math.random() - 0.5) * 12) * pitchMul, t);
      osc.frequency.exponentialRampToValueAtTime((baseFreq * 0.38) * pitchMul, t + 0.055);
      oscGain.gain.setValueAtTime(0.38, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(oscGain);
      oscGain.connect(master);
      osc.start(t);
      osc.stop(t + 0.065);

      // 2. Delicate ASMR Ground Rustle / Patter (Soft high-frequency air tap)
      const bufLen = Math.floor(actx.sampleRate * 0.022);
      const noiseBuf = actx.createBuffer(1, bufLen, actx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.28));
      }
      const noiseSource = actx.createBufferSource();
      noiseSource.buffer = noiseBuf;

      const filter = actx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isLeftStep ? 3600 : 4300, t);
      filter.Q.setValueAtTime(4.2, t);

      const noiseGain = actx.createGain();
      noiseGain.gain.setValueAtTime(0.29, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSource.start(t);
      noiseSource.stop(t + 0.026);
    } catch (e) {}
  }

  /* ── Roar Sound: Softened, Crisp Predator Growl ── */
  function playRoarSound() {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      const master = actx.createGain();
      // Reduced volume: 0.32 (down from 1.0) for a polite, refined sound
      master.gain.setValueAtTime(0.32, actx.currentTime);
      master.connect(actx.destination);
      const t = actx.currentTime;

      // 1. Sub-bass body rumble (sawtooth, warm low)
      const sub = actx.createOscillator();
      const subG = actx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(45, t);
      sub.frequency.exponentialRampToValueAtTime(24, t + 0.7);
      subG.gain.setValueAtTime(0, t);
      subG.gain.linearRampToValueAtTime(0.06, t + 0.04);
      subG.gain.setValueAtTime(0.05, t + 0.4);
      subG.gain.linearRampToValueAtTime(0, t + 0.8);
      sub.connect(subG); subG.connect(master);
      sub.start(t); sub.stop(t + 0.85);

      // 2. Mid growl (square wave, controlled harmonic)
      const mid = actx.createOscillator();
      const midG = actx.createGain();
      mid.type = 'square';
      mid.frequency.setValueAtTime(110, t);
      mid.frequency.exponentialRampToValueAtTime(50, t + 0.5);
      midG.gain.setValueAtTime(0, t);
      midG.gain.linearRampToValueAtTime(0.04, t + 0.04);
      midG.gain.linearRampToValueAtTime(0.02, t + 0.3);
      midG.gain.linearRampToValueAtTime(0, t + 0.55);
      mid.connect(midG); midG.connect(master);
      mid.start(t); mid.stop(t + 0.6);

      // 3. High roar attack (triangle, soft transient snap)
      const hi = actx.createOscillator();
      const hiG = actx.createGain();
      hi.type = 'triangle';
      hi.frequency.setValueAtTime(280, t);
      hi.frequency.exponentialRampToValueAtTime(75, t + 0.2);
      hiG.gain.setValueAtTime(0, t);
      hiG.gain.linearRampToValueAtTime(0.05, t + 0.02);
      hiG.gain.linearRampToValueAtTime(0, t + 0.22);
      hi.connect(hiG); hiG.connect(master);
      hi.start(t); hi.stop(t + 0.25);

      // 4. Tremolo growl texture (LFO-modulated noise feel)
      const tremOsc = actx.createOscillator();
      const tremG   = actx.createGain();
      const lfo     = actx.createOscillator();
      const lfoG    = actx.createGain();
      tremOsc.type = 'sawtooth';
      tremOsc.frequency.setValueAtTime(75, t);
      tremOsc.frequency.exponentialRampToValueAtTime(35, t + 0.8);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(18, t);
      lfoG.gain.setValueAtTime(0.04, t);
      lfo.connect(lfoG); lfoG.connect(tremG.gain);
      tremG.gain.setValueAtTime(0.055, t);
      tremG.gain.linearRampToValueAtTime(0, t + 0.85);
      tremOsc.connect(tremG); tremG.connect(master);
      lfo.start(t); lfo.stop(t + 0.9);
      tremOsc.start(t); tremOsc.stop(t + 0.9);
    } catch (e) {}
  }

  /* ── Cute Audible Snore Synthesizer (Ngorok Kecil saat Tidur) ── */
  function playSnoreSound() {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const now = actx.currentTime;
      const t = now;

      const master = actx.createGain();
      // Audible volume (0.28) matching footsteps and eats so it plays clearly on laptop/phone speakers
      master.gain.setValueAtTime(0.28, t);
      master.connect(actx.destination);

      // 1. Inhale Snore: Warm triangle wave in audible vocal range (~185Hz rising to ~245Hz)
      const osc = actx.createOscillator();
      const oscGain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, t);
      osc.frequency.exponentialRampToValueAtTime(245, t + 0.32);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.72);

      // 2. Flutter / Purr LFO (audible 13Hz flutter vibration)
      const lfo = actx.createOscillator();
      const lfoGain = actx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(13, t);
      lfoGain.gain.setValueAtTime(0.08, t);
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      // 3. Soft breath noise for realistic gentle snore texture
      const bufLen = Math.floor(actx.sampleRate * 0.08);
      const noiseBuf = actx.createBuffer(1, bufLen, actx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.4));
      }
      const noiseSrc = actx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseFilter = actx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(450, t);
      noiseFilter.Q.setValueAtTime(3.0, t);
      const noiseGain = actx.createGain();
      noiseGain.gain.setValueAtTime(0.06, t);
      noiseGain.gain.linearRampToValueAtTime(0.001, t + 0.35);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSrc.start(t + 0.05);

      // Envelope: gentle rise, snore crest, soft exhale fadeout
      oscGain.gain.setValueAtTime(0.001, t);
      oscGain.gain.linearRampToValueAtTime(0.18, t + 0.28);
      oscGain.gain.linearRampToValueAtTime(0.001, t + 0.75);

      osc.connect(oscGain);
      oscGain.connect(master);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.78);
      lfo.stop(t + 0.78);
    } catch (e) {}
  }

  /* ── Cute Sleepy Yawn Synthesizer (Nguap saat Bangun) ── */
  function playYawnSound() {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const now = actx.currentTime;
      const t = now;

      const master = actx.createGain();
      master.gain.setValueAtTime(0.22, t);
      master.connect(actx.destination);

      // Gentle cute rising then sighing sine tone
      const osc = actx.createOscillator();
      const oscGain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.22);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.55);

      oscGain.gain.setValueAtTime(0.001, t);
      oscGain.gain.linearRampToValueAtTime(0.15, t + 0.18);
      oscGain.gain.linearRampToValueAtTime(0.001, t + 0.58);

      osc.connect(oscGain);
      oscGain.connect(master);

      osc.start(t);
      osc.stop(t + 0.60);
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

    /* ── C. Spatial math ── */
    const spriteCols = 26;
    const spriteRows = 18;
    const spriteW    = spriteCols * PX;
    const spriteH    = spriteRows * PX;

    const snoutRelX   = isFacingLeft ? 0 : (spriteCols - 1) * PX;
    const snoutRelY   = 4.5 * PX;
    const snoutWorldX = dinoX + snoutRelX;
    const snoutWorldY = dinoY + snoutRelY;

    const deltaX    = foodX - snoutWorldX;
    const deltaY    = foodY - snoutWorldY;
    const distToFood = Math.hypot(deltaX, deltaY);

    const dinoCenterX = dinoX + spriteW * 0.5;
    const dinoCenterY = dinoY + spriteH * 0.5;
    const distFromCenter = Math.hypot(foodX - dinoCenterX, foodY - dinoCenterY);
    const isCursorOnDino = (
      foodX >= dinoX - 8 &&
      foodX <= dinoX + spriteW + 8 &&
      foodY >= dinoY - 8 &&
      foodY <= dinoY + spriteH + 8
    );

    // Update smoothed velocity EMA each frame
    smoothVelX = smoothVelX * (1 - VEL_SMOOTH) + velX * VEL_SMOOTH;
    smoothVelY = smoothVelY * (1 - VEL_SMOOTH) + velY * VEL_SMOOTH;

    /* ── C2. FSM ── */
    switch (currentState) {
      case STATES.LAZY_FOLLOW:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
        } else if (timeSinceMouseMove >= IDLE_MS) {
          if (isCursorOnDino || distToFood <= 25) {
            // Cursor is resting right on dino's body: calm bite without frantic chasing
            currentState = STATES.EATING;
            stateTimer   = now;
            spawnBiteCrumbs(foodX, foodY);
            playEatSound();
          } else if (distToFood > 120 || idleChaseCount >= 1) {
            // Jarak cukup jauh (> 120px) ATAU bergantian: LANGSUNG Mode Hunter Sprint!
            currentState = STATES.WAITING;
            stateTimer   = now;
          } else {
            // Jarak sangat dekat: jalan santai biasa
            currentState = STATES.WALKING_TO_FOOD;
            stateTimer   = now;
          }
        }
        break;

      case STATES.WALKING_TO_FOOD:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
        } else if (distToFood <= 25 || distFromCenter <= 30 || isCursorOnDino) {
          currentState = STATES.EATING;
          stateTimer   = now;
          spawnBiteCrumbs(foodX, foodY);
          playEatSound();
          idleChaseCount++;
        }
        break;

      case STATES.WAITING:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
        } else if (now - stateTimer > 120) {
          currentState = STATES.ANTICIPATING;
          stateTimer   = now;
        }
        break;

      case STATES.ANTICIPATING:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
        } else if (now - stateTimer >= ANTICIPATE_MS) {
          currentState = STATES.CHASING;
        }
        break;

      case STATES.CHASING:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
        } else if (distToFood <= 25 || distFromCenter <= 30 || isCursorOnDino) {
          currentState = STATES.EATING;
          stateTimer   = now;
          spawnBiteCrumbs(foodX, foodY);
          playEatSound();
          idleChaseCount = 0; // Reset cycle: next 3 will be normal walking again!
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
          consecutiveEats++;
          if (consecutiveEats >= 10) {
            // Eaten 10 times consecutively -> stuffed full, fall asleep!
            currentState = STATES.SLEEPING;
            stateTimer   = now;
            foodVisible  = true;
            foodScale    = 1.0;
          } else {
            currentState = STATES.SATISFIED;
            stateTimer   = now;
            foodVisible  = false;
          }
        }
        break;
      }

      case STATES.SATISFIED:
        if (timeSinceMouseMove >= IDLE_SLEEP_MS) {
          currentState = STATES.SLEEPING;
          stateTimer   = now;
          foodVisible  = true;
          foodScale    = 1.0;
        } else if (now - stateTimer >= SATISFIED_PAUSE) {
          currentState = STATES.LAZY_FOLLOW;
          foodVisible  = true;
          foodScale    = 1.0;
        }
        break;

      case STATES.SLEEPING:
        // Stuffed sleeping state: periodic floating 'Zzz' particles drifting from head + soft cute snore
        if (now - lastZzzTime > 1100) {
          lastZzzTime = now;
          const zX = isFacingLeft ? dinoX + 6 : dinoX + spriteW - 14;
          const zY = dinoY + 4;
          spawnZzz(zX, zY);
          playSnoreSound();
        }
        break;

      case STATES.WAKING: {
        const wakeElapsed = now - stateTimer;
        if (wakeElapsed >= 680) {
          currentState = STATES.LAZY_FOLLOW;
        }
        break;
      }

      case STATES.ROARING:
        if (now - stateTimer >= ROAR_DURATION) {
          currentState = STATES.LAZY_FOLLOW;
        }
        break;
    }

    /* ── D. Physics ── */
    const centerDeltaX = foodX - dinoCenterX;
    const centerDeltaY = foodY - dinoCenterY;

    if (currentState === STATES.CHASING) {
      if (distFromCenter < 25) {
        // Approaching target: smooth deceleration, zero overshoot
        velX *= 0.7;
        velY *= 0.7;
      } else {
        velX += centerDeltaX * DINO_CHASE_ACCEL;
        velY += centerDeltaY * DINO_CHASE_ACCEL;
        const spd = Math.hypot(velX, velY);
        if (spd > MAX_CHASE_SPEED) {
          velX = (velX / spd) * MAX_CHASE_SPEED;
          velY = (velY / spd) * MAX_CHASE_SPEED;
        }
      }
    } else if (currentState === STATES.WALKING_TO_FOOD) {
      // Jalan biasa: melangkah santai menuju drumstick
      velX += centerDeltaX * DINO_LAZY_ACCEL * 1.5;
      velY += centerDeltaY * DINO_LAZY_ACCEL * 1.5;
      const spd = Math.hypot(velX, velY);
      if (spd > MAX_LAZY_SPEED * 1.25) {
        velX = (velX / spd) * (MAX_LAZY_SPEED * 1.25);
        velY = (velY / spd) * (MAX_LAZY_SPEED * 1.25);
      }
    } else if (currentState === STATES.LAZY_FOLLOW) {
      // If cursor is resting on or near dino, come to an absolute complete stop
      if (distFromCenter < 40 || isCursorOnDino) {
        velX *= 0.45;
        velY *= 0.45;
        if (Math.hypot(velX, velY) < 0.05) {
          velX = 0;
          velY = 0;
        }
      } else {
        velX += centerDeltaX * DINO_LAZY_ACCEL;
        velY += centerDeltaY * DINO_LAZY_ACCEL;
        const spd = Math.hypot(velX, velY);
        if (spd > MAX_LAZY_SPEED) {
          velX = (velX / spd) * MAX_LAZY_SPEED;
          velY = (velY / spd) * MAX_LAZY_SPEED;
        }
      }
    } else if (currentState === STATES.ANTICIPATING) {
      velX *= 0.5;
      velY *= 0.5;
    } else if (currentState === STATES.ROARING) {
      velX *= 0.3;
      velY *= 0.3;
    } else {
      velX *= 0.6;
      velY *= 0.6;
      if (Math.hypot(velX, velY) < 0.05) {
        velX = 0;
        velY = 0;
      }
    }

    velX *= DAMPING;
    dinoX += velX;
    dinoY += velY;

    dinoX = Math.max(0, Math.min(W - spriteW, dinoX));
    dinoY = Math.max(0, Math.min(H - spriteH, dinoY));

    const currentSpeed = Math.hypot(velX, velY);

    // Direction update: Stable hysteresis deadzone based on cursor relative to dino center (±30px).
    // If cursor is on or near dino's body, lock facing completely to eliminate any rapid flip jitter (linglung).
    if (currentState === STATES.SLEEPING || currentState === STATES.WAKING || currentState === STATES.EATING || currentState === STATES.ROARING) {
      // Keep facing locked during static / bite / sleep / waking stretch animations
    } else if (distFromCenter < 35 || Math.abs(centerDeltaX) < 30 || isCursorOnDino) {
      // Cursor is on or right next to dino's body -> LOCK FACING, DO NOT FLIP!
    } else if (centerDeltaX < -30) {
      isFacingLeft = true;
    } else if (centerDeltaX > 30) {
      isFacingLeft = false;
    }

    /* ── E. Footprint Trail (appears when walking/running across screen) ── */
    if (currentSpeed > 0.4 && (currentState === STATES.LAZY_FOLLOW || currentState === STATES.WALKING_TO_FOOD || currentState === STATES.CHASING)) {
      const footX = dinoX + (isFacingLeft ? spriteW * 0.72 : spriteW * 0.28);
      const footY = dinoY + spriteH - PX;
      spawnFootprint(footX, footY, fg);
    }

    // Render fading minimalist 3-claw footprint marks
    for (let i = footprints.length - 1; i >= 0; i--) {
      const fp = footprints[i];
      fp.life -= fp.decay;
      if (fp.life <= 0) { footprints.splice(i, 1); continue; }
      ctx.fillStyle = fp.color;
      ctx.globalAlpha = fp.life * 0.22;
      const fx = Math.round(fp.x);
      const fy = Math.round(fp.y);
      ctx.fillRect(fx - PX, fy - PX, PX, PX);               // Left claw
      ctx.fillRect(fx, fy - Math.round(PX * 1.5), PX, PX); // Middle claw
      ctx.fillRect(fx + PX, fy - PX, PX, PX);               // Right claw
      ctx.fillRect(fx - PX * 0.5, fy, PX * 2, PX);          // Heel pad
    }

    /* ── E2. Sprint Dust & Sprint Sound ── */
    if (currentState === STATES.CHASING && currentSpeed > 1.8) {
      if (walkTick % 3 === 0) {
        const trailingFootX = dinoX + (isFacingLeft ? spriteW * 0.78 : spriteW * 0.22);
        const trailingFootY = dinoY + spriteH - PX;
        const moveDir = velX !== 0 ? Math.sign(velX) : (isFacingLeft ? -1 : 1);
        spawnDust(trailingFootX, trailingFootY, moveDir);
      }
      playFootstepSound(true);
    }

    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const p = dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.93; // Air resistance slows smoke down
      p.vy *= 0.95;
      p.life -= p.decay;
      if (p.life <= 0) { dustParticles.splice(i, 1); continue; }

      const progress = 1 - p.life;
      const r = p.baseR + (p.maxR - p.baseR) * progress;

      ctx.fillStyle = fg;
      // Main soft smoke cloud puff
      ctx.globalAlpha = p.life * 0.22;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Whispy secondary puff for organic smoke texture
      if (p.life > 0.28) {
        ctx.globalAlpha = p.life * 0.12;
        ctx.beginPath();
        ctx.arc(p.x + p.satOffsetX, p.y + p.satOffsetY, p.satR * (1 + progress * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
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

    /* ── E4. Roar Shockwave Rings ── */
    for (let i = roarRings.length - 1; i >= 0; i--) {
      const rr = roarRings[i];
      if (now < rr.born) continue; // Staggered delay
      const elapsed = now - rr.born;
      const expand  = Math.min(1, elapsed / 500);
      // Ease-out expansion
      const easedExpand = 1 - Math.pow(1 - expand, 2.5);
      rr.r = rr.r + (rr.maxR - rr.r) * 0.045;
      rr.life -= rr.decay;
      if (rr.life <= 0) { roarRings.splice(i, 1); continue; }
      // Outer ring (full circle)
      ctx.beginPath();
      ctx.arc(rr.x, rr.y, rr.r, 0, Math.PI * 2);
      ctx.strokeStyle = fg;
      ctx.globalAlpha = rr.life * 0.60;
      ctx.lineWidth = Math.max(0.4, rr.lw * rr.life);
      ctx.stroke();
      // Inner glow double-ring for the first 3 rings (most intense)
      if (rr.lw > 1.0) {
        ctx.beginPath();
        ctx.arc(rr.x, rr.y, rr.r * 0.88, 0, Math.PI * 2);
        ctx.globalAlpha = rr.life * 0.20;
        ctx.lineWidth = rr.lw * 0.5 * rr.life;
        ctx.stroke();
      }
    }

    /* ── E5. Roar Debris (cardinal bursts + scatter) ── */
    for (let i = roarDebris.length - 1; i >= 0; i--) {
      const p = roarDebris[i];
      p.x  += p.vx; p.y  += p.vy;
      p.vx *= 0.93;  // Drag
      p.vy += 0.15;  // Gravity
      p.life -= p.decay;
      if (p.life <= 0) { roarDebris.splice(i, 1); continue; }
      ctx.fillStyle = fg;
      ctx.globalAlpha = p.life * 0.80;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }

    /* ── E6. Canvas Shake ── */
    if (shakeIntensity > 0.1) {
      const sx = (Math.random() - 0.5) * shakeIntensity;
      const sy = (Math.random() - 0.5) * shakeIntensity;
      ctx.save();
      ctx.translate(sx, sy);
      shakeIntensity *= 0.72; // Dampen rapidly
    }

    ctx.globalAlpha = 1.0;

    if (shakeIntensity > 0.1) {
      ctx.restore(); // Undo canvas shake transform
    }

    /* ── F. Animation Selection ── */
    walkTick++;
    const isSprinting = currentState === STATES.CHASING;
    const strideCadence = isSprinting ? 3 : 8;

    if (currentSpeed > 0.4 && walkTick % strideCadence === 0) {
      walkFrame = (walkFrame + 1) % 4;
      if (currentState === STATES.LAZY_FOLLOW || currentState === STATES.WALKING_TO_FOOD) {
        playFootstepSound(false);
      }
    } else if (currentSpeed <= 0.4 && currentState !== STATES.CHASING && currentState !== STATES.WALKING_TO_FOOD) {
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

    // Curled cat pose when sleeping, morning cat stretch & yawn when waking up, normal standing/walking otherwise
    let fullDinoMatrix;
    if (currentState === STATES.SLEEPING) {
      fullDinoMatrix = DINO_CAT_SLEEP;
      verticalBob = 0;
    } else if (currentState === STATES.WAKING) {
      const wakeElapsed = now - stateTimer;
      if (wakeElapsed < 420) {
        fullDinoMatrix = DINO_STRETCH_YAWN;
        verticalBob = 0;
      } else {
        fullDinoMatrix = [...HEAD_NORMAL, ...LEGS_STAND];
        verticalBob = 0;
      }
    } else {
      fullDinoMatrix = [...activeHead, ...activeLegs];
    }

    /* ── E7. Sleeping Zzz Particles ── */
    for (let i = zzzParticles.length - 1; i >= 0; i--) {
      const z = zzzParticles[i];
      z.x += z.vx;
      z.y += z.vy;
      z.life -= z.decay;
      if (z.life <= 0) { zzzParticles.splice(i, 1); continue; }
      ctx.font = `700 ${Math.round(z.size)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = fg;
      ctx.globalAlpha = Math.max(0, Math.min(1, z.life * 0.70));
      ctx.fillText(z.char, Math.round(z.x), Math.round(z.y));
    }

    // Always restore full opacity before drawing the dinosaur — eliminates any blinking/flickering!
    ctx.globalAlpha = 1.0;

    /* ── G. Draw Dino ──
       During ROARING: scale the sprite up slightly (Godzilla chest-puff)
       using a sine envelope so it swells and returns naturally.
    ── */
    if (currentState === STATES.ROARING) {
      const roarProgress = Math.min(1, (now - roarStartTime) / ROAR_DURATION);
      // Sine envelope: 0 → peak at 40% → 0 again. Max +20% scale.
      const swell = 1.0 + Math.sin(roarProgress * Math.PI) * 0.20;
      const cx = Math.round(dinoX + spriteW * 0.5);
      const cy = Math.round(dinoY + spriteH);      // Anchor at feet
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(swell, swell);
      ctx.translate(-cx, -cy);
      drawMatrix(
        fullDinoMatrix,
        Math.round(dinoX),
        Math.round(dinoY + verticalBob * PX),
        fg, bg, isFacingLeft, 1.0
      );
      ctx.restore();
    } else {
      drawMatrix(
        fullDinoMatrix,
        Math.round(dinoX),
        Math.round(dinoY + verticalBob * PX),
        fg, bg, isFacingLeft, 1.0
      );
    }

    // Restore full opacity before drawing the meat cursor
    ctx.globalAlpha = 1.0;

    /* ── H. Draw Meat Cursor (Transforms on Hover & Click) ── */
    if (foodVisible && mouseInside) {
      let activeMeatSprite = SPRITE_MEAT_NORMAL;
      let targetScale = foodScale;

      if (isPointerDown) {
        activeMeatSprite = SPRITE_MEAT_CLICK;
        targetScale *= 0.90;
      } else if (isHoveringClickable) {
        activeMeatSprite = SPRITE_MEAT_HOVER;
        targetScale *= 1.15;
      }

      const drawMeatX = Math.round(foodX - 1 * PX * targetScale);
      const drawMeatY = Math.round(foodY - 1 * PX * targetScale);

      drawMatrix(
        activeMeatSprite,
        drawMeatX,
        drawMeatY,
        fg,
        bg,
        false,
        targetScale
      );
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
