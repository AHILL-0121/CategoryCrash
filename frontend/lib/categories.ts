// 50 category pairs for MVP
export const categoryPairs: [string, string][] = [
  ["Things that are RED", "Things found in a KITCHEN"],
  ["Animals that can SWIM", "Things that are BIGGER than a car"],
  ["Things made of WOOD", "Things you find in a SCHOOL"],
  ["Countries in ASIA", "Countries with a FLAG that has RED in it"],
  ["Things that are COLD", "Things you find at a BEACH"],
  ["Jobs that require a UNIFORM", "Jobs that involve OUTDOOR work"],
  ["Sports played with a BALL", "Sports played in WATER"],
  ["Things that MAKE NOISE", "Things found in a BEDROOM"],
  ["Things that FLY", "Things that are YELLOW"],
  ["Foods that are SPICY", "Foods eaten for BREAKFAST"],
  ["Things made of METAL", "Things found in an OFFICE"],
  ["Things that are ROUND", "Things you can THROW"],
  ["Things found in a BATHROOM", "Things that use WATER"],
  ["Movie GENRES", "Movies with an ANIMAL in the title"],
  ["Things you WEAR", "Things made of LEATHER"],
  ["Musical INSTRUMENTS", "Things made of BRASS"],
  ["Things that are SOFT", "Things found in a BABY'S room"],
  ["Things that SMELL GOOD", "Things you find in a GARDEN"],
  ["Things that are TRANSPARENT", "Things made of GLASS"],
  ["Things that LIGHT UP", "Things powered by ELECTRICITY"],
  ["Things you READ", "Things made of PAPER"],
  ["Things you RIDE", "Things with WHEELS"],
  ["Things found UNDERGROUND", "Things that dig HOLES"],
  ["Things that are STICKY", "Things you find in a DESK drawer"],
  ["Things that MELT", "Things found in a FREEZER"],
  ["Things associated with WINTER", "Things that are WHITE"],
  ["Things found at a GYM", "Things made of RUBBER"],
  ["Things used for MEASURING", "Things found in a LAB"],
  ["Things with BUTTONS", "Things you find in a LIVING ROOM"],
  ["Things you DRINK", "Things served in a CUP"],
  ["Things that GROW", "Things found in a POT"],
  ["Things associated with HALLOWEEN", "Things that are ORANGE"],
  ["Things you find at a PARTY", "Things that POP"],
  ["Professional ATHLETES", "People who work in TEAMS"],
  ["Things that are SHARP", "Things found in a TOOLBOX"],
  ["Things from the 1980s", "Things that are NOSTALGIC"],
  ["Things that are EXPENSIVE", "Things made of GOLD"],
  ["Things found in NATURE", "Things that are GREEN"],
  ["Things that VIBRATE", "Things with a SCREEN"],
  ["Things associated with LOVE", "Things that are PINK"],
  ["Breakfast CEREALS", "Foods shaped like LETTERS or NUMBERS"],
  ["Things you pack for VACATION", "Things you wear at the BEACH"],
  ["Things found in a GARAGE", "Things that need FUEL"],
  ["Things associated with SPACE", "Things that are BLACK"],
  ["Types of SHOES", "Things with LACES"],
  ["Things you find in a WALLET", "Things made of PLASTIC"],
  ["Things that BOUNCE", "Toys kids play with"],
  ["Things that SPIN", "Carnival RIDES"],
  ["Famous BUILDINGS", "Things that are TALL"],
  ["Things you find in a MUSEUM", "Things that are ANCIENT"],
];

// Shuffle array utility
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get random category pairs for a game
export function getRandomCategories(count: number = 10): [string, string][] {
  const shuffled = shuffleArray(categoryPairs);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
