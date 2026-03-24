const fs = require('fs');
const path = require('path');

// Ortam değişkenlerini yükle
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing! Lütfen .env.local dosyasına ekleyin.");
}

const ALLOWED_TAGS = [
  "dark", "mind-blowing", "easy-watch", "emotional", "fast-paced", 
  "slow-burn", "crime", "mystery", "romance", "comedy", "action", 
  "sci-fi", "thriller", "drama", "family", "anti-hero", "historical", 
  "fantasy", "supernatural", "suspense", "feel-good", "epic", "gritty"
];

const FALLBACK_DESC = "henüz türkçe özet bulunmuyor";
const BATCH_SIZE = 5;
const IS_TEST_MODE = true; // Sadece ilk 10 kaydı test etmek için

async function getTagsFromAI(title, genres, description) {
  const prompt = `
    You are an expert TV series and movie tagger.
    Analyze the following TV show and select EXACTLY 5 to 8 tags from the provided ALLOWED_TAGS list.
    Only return a valid JSON array of strings containing the tags.
    
    ALLOWED_TAGS: ${JSON.stringify(ALLOWED_TAGS)}
    
    Show Details:
    Title: ${title}
    Genres: ${genres.join(', ')}
    Description: ${description}
    
    Output Format: JSON Array of strings. Example: ["dark", "drama", "slow-burn"]
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // GPT-4o-mini for speed and cost-effectiveness
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean up potential markdown blocks
    if (content.startsWith("```json")) {
       content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    const parsedTags = JSON.parse(content);
    // Normalize and filter against ALLOWED_TAGS
    const validTags = parsedTags.filter(t => ALLOWED_TAGS.includes(t.toLowerCase().trim()));
    return validTags.length > 0 ? validTags : ["unknown"];

  } catch (error) {
    console.error(`❌ AI Hatası (${title}):`, error.message);
    return ["unknown"];
  }
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function startEnrichment() {
  const inputPath = path.resolve(__dirname, '../src/lib/seriesData.json');
  const outputPath = path.resolve(__dirname, '../src/lib/seriesEnriched.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`${inputPath} bulunamadı! Önce fetchTmdbDataset.js'yi çalıştırın.`);
  }

  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const allSeries = JSON.parse(rawData);
  
  // Test mode: 10 kayıt alalım
  const targetSeries = IS_TEST_MODE ? allSeries.slice(0, 10) : allSeries;
  console.log(`🚀 AI Tag Enrichment Başlıyor. (Test Modu: ${IS_TEST_MODE})`);
  console.log(`📋 İşlenecek kayıt sayısı: ${targetSeries.length} (Concurrency: ${BATCH_SIZE})`);

  const enrichedResults = [];
  const chunks = chunkArray(targetSeries, BATCH_SIZE);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\n⏳ Batch ${i + 1}/${chunks.length} işleniyor...`);
    
    const promises = chunk.map(async (series) => {
      let finalTags = [];
      const descLower = series.description.toLowerCase();

      // Fallback description kontrolü
      if (descLower.includes(FALLBACK_DESC) || series.description.length < 20) {
        console.log(`⚠️  ${series.title} -> Özet yok/kısa, API by-pass ('unknown')`);
        finalTags = ["unknown"];
      } else {
        // OpenAI Api call
        console.log(`🤖 ${series.title} -> AI analizi yapılıyor...`);
        finalTags = await getTagsFromAI(series.title, series.genres, series.description);
      }

      return {
        ...series,
        tags: finalTags
      };
    });

    const chunkResults = await Promise.all(promises);
    enrichedResults.push(...chunkResults);
    console.log(`✅ Batch ${i + 1} tamamlandı.`);
  }

  // Sonuçları kaydet
  fs.writeFileSync(outputPath, JSON.stringify(enrichedResults, null, 2), 'utf-8');
  console.log(`\n🎉 Enrichment tamamlandı! Sonuçlar kaydedildi: ${outputPath}`);
  
  if (IS_TEST_MODE) {
    console.log("\nÖrnek Çıktı:");
    console.log(JSON.stringify(enrichedResults[0], null, 2));
  }
}

startEnrichment();
