import { Show } from '../types';

// --- Static Mock Data for Demo ---
const MOCK_SHOWS: Omit<Show, 'id' | 'cumulativeRating' | 'lastPoints' | 'status'>[] = [
  // Reality / Competition
  { title: "Survivor 47", network: "CBS", category: 'cable', nextEpisodeDate: "Wed 8pm", description: "Castaways compete for $1 million in Fiji.", projectedRating: 95, hype: 95 },
  { title: "The Voice", network: "NBC", category: 'cable', nextEpisodeDate: "Mon 8pm", description: "Blind auditions for America's next great singer.", projectedRating: 88, hype: 88 },
  { title: "The Masked Singer", network: "FOX", category: 'cable', nextEpisodeDate: "Wed 8pm", description: "Celebrities sing while hidden in elaborate costumes.", projectedRating: 82, hype: 82 },
  { title: "Hell's Kitchen", network: "FOX", category: 'cable', nextEpisodeDate: "Thu 8pm", description: "Chefs compete under Gordon Ramsay's intense supervision.", projectedRating: 78, hype: 78 },
  { title: "The Amazing Race", network: "CBS", category: 'cable', nextEpisodeDate: "Wed 9:30pm", description: "Teams race around the world.", projectedRating: 75, hype: 75 },
  { title: "Shark Tank", network: "ABC", category: 'cable', nextEpisodeDate: "Fri 8pm", description: "Entrepreneurs pitch to investors.", projectedRating: 72, hype: 72 },
  { title: "Dancing with the Stars", network: "ABC", category: 'cable', nextEpisodeDate: "Tue 8pm", description: "Celebrities pair with pro dancers.", projectedRating: 85, hype: 85 },
  { title: "The Bachelor", network: "ABC", category: 'cable', nextEpisodeDate: "Mon 8pm", description: "One man searches for love among eligible women.", projectedRating: 84, hype: 84 },

  // Dramas - Procedural
  { title: "9-1-1", network: "ABC", category: 'cable', nextEpisodeDate: "Thu 8pm", description: "First responders rush to emergencies in LA.", projectedRating: 92, hype: 92 },
  { title: "Chicago Fire", network: "NBC", category: 'cable', nextEpisodeDate: "Wed 9pm", description: "Firehouse 51 battles fires and personal drama.", projectedRating: 89, hype: 89 },
  { title: "Chicago P.D.", network: "NBC", category: 'cable', nextEpisodeDate: "Wed 10pm", description: "District 21's Intelligence Unit fights crime.", projectedRating: 87, hype: 87 },
  { title: "Chicago Med", network: "NBC", category: 'cable', nextEpisodeDate: "Wed 8pm", description: "Doctors save lives at Gaffney Chicago Medical Center.", projectedRating: 86, hype: 86 },
  { title: "Law & Order: SVU", network: "NBC", category: 'cable', nextEpisodeDate: "Thu 9pm", description: "Detectives investigate sexually based offenses.", projectedRating: 90, hype: 90 },
  { title: "NCIS", network: "CBS", category: 'cable', nextEpisodeDate: "Mon 9pm", description: "Naval Criminal Investigative Service solves crimes.", projectedRating: 91, hype: 91 },
  { title: "FBI", network: "CBS", category: 'cable', nextEpisodeDate: "Tue 8pm", description: "New York field office of the FBI.", projectedRating: 88, hype: 88 },
  { title: "Blue Bloods", network: "CBS", category: 'cable', nextEpisodeDate: "Fri 10pm", description: "A family of NYC law enforcement officers.", projectedRating: 83, hype: 83 },

  // Dramas - Character/Thriller
  { title: "Grey's Anatomy", network: "ABC", category: 'cable', nextEpisodeDate: "Thu 9pm", description: "Surgical interns and residents evolve into doctors.", projectedRating: 88, hype: 88 },
  { title: "Tracker", network: "CBS", category: 'cable', nextEpisodeDate: "Sun 9pm", description: "Colter Shaw seeks rewards for finding missing persons.", projectedRating: 93, hype: 93 },
  { title: "The Equalizer", network: "CBS", category: 'cable', nextEpisodeDate: "Sun 8pm", description: "Robyn McCall helps those with nowhere else to turn.", projectedRating: 81, hype: 81 },
  { title: "Fire Country", network: "CBS", category: 'cable', nextEpisodeDate: "Fri 9pm", description: "Convicts join firefighters to battle wildfires.", projectedRating: 84, hype: 84 },
  { title: "Elsbeth", network: "CBS", category: 'cable', nextEpisodeDate: "Thu 10pm", description: "An unconventional attorney observes NYC crimes.", projectedRating: 79, hype: 79 },
  { title: "Matlock", network: "CBS", category: 'cable', nextEpisodeDate: "Sun 8pm", description: "Reboot of the classic legal drama.", projectedRating: 80, hype: 80 },
  { title: "High Potential", network: "ABC", category: 'cable', nextEpisodeDate: "Tue 10pm", description: "A single mom with a high IQ solves crimes.", projectedRating: 86, hype: 86 },
  { title: "Doctor Odyssey", network: "ABC", category: 'cable', nextEpisodeDate: "Thu 9pm", description: "Medical drama set on a luxury cruise ship.", projectedRating: 77, hype: 77 },

  // Comedies
  { title: "Abbott Elementary", network: "ABC", category: 'cable', nextEpisodeDate: "Wed 9pm", description: "Teachers navigate the Philadelphia public school system.", projectedRating: 94, hype: 94 },
  { title: "Ghosts", network: "CBS", category: 'cable', nextEpisodeDate: "Thu 8:30pm", description: "A couple inherits a house full of spirits.", projectedRating: 89, hype: 89 },
  { title: "The Neighborhood", network: "CBS", category: 'cable', nextEpisodeDate: "Mon 8pm", description: "A nice guy moves into a tough neighborhood.", projectedRating: 76, hype: 76 },
  { title: "Night Court", network: "NBC", category: 'cable', nextEpisodeDate: "Tue 8pm", description: "Judge Abby Stone presides over night court.", projectedRating: 74, hype: 74 },
  { title: "Animal Control", network: "FOX", category: 'cable', nextEpisodeDate: "Wed 9pm", description: "Workplace comedy about animal control workers.", projectedRating: 70, hype: 70 },
  { title: "Bob's Burgers", network: "FOX", category: 'cable', nextEpisodeDate: "Sun 9pm", description: "The Belcher family runs a burger joint.", projectedRating: 73, hype: 73 },
  { title: "The Simpsons", network: "FOX", category: 'cable', nextEpisodeDate: "Sun 8pm", description: "The satiric adventures of a working-class family.", projectedRating: 75, hype: 75 },
  { title: "Family Guy", network: "FOX", category: 'cable', nextEpisodeDate: "Sun 9:30pm", description: "The Griffin family's chaotic life.", projectedRating: 74, hype: 74 },
];

// --- Step 1: The Schedule (Demo) ---
export const fetchUpcomingShows = async (): Promise<Show[]> => {
  // Simulate network delay for effect
  await new Promise(resolve => setTimeout(resolve, 800));

  return MOCK_SHOWS.map((s, index) => ({
    ...s,
    id: `show-${index}`,
    cumulativeRating: 0,
    lastPoints: 0,
    status: 'available'
  }));
};

// --- Step 2: The Scores (Demo) ---
export const updateShowRatings = async (shows: Show[]): Promise<{ showId: string, newPoints: number }[]> => {
  // Simulate network delay for effect
  await new Promise(resolve => setTimeout(resolve, 1200));

  const updates: { showId: string, newPoints: number }[] = [];

  shows.forEach(show => {
    // Demo Logic:
    // Generate a random rating update between 0.3 and 1.2
    // Boost it slightly based on "projectedRating"
    const base = 0.3;
    const volatility = Math.random() * 0.9;
    const strengthBonus = (show.projectedRating - 70) / 100; // e.g. 90 rating adds 0.2

    // Calculate final points for this "week"
    let points = base + volatility + strengthBonus;

    // Occasional "Breakout Hit" or "Bomb"
    if (Math.random() > 0.9) points += 1.5; // Big hit
    if (Math.random() < 0.05) points = 0.1; // Flop

    points = Number(points.toFixed(1));

    updates.push({
      showId: show.id,
      newPoints: points
    });
  });

  return updates;
};