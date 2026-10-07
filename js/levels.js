// Level definitions: 7 trials + Heaven finale. Each has unique mechanics.
// Map coordinates: world 1600x1000. Walls = {x,y,w,h}. Everything else similar.
function border(W = 1600, H = 1000, t = 30) {
  return [
    { x: 0, y: 0, w: W, h: t }, { x: 0, y: H - t, w: W, h: t },
    { x: 0, y: 0, w: t, h: H }, { x: W - t, y: 0, w: t, h: H }
  ];
}
const A = (x, y, lines, name = 'Stranger') => ({ x, y, name, lines });

export const LEVELS = [
  {
    id: 0, name: 'I · Valley of Sloth', sin: 'Sloth', icon: '🌫️',
    verse: '"Whatever you do, work at it with all your heart." — Colossians 3:23',
    theme: 'Sloth · Neglect of calling',
    intro: 'You wake in grey ash. A voice calls you to rise: faith without action is dead (James 2:17). The altar-flames are going out — rekindle all 4 beacons, then reach the gate.',
    lesson: 'Diligence honours God. Small faithful steps overcome spiritual sleep.',
    goal: 'Relight 4 beacons (touch them), then enter the gate.',
    sky: ['#0a0d18', '#141a2e'], accent: '#8fa3c7',
    mechanic: 'sloth', drainIdle: 1.6,
    start: { x: 120, y: 500 },
    walls: [...border(), { x: 400, y: 0, w: 30, h: 600 }, { x: 800, y: 400, w: 30, h: 600 }, { x: 1200, y: 0, w: 30, h: 600 }],
    beacons: [{ x: 250, y: 200 }, { x: 600, y: 800 }, { x: 1000, y: 200 }, { x: 1400, y: 800 }],
    checkpoints: [{ x: 600, y: 500 }],
    npcs: [A(200, 560, ['Pilgrim… I slept too long in this valley.', 'Go — touch each cold beacon and it will burn again. Keep moving; the grey drains the idle.'], 'Sleeping Pilgrim')],
    enemies: [{ x: 950, y: 550, type: 'patrol', range: 120, speed: 60 }],
    hazards: [], pickups: [{ x: 500, y: 300, kind: 'bread' }, { x: 1100, y: 600, kind: 'bread' }],
    exit: { x: 1500, y: 120, w: 60, h: 90 }
  },
  {
    id: 1, name: 'II · Cavern of Greed', sin: 'Greed', icon: '🪙',
    verse: '"Keep your lives free from the love of money and be content." — Hebrews 13:5',
    theme: 'Greed · Love of money',
    intro: 'Gold glitters in the dark (see the parable of the rich fool, Luke 12:15-21). Gather 6 loaves of manna to live — but every gold coin you hoard feeds the greed that weighs you down and drains grace.',
    lesson: 'Contentment is gain. Hoarding harms the soul; generosity frees it.',
    goal: 'Collect 6 manna. Avoid gold (each coin: -grace & slower). Then reach the gate.',
    sky: ['#120d06', '#2b1d08'], accent: '#e8c46a',
    mechanic: 'greed', need: 6,
    start: { x: 100, y: 500 },
    walls: [...border(), { x: 350, y: 0, w: 500, h: 30 }, { x: 350, y: 500, w: 500, h: 30 }, { x: 1000, y: 200, w: 30, h: 600 }],
    pickups: [
      { x: 200, y: 200, kind: 'manna' }, { x: 500, y: 150, kind: 'manna' }, { x: 700, y: 300, kind: 'manna' },
      { x: 300, y: 700, kind: 'manna' }, { x: 600, y: 800, kind: 'manna' }, { x: 900, y: 700, kind: 'manna' },
      { x: 1200, y: 300, kind: 'manna' }, { x: 1300, y: 700, kind: 'manna' },
      { x: 450, y: 650, kind: 'gold' }, { x: 650, y: 180, kind: 'gold' }, { x: 1100, y: 500, kind: 'gold' }, { x: 1350, y: 450, kind: 'gold' }, { x: 250, y: 450, kind: 'gold' }
    ],
    enemies: [{ x: 1150, y: 600, type: 'chaser', speed: 70 }],
    npcs: [A(140, 560, ['I traded everything for gold, and it bought me this cave.', 'Take only the bread you need, pilgrim.'], 'Miser')],
    checkpoints: [{ x: 850, y: 400 }], beacons: [], hazards: [], exit: { x: 1500, y: 500, w: 60, h: 90 }
  },
  {
    id: 2, name: 'III · Garden of Envy', sin: 'Envy', icon: '🐍',
    verse: '"A heart at peace gives life to the body, but envy rots the bones." — Proverbs 14:30',
    theme: 'Envy · Coveting (cf. Cain & Abel, Genesis 4)',
    intro: 'Others’ gardens glow green while yours looks grey. Shadow-selves whisper: steal. Your task: harvest 5 of YOUR OWN blue lilies. Touching another’s golden harvest awakens jealous wraiths.',
    lesson: 'Rejoice with others (Romans 12:15). Gratitude kills envy.',
    goal: 'Gather 5 blue lilies (yours). Do NOT touch golden harvests. Then reach the gate.',
    sky: ['#08120d', '#12351f'], accent: '#7fe3a0',
    mechanic: 'envy', need: 5,
    start: { x: 100, y: 500 },
    walls: [...border(), { x: 500, y: 100, w: 30, h: 800 }, { x: 1000, y: 100, w: 30, h: 800 }],
    pickups: [
      { x: 250, y: 250, kind: 'lily' }, { x: 300, y: 600, kind: 'lily' }, { x: 200, y: 800, kind: 'lily' },
      { x: 700, y: 300, kind: 'lily' }, { x: 750, y: 700, kind: 'lily' }, { x: 1200, y: 500, kind: 'lily' }, { x: 1350, y: 250, kind: 'lily' },
      { x: 680, y: 500, kind: 'envyGold' }, { x: 1250, y: 750, kind: 'envyGold' }, { x: 250, y: 450, kind: 'envyGold' }
    ],
    enemies: [{ x: 700, y: 500, type: 'patrol', range: 150, speed: 80 }, { x: 1250, y: 400, type: 'patrol', range: 150, speed: 90 }],
    npcs: [A(140, 600, ['Their flowers are brighter… why not mine?', 'No — bless them, tend your own, and watch what God grows.'], 'Gardener')],
    checkpoints: [{ x: 550, y: 500 }], beacons: [], hazards: [], exit: { x: 1500, y: 500, w: 60, h: 90 }
  },
  {
    id: 3, name: 'IV · Fields of Wrath', sin: 'Wrath', icon: '🔥',
    verse: '"Everyone should be… slow to become angry, for human anger does not produce righteousness." — James 1:19-20',
    theme: 'Wrath · Mercy (cf. David sparing Saul, 1 Samuel 24)',
    intro: 'Ash-soldiers charge at you, born of anger. You carry no sword — only a word of peace. Strike them with rage and they multiply; instead, weaken them by dodging, then press E near them to SPARE and bless them.',
    lesson: 'Bless those who curse you (Luke 6:28). Mercy overcomes wrath.',
    goal: 'Spare 4 ash-soldiers (press E beside them). Then reach the gate.',
    sky: ['#160707', '#3a1212'], accent: '#ff9b6b',
    mechanic: 'wrath', need: 4,
    start: { x: 100, y: 500 },
    walls: [...border()],
    enemies: [
      { x: 500, y: 300, type: 'chaser', speed: 75, spareable: true }, { x: 800, y: 700, type: 'chaser', speed: 75, spareable: true },
      { x: 1100, y: 300, type: 'chaser', speed: 85, spareable: true }, { x: 1300, y: 700, type: 'chaser', speed: 85, spareable: true },
      { x: 950, y: 500, type: 'chaser', speed: 65, spareable: true }
    ],
    npcs: [A(150, 600, ['They mocked my family… my fists answer.', 'No. Kneel with me. We spare — and the fire goes out.'], 'Wounded Soldier')],
    pickups: [{ x: 400, y: 500, kind: 'bread' }, { x: 1000, y: 800, kind: 'bread' }],
    checkpoints: [{ x: 600, y: 500 }], beacons: [], hazards: [], exit: { x: 1500, y: 120, w: 60, h: 90 }
  },
  {
    id: 4, name: 'V · Maze of Lies', sin: 'Deception', icon: '🎭',
    verse: '"The LORD detests lying lips, but he delights in people who are trustworthy." — Proverbs 12:22',
    theme: 'Lying & deception (cf. Ananias & Sapphira, Acts 5)',
    intro: 'Many voices, many signs — most lie (Satan is "the father of lies", John 8:44). Only tablets glowing WHITE speak truth and mark the safe road. Read tablets (E), follow only white ones north, avoid red herrings.',
    lesson: 'Truth sets free (John 8:32). Test every voice against God’s word.',
    goal: 'Read the 3 TRUE (white) tablets, then reach the gate. Red tablets drain grace.',
    sky: ['#0d0a1a', '#241a4a'], accent: '#c9a7ff',
    mechanic: 'lies', need: 3,
    start: { x: 800, y: 900 },
    walls: [...border(),
      { x: 200, y: 700, w: 500, h: 30 }, { x: 900, y: 700, w: 500, h: 30 },
      { x: 200, y: 400, w: 500, h: 30 }, { x: 900, y: 400, w: 500, h: 30 },
      { x: 400, y: 200, w: 800, h: 30 }],
    tablets: [
      { x: 300, y: 600, true: true, text: 'TRUE: "The narrow gate leads to life. Go north through humility." (Matthew 7:13-14)' },
      { x: 1200, y: 600, true: false, text: 'FALSE: "All roads are the same. Truth is whatever you feel."' },
      { x: 300, y: 300, true: false, text: 'FALSE: "Take the wide easy road — no need for repentance."' },
      { x: 1200, y: 300, true: true, text: 'TRUE: "God cannot lie. Hold fast to what is good." (Titus 1:2)' },
      { x: 800, y: 130, true: true, text: 'TRUE: "Your word is a lamp to my feet." (Psalm 119:105) — the gate is near.' }
    ],
    enemies: [{ x: 800, y: 550, type: 'patrol', range: 200, speed: 90 }],
    npcs: [A(800, 830, ['Half the signs here flatter. Half save.', 'White light does not flicker. Trust it.'], 'Blind Prophet')],
    pickups: [{ x: 800, y: 500, kind: 'bread' }],
    checkpoints: [{ x: 800, y: 600 }], beacons: [], hazards: [], exit: { x: 770, y: 60, w: 70, h: 60 }
  },
  {
    id: 5, name: 'VI · Tower of Pride', sin: 'Pride', icon: '👑',
    verse: '"Pride goes before destruction, a haughty spirit before a fall." — Proverbs 16:18',
    theme: 'Pride · Humility (cf. Tower of Babel, Genesis 11)',
    intro: 'You climb the tower men built to make a name for themselves. Crowns roll down to knock the humble off. The way up is the LOW narrow stair — walk humbly (walk, don’t run) across the bridges, dodge crowns, reach the top gate.',
    lesson: 'God opposes the proud but gives grace to the humble (James 4:6).',
    goal: 'Climb past rolling crowns via 2 narrow bridges to the top gate. Running on bridges shakes you.',
    sky: ['#0e0e16', '#2c2c4a'], accent: '#ffd97f',
    mechanic: 'pride',
    start: { x: 150, y: 850 },
    walls: [...border(), { x: 0, y: 650, w: 1300, h: 30 }, { x: 300, y: 400, w: 1300, h: 30 }],
    bridges: [{ x: 1350, y: 650, w: 120, h: 40 }, { x: 150, y: 400, w: 120, h: 40 }],
    crowns: true,
    enemies: [],
    npcs: [A(200, 780, ['I built this tower to be seen.', 'The stairs down to kneeling are the stairs up to God.'], 'Fallen King')],
    pickups: [{ x: 800, y: 550, kind: 'bread' }],
    hazards: [{ x: 0, y: 300, w: 650, h: 20, kind: 'void' }, { x: 950, y: 300, w: 650, h: 20, kind: 'void' }],
    checkpoints: [{ x: 1450, y: 550 }, { x: 150, y: 300 }], beacons: [], exit: { x: 1400, y: 150, w: 70, h: 80 }
  },
  {
    id: 6, name: 'VII · Sea of Unforgiveness', sin: 'Unforgiveness', icon: '💧',
    verse: '"Forgive as the Lord forgave you." — Colossians 3:13',
    theme: 'Betrayal & unforgiveness (cf. Joseph forgiving his brothers, Genesis 50)',
    intro: 'The one who betrayed you waits across the bitter sea (chains of resentment bind the gate). Gather 3 shards of the broken bond, then face him — and CHOOSE to forgive (E) to open Heaven’s door.',
    lesson: 'Forgiven people forgive (Matthew 18:21-35). Forgiveness frees the forgiver.',
    goal: 'Collect 3 shards, then go to the Betrayer and press E to Forgive.',
    sky: ['#06121a', '#0f3a52'], accent: '#8fd8ff',
    mechanic: 'forgive', need: 3,
    start: { x: 100, y: 500 },
    walls: [...border(), { x: 600, y: 0, w: 30, h: 700 }, { x: 1100, y: 300, w: 30, h: 700 }],
    pickups: [{ x: 300, y: 200, kind: 'shard' }, { x: 850, y: 850, kind: 'shard' }, { x: 1350, y: 200, kind: 'shard' }, { x: 400, y: 700, kind: 'bread' }],
    betrayer: { x: 1350, y: 600 },
    enemies: [{ x: 850, y: 400, type: 'patrol', range: 180, speed: 85 }],
    npcs: [],
    checkpoints: [{ x: 650, y: 800 }], beacons: [], hazards: [], exit: { x: 1500, y: 850, w: 60, h: 90, locked: true }
  }
];

export const HEAVEN_TEXT = [
  'Every beacon relit. Every coin refused. Every insult forgiven.',
  'The grey falls away like a dream at dawn…',
  'You do not climb into Heaven — you are welcomed. Not by wages, but by grace through faith (Ephesians 2:8-9).',
  'Walk forward, pilgrim. Someone is waiting.'
];
