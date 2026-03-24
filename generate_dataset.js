const fs = require('fs');

const realShows = [
  "Breaking Bad", "Stranger Things", "The Office", "Dark", "True Detective",
  "Game of Thrones", "Succession", "The Sopranos", "Better Call Saul", "The Wire",
  "Fargo", "Black Mirror", "Fleabag", "Peaky Blinders", "Mad Men",
  "The Crown", "Chernobyl", "Mindhunter", "Narcos", "Severance",
  "The Mandalorian", "The Boys", "Severance", "Ted Lasso", "Barry",
  "BoJack Horseman", "Atlanta", "Veep", "The Leftovers", "Mr. Robot",
  "Six Feet Under", "The Shield", "Twin Peaks", "Band of Brothers", "Dexter",
  "Hannibal", "House of Cards", "The Americans", "Westworld", "Lost",
  "Parks and Recreation", "Seinfeld", "Friends", "Arrested Development", "Curb Your Enthusiasm",
  "It's Always Sunny in Philadelphia", "Silicon Valley", "Community", "Brooklyn Nine-Nine", "Schitt's Creek",
  "The Good Place", "New Girl", "How I Met Your Mother", "Modern Family", "Scrubs",
  "The Big Bang Theory", "30 Rock", "Malcolm in the Middle", "The IT Crowd", "Rick and Morty",
  "Fringe", "The X-Files", "Doctor Who", "Battlestar Galactica", "Firefly",
  "The Expanse", "Altered Carbon", "Foundation", "Orphan Black", "Sense8",
  "Dark Matter", "Travelers", "12 Monkeys", "The 100", "Continuum",
  "Money Heist", "Peacemaker", "Invincible", "Loki", "WandaVision"
];

// Random Words to generate hidden gems
const prefixes = ["The", "Project", "Operation", "Code", "Echo", "Crimson", "Silent", "Neon", "Midnight", "Lost", "Hidden", "Shattered", "Broken", "Fallen", "Rising", "Falling", "Last", "First", "Final", "Endless", "Infinite"];
const nouns = ["River", "Valley", "Mountain", "Sky", "Star", "Sun", "Moon", "Night", "Day", "Dawn", "Dusk", "City", "Town", "Street", "Road", "Way", "Path", "Journey", "Quest", "Mission", "Protocol", "Syndrome", "Effect", "Paradox", "Illusion", "Reality", "Dream", "Nightmare", "Vision", "Prophecy", "Secret", "Truth", "Lie", "Deception", "Betrayal", "Vengeance", "Justice", "Revenge", "Honor", "Glory", "Power", "Empire", "Kingdom", "Realm", "Domain", "World", "Universe", "Galaxy", "Dimension"];

const genres = ["drama", "comedy", "sci-fi", "thriller", "crime", "romance"];
const tags = ["dark", "mind-blowing", "easy-watch", "emotional", "fast-paced", "slow-burn", "crime", "mystery"];
const platforms = ["netflix", "amazon", "hbo", "disney"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateShowName(id) {
  if (id < realShows.length) return realShows[id];
  return `${getRandomItem(prefixes)} ${getRandomItem(nouns)}`;
}

const dataset = [];

for (let i = 0; i < 500; i++) {
  const id = i + 1;
  const title = generateShowName(i);
  
  // Distribute genres evenly (at least 1, maybe 2)
  const numGenres = Math.random() > 0.7 ? 2 : 1;
  const itemGenres = getRandomItems(genres, numGenres);
  
  // Add 2-3 meaningful tags
  const numTags = Math.floor(Math.random() * 2) + 2; 
  let itemTags = getRandomItems(tags, numTags);
  
  // Logic tie-ins: if comedy, higher chance of easy-watch
  if (itemGenres.includes("comedy") && Math.random() > 0.5) {
    if (!itemTags.includes("easy-watch")) itemTags.push("easy-watch");
  }
  // If thriller/sci-fi, higher chance of mind-blowing
  if ((itemGenres.includes("thriller") || itemGenres.includes("sci-fi")) && Math.random() > 0.5) {
    if (!itemTags.includes("mind-blowing")) itemTags.push("mind-blowing");
  }
  // If crime, guarantee crime tag
  if (itemGenres.includes("crime") && !itemTags.includes("crime")) {
    itemTags.push("crime");
  }

  // Ensure unique tags
  itemTags = [...new Set(itemTags)];

  const platform = getRandomItem(platforms);
  
  // Ratings and Popularity logic
  // Real shows generated first get higher ratings generally
  let rating, popularity;
  if (i < 50) {
    rating = (Math.random() * 1.5 + 8.5).toFixed(1); // 8.5 - 10.0
    popularity = Math.floor(Math.random() * 20 + 81); // 81 - 100
  } else {
    // Mix of hidden gems and mid-tier
    rating = (Math.random() * 4.0 + 6.0).toFixed(1); // 6.0 - 10.0
    popularity = Math.floor(Math.random() * 95 + 5); // 5 - 100
    
    // Sometimes hidden gems: high rating, low popularity
    if (Math.random() > 0.9) {
      rating = (Math.random() * 1.5 + 8.5).toFixed(1); 
      popularity = Math.floor(Math.random() * 30 + 1); 
    }
  }

  dataset.push({
    id: id.toString(),
    title,
    genres: itemGenres,
    tags: itemTags,
    platform,
    rating: parseFloat(rating),
    popularity
  });
}

fs.writeFileSync('seriesData.json', JSON.stringify(dataset, null, 2), 'utf-8');
console.log('Successfully generated seriesData.json with 500 items.');
