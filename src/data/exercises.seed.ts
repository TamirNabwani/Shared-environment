/**
 * EXERCISE LIBRARY SEED — edit freely.
 *
 * One line per exercise:
 *   ex(id, name, pattern, difficulty, measure, primary[], secondary[])
 *
 * - id:         stable key used by your logs. Don't rename an id once you've
 *               logged it; change the name instead.
 * - pattern:    the movement pattern / progression ladder the exercise sits in.
 * - difficulty: DIFFICULTY (CONVENTION), 1–10 = where the exercise sits in the
 *               usual progression ladder for that pattern
 *               (e.g. wall push-up 1, push-up 3, archer 6, one-arm 9).
 *               It is a ladder position, not a measure of effectiveness, and
 *               coaches don't all place exercises at exactly the same step.
 * - measure:    'reps' (counted reps, can add weight) or 'hold' (seconds).
 * - primary / secondary: muscles from src/data/muscles.ts, standard anatomy.
 *
 * Changes here take effect on reload. Custom exercises you add in the app are
 * stored in the database and appear alongside these.
 */
import type { MuscleId } from './muscles';

export type Measure = 'reps' | 'hold';

export interface Exercise {
  id: string;
  name: string;
  pattern: string;
  difficulty: number;
  measure: Measure;
  primary: MuscleId[];
  secondary: MuscleId[];
  custom?: boolean;
}

const ex = (
  id: string,
  name: string,
  pattern: string,
  difficulty: number,
  measure: Measure,
  primary: MuscleId[],
  secondary: MuscleId[] = [],
): Exercise => ({ id, name, pattern, difficulty, measure, primary, secondary });

const PUSH = 'Horizontal push';
const DIP = 'Dip';
const TRI = 'Triceps extension';
const VPUSH = 'Vertical push';
const HS = 'Handstand balance';
const PL = 'Planche';
const VPULL = 'Vertical pull';
const HPULL = 'Horizontal pull';
const FL = 'Front lever';
const BL = 'Back lever';
const SCAP = 'Scapular / shoulder health';
const GRIP = 'Grip / hang';
const CORE = 'Core (anti-extension / flexion)';
const LSIT = 'L-sit / compression';
const OBL = 'Core (rotation / lateral)';
const EXT = 'Back extension';
const SQUAT = 'Squat / single-leg';
const HINGE = 'Hip extension / hinge';
const CURL = 'Knee flexion';
const CALF = 'Calf raise / plyo';

export const EXERCISES: Exercise[] = [
  // --- Horizontal push --------------------------------------------------
  ex('wall_pushup', 'Wall push-up', PUSH, 1, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('incline_pushup', 'Incline push-up', PUSH, 2, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('knee_pushup', 'Knee push-up', PUSH, 2, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('pushups', 'Push-ups', PUSH, 3, 'reps', ['chest'], ['front_delts', 'triceps', 'abs']),
  ex('wide_pushup', 'Wide push-up', PUSH, 3, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('close_grip_pushup', 'Close-grip push-up', PUSH, 3, 'reps', ['triceps', 'chest'], ['front_delts']),
  ex('diamond_pushup', 'Diamond push-up', PUSH, 4, 'reps', ['triceps', 'chest'], ['front_delts']),
  ex('decline_pushup', 'Decline push-up', PUSH, 4, 'reps', ['chest', 'front_delts'], ['triceps']),
  ex('ring_pushup', 'Ring push-up', PUSH, 5, 'reps', ['chest'], ['front_delts', 'triceps', 'abs']),
  ex('archer_pushup', 'Archer push-up', PUSH, 6, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('pseudo_planche_pushup', 'Pseudo planche push-up', PUSH, 6, 'reps', ['chest', 'front_delts'], ['triceps', 'abs', 'biceps']),
  ex('fingertip_pushup', 'Fingertip push-up', PUSH, 6, 'reps', ['chest', 'forearms'], ['triceps', 'front_delts']),
  ex('typewriter_pushup', 'Typewriter push-up', PUSH, 7, 'reps', ['chest'], ['front_delts', 'triceps']),
  ex('one_arm_pushup', 'One-arm push-up', PUSH, 9, 'reps', ['chest'], ['triceps', 'front_delts', 'obliques', 'abs']),
  ex('planche_pushup', 'Planche push-up', PUSH, 10, 'reps', ['front_delts', 'chest'], ['triceps', 'abs', 'biceps']),

  // --- Dips -------------------------------------------------------------
  ex('bench_dip', 'Bench dip', DIP, 2, 'reps', ['triceps'], ['front_delts', 'chest']),
  ex('dips', 'Dips (parallel bars)', DIP, 4, 'reps', ['chest', 'triceps'], ['front_delts']),
  ex('straight_bar_dip', 'Straight bar dip', DIP, 5, 'reps', ['chest', 'triceps'], ['front_delts']),
  ex('ring_dip', 'Ring dip', DIP, 6, 'reps', ['chest', 'triceps'], ['front_delts', 'abs']),
  ex('korean_dip', 'Korean dip', DIP, 7, 'reps', ['triceps', 'front_delts'], ['chest']),
  ex('impossible_dip', 'Impossible dip', DIP, 9, 'reps', ['triceps'], ['chest', 'front_delts']),

  // --- Triceps extension ------------------------------------------------
  ex('bw_triceps_extension', 'Bodyweight triceps extension (bar/rings)', TRI, 5, 'reps', ['triceps'], ['abs']),
  ex('tiger_bend_pushup', 'Tiger bend push-up', TRI, 8, 'reps', ['triceps'], ['front_delts', 'chest']),

  // --- Vertical push ----------------------------------------------------
  ex('pike_pushup', 'Pike push-up', VPUSH, 3, 'reps', ['front_delts'], ['triceps', 'side_delts', 'upper_back']),
  ex('elevated_pike_pushup', 'Elevated pike push-up', VPUSH, 4, 'reps', ['front_delts'], ['triceps', 'side_delts', 'upper_back']),
  ex('hspu', 'Handstand push-ups (wall)', VPUSH, 6, 'reps', ['front_delts', 'triceps'], ['side_delts', 'upper_back']),
  ex('deficit_hspu', 'Deficit handstand push-up (wall)', VPUSH, 7, 'reps', ['front_delts', 'triceps'], ['side_delts', 'upper_back']),
  ex('freestanding_hspu', 'Freestanding handstand push-up', VPUSH, 9, 'reps', ['front_delts', 'triceps'], ['side_delts', 'upper_back', 'abs']),

  // --- Handstand balance ------------------------------------------------
  ex('crow_pose', 'Crow pose', HS, 2, 'hold', ['abs', 'front_delts'], ['triceps', 'forearms']),
  ex('wall_handstand', 'Chest-to-wall handstand', HS, 3, 'hold', ['front_delts'], ['side_delts', 'upper_back', 'triceps', 'abs', 'forearms']),
  ex('wall_walk', 'Wall walk', HS, 3, 'reps', ['front_delts'], ['side_delts', 'triceps', 'abs']),
  ex('handstand_shrug', 'Wall handstand shrug', HS, 4, 'reps', ['upper_back'], ['front_delts', 'side_delts']),
  ex('handstand_hold', 'Handstand hold (freestanding)', HS, 6, 'hold', ['front_delts'], ['side_delts', 'upper_back', 'triceps', 'abs', 'forearms']),
  ex('one_arm_handstand', 'One-arm handstand', HS, 10, 'hold', ['front_delts', 'side_delts'], ['upper_back', 'obliques', 'forearms', 'triceps']),

  // --- Planche ----------------------------------------------------------
  ex('frog_stand', 'Frog stand', PL, 2, 'hold', ['front_delts'], ['abs', 'triceps', 'forearms']),
  ex('planche_lean', 'Planche lean', PL, 2, 'hold', ['front_delts'], ['chest', 'abs', 'biceps', 'forearms']),
  ex('tuck_planche', 'Tuck planche', PL, 4, 'hold', ['front_delts'], ['chest', 'triceps', 'abs', 'biceps', 'forearms']),
  ex('adv_tuck_planche', 'Advanced tuck planche', PL, 6, 'hold', ['front_delts'], ['chest', 'triceps', 'abs', 'biceps', 'forearms']),
  ex('straddle_planche', 'Straddle planche', PL, 8, 'hold', ['front_delts'], ['chest', 'triceps', 'abs', 'biceps', 'lower_back', 'forearms']),
  ex('planche', 'Planche hold (full)', PL, 10, 'hold', ['front_delts'], ['chest', 'triceps', 'abs', 'biceps', 'lower_back', 'forearms']),

  // --- Vertical pull ----------------------------------------------------
  ex('negative_pullup', 'Negative pull-up', VPULL, 3, 'reps', ['lats'], ['biceps', 'upper_back', 'forearms']),
  ex('negative_chinup', 'Negative chin-up', VPULL, 3, 'reps', ['lats', 'biceps'], ['upper_back', 'forearms']),
  ex('flexed_arm_hang', 'Flexed-arm hang (chin over bar)', VPULL, 3, 'hold', ['biceps', 'lats'], ['forearms', 'upper_back']),
  ex('chinups', 'Chin-ups', VPULL, 4, 'reps', ['lats', 'biceps'], ['upper_back', 'forearms']),
  ex('close_grip_chinup', 'Close-grip chin-up', VPULL, 4, 'reps', ['biceps', 'lats'], ['forearms']),
  ex('pullups', 'Pull-ups', VPULL, 5, 'reps', ['lats'], ['biceps', 'upper_back', 'rear_delts', 'forearms']),
  ex('wide_pullup', 'Wide-grip pull-up', VPULL, 5, 'reps', ['lats'], ['upper_back', 'rear_delts', 'biceps']),
  ex('commando_pullup', 'Commando pull-up', VPULL, 5, 'reps', ['lats', 'biceps'], ['obliques', 'forearms']),
  ex('l_sit_pullup', 'L-sit pull-up', VPULL, 6, 'reps', ['lats'], ['abs', 'biceps', 'upper_back']),
  ex('archer_pullup', 'Archer pull-up', VPULL, 7, 'reps', ['lats'], ['biceps', 'upper_back', 'rear_delts']),
  ex('typewriter_pullup', 'Typewriter pull-up', VPULL, 7, 'reps', ['lats'], ['biceps', 'upper_back', 'rear_delts']),
  ex('muscleups', 'Muscle-ups (bar)', VPULL, 7, 'reps', ['lats', 'chest', 'triceps'], ['biceps', 'front_delts', 'abs', 'forearms']),
  ex('archer_chinup', 'Archer chin-up', VPULL, 8, 'reps', ['lats', 'biceps'], ['upper_back', 'forearms']),
  ex('ring_muscleup', 'Ring muscle-up', VPULL, 8, 'reps', ['lats', 'chest', 'triceps'], ['biceps', 'front_delts', 'abs', 'forearms']),
  ex('one_arm_chinup', 'One-arm chin-up', VPULL, 10, 'reps', ['lats', 'biceps'], ['forearms', 'upper_back', 'obliques']),

  // --- Horizontal pull --------------------------------------------------
  ex('high_bar_row', 'Inverted row (high bar)', HPULL, 2, 'reps', ['upper_back', 'lats'], ['biceps', 'rear_delts']),
  ex('inverted_row', 'Inverted row (Australian pull-up)', HPULL, 3, 'reps', ['upper_back', 'lats'], ['biceps', 'rear_delts', 'forearms']),
  ex('underhand_row', 'Underhand inverted row', HPULL, 3, 'reps', ['lats', 'biceps'], ['upper_back', 'rear_delts']),
  ex('ring_face_pull', 'Ring face pull', HPULL, 3, 'reps', ['rear_delts'], ['upper_back']),
  ex('bw_biceps_curl', 'Bodyweight biceps curl (rings/bar)', HPULL, 4, 'reps', ['biceps'], ['forearms']),
  ex('feet_elevated_row', 'Feet-elevated inverted row', HPULL, 4, 'reps', ['upper_back', 'lats'], ['biceps', 'rear_delts']),
  ex('ring_reverse_fly', 'Ring reverse fly', HPULL, 5, 'reps', ['rear_delts'], ['upper_back']),
  ex('archer_row', 'Archer inverted row', HPULL, 6, 'reps', ['upper_back', 'lats'], ['biceps', 'rear_delts', 'obliques']),
  ex('tuck_fl_row', 'Tuck front lever row', HPULL, 7, 'reps', ['lats', 'upper_back'], ['abs', 'biceps', 'rear_delts']),
  ex('one_arm_row', 'One-arm inverted row', HPULL, 8, 'reps', ['upper_back', 'lats'], ['biceps', 'rear_delts', 'obliques']),

  // --- Front lever ------------------------------------------------------
  ex('tuck_front_lever', 'Tuck front lever', FL, 4, 'hold', ['lats'], ['abs', 'upper_back', 'rear_delts', 'forearms']),
  ex('adv_tuck_front_lever', 'Advanced tuck front lever', FL, 6, 'hold', ['lats'], ['abs', 'upper_back', 'rear_delts', 'forearms']),
  ex('one_leg_front_lever', 'One-leg front lever', FL, 7, 'hold', ['lats'], ['abs', 'upper_back', 'rear_delts', 'forearms']),
  ex('straddle_front_lever', 'Straddle front lever', FL, 8, 'hold', ['lats'], ['abs', 'upper_back', 'rear_delts', 'forearms']),
  ex('front_lever', 'Front lever hold (full)', FL, 10, 'hold', ['lats'], ['abs', 'upper_back', 'rear_delts', 'forearms']),

  // --- Back lever -------------------------------------------------------
  ex('tuck_back_lever', 'Tuck back lever', BL, 4, 'hold', ['lats', 'chest'], ['biceps', 'front_delts', 'abs']),
  ex('adv_tuck_back_lever', 'Advanced tuck back lever', BL, 5, 'hold', ['lats', 'chest'], ['biceps', 'front_delts', 'abs', 'lower_back']),
  ex('straddle_back_lever', 'Straddle back lever', BL, 7, 'hold', ['lats', 'chest'], ['biceps', 'front_delts', 'abs', 'lower_back', 'glutes']),
  ex('back_lever', 'Back lever (full)', BL, 8, 'hold', ['lats', 'chest'], ['biceps', 'front_delts', 'abs', 'lower_back', 'glutes']),

  // --- Scapular / shoulder health ---------------------------------------
  ex('band_pull_apart', 'Band pull-apart', SCAP, 1, 'reps', ['rear_delts'], ['upper_back']),
  ex('band_lateral_raise', 'Band lateral raise', SCAP, 1, 'reps', ['side_delts'], ['upper_back']),
  ex('scapular_pullup', 'Scapular pull-up', SCAP, 2, 'reps', ['upper_back'], ['lats']),
  ex('prone_ytw', 'Prone Y-T-W raise', SCAP, 2, 'reps', ['rear_delts', 'upper_back'], ['side_delts', 'lower_back']),

  // --- Grip / hang ------------------------------------------------------
  ex('dead_hang', 'Dead hang', GRIP, 1, 'hold', ['forearms'], ['lats', 'upper_back']),
  ex('active_hang', 'Active hang', GRIP, 2, 'hold', ['forearms', 'upper_back'], ['lats']),
  ex('fingertip_plank', 'Fingertip plank', GRIP, 3, 'hold', ['forearms'], ['abs', 'front_delts']),
  ex('towel_hang', 'Towel hang', GRIP, 4, 'hold', ['forearms'], ['lats', 'biceps']),
  ex('false_grip_hang', 'False-grip hang (rings)', GRIP, 5, 'hold', ['forearms'], ['biceps', 'lats']),
  ex('one_arm_hang', 'One-arm dead hang', GRIP, 7, 'hold', ['forearms'], ['lats', 'upper_back', 'obliques']),
  ex('one_arm_towel_hang', 'One-arm towel hang', GRIP, 9, 'hold', ['forearms'], ['lats', 'biceps']),

  // --- Core: anti-extension / flexion ----------------------------------
  ex('dead_bug', 'Dead bug', CORE, 1, 'reps', ['abs'], []),
  ex('plank', 'Plank hold', CORE, 2, 'hold', ['abs'], ['front_delts', 'obliques']),
  ex('hollow_body', 'Hollow body hold', CORE, 3, 'hold', ['abs'], ['quads']),
  ex('leg_raises', 'Leg raises (lying)', CORE, 3, 'reps', ['abs'], ['quads']),
  ex('hanging_knee_raise', 'Hanging knee raise', CORE, 4, 'reps', ['abs'], ['forearms', 'lats']),
  ex('ab_wheel_knees', 'Ab wheel rollout (knees)', CORE, 5, 'reps', ['abs'], ['lats', 'front_delts']),
  ex('hanging_leg_raise', 'Hanging leg raise', CORE, 6, 'reps', ['abs'], ['forearms', 'lats', 'quads']),
  ex('toes_to_bar', 'Toes-to-bar', CORE, 6, 'reps', ['abs'], ['lats', 'forearms']),
  ex('dragon_flag', 'Dragon flag', CORE, 8, 'reps', ['abs'], ['lats', 'lower_back', 'glutes']),
  ex('standing_ab_wheel', 'Ab wheel rollout (standing)', CORE, 9, 'reps', ['abs'], ['lats', 'front_delts', 'triceps']),

  // --- L-sit / compression ----------------------------------------------
  ex('foot_supported_lsit', 'Foot-supported L-sit', LSIT, 2, 'hold', ['abs'], ['triceps']),
  ex('tuck_lsit', 'Tuck L-sit', LSIT, 3, 'hold', ['abs'], ['triceps', 'quads']),
  ex('one_leg_lsit', 'One-leg L-sit', LSIT, 4, 'hold', ['abs'], ['triceps', 'quads']),
  ex('l_sit', 'L-sit hold', LSIT, 5, 'hold', ['abs'], ['triceps', 'quads', 'forearms']),
  ex('v_sit', 'V-sit', LSIT, 8, 'hold', ['abs'], ['triceps', 'quads', 'front_delts']),
  ex('manna', 'Manna', LSIT, 10, 'hold', ['abs', 'front_delts'], ['triceps', 'quads', 'rear_delts']),

  // --- Core: rotation / lateral ----------------------------------------
  ex('side_plank', 'Side plank', OBL, 2, 'hold', ['obliques'], ['abs', 'glutes']),
  ex('bicycle_crunch', 'Bicycle crunch', OBL, 2, 'reps', ['obliques', 'abs'], []),
  ex('russian_twist', 'Russian twist', OBL, 2, 'reps', ['obliques'], ['abs']),
  ex('side_plank_hip_dip', 'Side plank hip dip', OBL, 3, 'reps', ['obliques'], ['abs', 'glutes']),
  ex('lying_windshield_wiper', 'Lying windshield wiper', OBL, 4, 'reps', ['obliques'], ['abs']),
  ex('hanging_oblique_raise', 'Hanging oblique knee raise', OBL, 5, 'reps', ['obliques'], ['abs', 'forearms']),
  ex('tuck_human_flag', 'Tuck human flag', OBL, 7, 'hold', ['obliques', 'lats'], ['side_delts', 'front_delts', 'forearms']),
  ex('hanging_windshield_wiper', 'Hanging windshield wiper', OBL, 8, 'reps', ['obliques'], ['abs', 'lats', 'forearms']),
  ex('human_flag', 'Human flag', OBL, 10, 'hold', ['obliques', 'lats'], ['side_delts', 'front_delts', 'forearms']),

  // --- Back extension ---------------------------------------------------
  ex('bird_dog', 'Bird dog', EXT, 1, 'reps', ['lower_back'], ['glutes', 'abs']),
  ex('superman', 'Superman', EXT, 2, 'reps', ['lower_back'], ['glutes', 'upper_back']),
  ex('arch_hold', 'Arch body hold', EXT, 3, 'hold', ['lower_back'], ['glutes', 'upper_back']),
  ex('back_extension', 'Back extension (bench / GHD)', EXT, 3, 'reps', ['lower_back'], ['glutes', 'hamstrings']),
  ex('reverse_hyper', 'Reverse hyperextension (bench)', EXT, 3, 'reps', ['glutes', 'lower_back'], ['hamstrings']),
  ex('arch_rock', 'Arch body rock', EXT, 4, 'reps', ['lower_back'], ['glutes', 'upper_back']),
  ex('single_leg_back_extension', 'Single-leg back extension', EXT, 5, 'reps', ['lower_back', 'glutes'], ['hamstrings']),

  // --- Squat / single-leg ----------------------------------------------
  ex('assisted_squat', 'Assisted squat', SQUAT, 1, 'reps', ['quads'], ['glutes']),
  ex('squats', 'Squats (bodyweight)', SQUAT, 2, 'reps', ['quads', 'glutes'], ['hamstrings', 'calves']),
  ex('wall_sit', 'Wall sit', SQUAT, 2, 'hold', ['quads'], ['glutes']),
  ex('split_squat', 'Split squat', SQUAT, 3, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('reverse_lunge', 'Reverse lunge', SQUAT, 3, 'reps', ['quads', 'glutes'], ['hamstrings', 'calves']),
  ex('step_up', 'Step-up', SQUAT, 3, 'reps', ['quads', 'glutes'], ['hamstrings', 'calves']),
  ex('jump_squat', 'Jump squat', SQUAT, 3, 'reps', ['quads', 'glutes'], ['calves', 'hamstrings']),
  ex('bulgarian_split_squat', 'Bulgarian split squat', SQUAT, 4, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('cossack_squat', 'Cossack squat', SQUAT, 4, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('assisted_pistol', 'Assisted pistol squat', SQUAT, 5, 'reps', ['quads', 'glutes'], ['hamstrings', 'calves']),
  ex('shrimp_squat', 'Shrimp squat', SQUAT, 6, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('sissy_squat', 'Sissy squat', SQUAT, 6, 'reps', ['quads'], ['abs']),
  ex('skater_squat', 'Skater squat', SQUAT, 6, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('pistol_squat', 'Pistol squats', SQUAT, 7, 'reps', ['quads', 'glutes'], ['hamstrings', 'calves', 'abs']),
  ex('advanced_shrimp_squat', 'Advanced shrimp squat', SQUAT, 8, 'reps', ['quads', 'glutes'], ['hamstrings']),
  ex('dragon_pistol', 'Dragon pistol squat', SQUAT, 9, 'reps', ['quads', 'glutes'], ['hamstrings', 'abs']),

  // --- Hip extension / hinge -------------------------------------------
  ex('glute_bridge', 'Glute bridge', HINGE, 1, 'reps', ['glutes'], ['hamstrings', 'lower_back']),
  ex('bw_good_morning', 'Good morning (bodyweight)', HINGE, 1, 'reps', ['hamstrings', 'lower_back'], ['glutes']),
  ex('single_leg_glute_bridge', 'Single-leg glute bridge', HINGE, 2, 'reps', ['glutes'], ['hamstrings']),
  ex('hip_thrust', 'Hip thrust (shoulders elevated)', HINGE, 2, 'reps', ['glutes'], ['hamstrings', 'quads']),
  ex('hamstring_bridge', 'Hamstring bridge (heels elevated)', HINGE, 3, 'reps', ['hamstrings', 'glutes'], []),
  ex('single_leg_rdl', 'Single-leg Romanian deadlift (bodyweight)', HINGE, 3, 'reps', ['hamstrings', 'glutes'], ['lower_back']),
  ex('single_leg_hip_thrust', 'Single-leg hip thrust', HINGE, 4, 'reps', ['glutes'], ['hamstrings']),
  ex('single_leg_hamstring_bridge', 'Single-leg hamstring bridge', HINGE, 5, 'reps', ['hamstrings', 'glutes'], []),

  // --- Knee flexion -----------------------------------------------------
  ex('sliding_leg_curl', 'Sliding leg curl', CURL, 4, 'reps', ['hamstrings'], ['glutes']),
  ex('single_leg_sliding_curl', 'Single-leg sliding leg curl', CURL, 6, 'reps', ['hamstrings'], ['glutes']),
  ex('nordic_negative', 'Nordic curl (eccentric only)', CURL, 7, 'reps', ['hamstrings'], ['glutes', 'calves']),
  ex('nordic_curl', 'Nordic curl (full)', CURL, 9, 'reps', ['hamstrings'], ['glutes', 'calves']),

  // --- Calf raise / plyo ------------------------------------------------
  ex('calf_raise', 'Calf raise (double-leg)', CALF, 1, 'reps', ['calves'], []),
  ex('jump_rope', 'Jump rope', CALF, 2, 'reps', ['calves'], ['quads']),
  ex('deficit_calf_raise', 'Deficit calf raise (double-leg)', CALF, 2, 'reps', ['calves'], []),
  ex('bent_knee_calf_raise', 'Bent-knee calf raise', CALF, 2, 'reps', ['calves'], ['quads']),
  ex('pogo_hops', 'Pogo hops', CALF, 3, 'reps', ['calves'], ['quads']),
  ex('single_leg_calf_raise', 'Single-leg calf raise', CALF, 3, 'reps', ['calves'], []),
  ex('single_leg_deficit_calf_raise', 'Single-leg deficit calf raise', CALF, 4, 'reps', ['calves'], []),
  ex('single_leg_pogo', 'Single-leg pogo hops', CALF, 5, 'reps', ['calves'], ['quads', 'glutes']),
];

/** Exercises shown on the Personal Records page by default. */
export const DEFAULT_PR_EXERCISES = [
  'pushups',
  'pullups',
  'chinups',
  'dips',
  'squats',
  'pistol_squat',
  'handstand_hold',
  'hspu',
  'planche',
  'front_lever',
  'l_sit',
  'muscleups',
  'plank',
  'leg_raises',
];
