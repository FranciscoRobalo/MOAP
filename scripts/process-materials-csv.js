import fs from 'fs';
import path from 'path';

// Read the CSV file
const csvPath = path.join(process.cwd(), 'scripts/materiais_servicos.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const items = [];

// Skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Split by semicolon
  const parts = line.split(';');
  if (parts.length < 4) continue;
  
  const name = parts[0].trim();
  const unit = parts[1].trim();
  const quantity = parseFloat(parts[2]) || 0;
  const price = parseFloat(parts[3]) || 0;
  
  // Skip invalid entries
  if (!name || name === 'nan' || name.includes('nan nan') || name.includes('total')) continue;
  if (price <= 0 || price > 100000) continue; // Skip unrealistic prices
  if (!unit || unit === 'nan') continue;
  
  // Clean up the name - remove project-specific references and codes
  let cleanName = name
    .replace(/^\d+(\.\d+)*\s*/, '') // Remove numbering like "1.2.3"
    .replace(/^[ivxlcdm]+\.\s*/i, '') // Remove roman numerals
    .replace(/\s*nan\s*/g, ' ') // Remove nan
    .replace(/\([^)]*\d{4}[^)]*\)/g, '') // Remove year references
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Skip if name is too short or too long
  if (cleanName.length < 5 || cleanName.length > 200) continue;
  
  // Skip very specific project items
  if (cleanName.match(/^(ar|ve|vi|pcf|j|p)\.\d+/i)) continue;
  if (cleanName.match(/\d+\s*x\s*\d+\s*x\s*\d+/)) continue; // Skip specific dimensions
  
  items.push({
    name: cleanName,
    unit: unit.toLowerCase(),
    price: price,
  });
}

// Aggregate items by similar names to get price ranges
const aggregated = {};

for (const item of items) {
  // Create a normalized key for grouping
  const key = item.name.toLowerCase()
    .replace(/\d+(\.\d+)?\s*(mm|cm|m|kg|l|un|m2|m3|ml|vg|cj)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
  
  if (!aggregated[key]) {
    aggregated[key] = {
      name: item.name,
      unit: item.unit,
      prices: [],
    };
  }
  aggregated[key].prices.push(item.price);
}

// Calculate average prices and filter
const results = [];
for (const key in aggregated) {
  const item = aggregated[key];
  if (item.prices.length === 0) continue;
  
  const minPrice = Math.min(...item.prices);
  const maxPrice = Math.max(...item.prices);
  const avgPrice = item.prices.reduce((a, b) => a + b, 0) / item.prices.length;
  
  // Only include items with reasonable prices
  if (avgPrice < 0.1 || avgPrice > 50000) continue;
  
  results.push({
    name: item.name,
    unit: item.unit,
    price: Math.round(avgPrice * 100) / 100,
    priceMax: Math.round(maxPrice * 100) / 100,
    count: item.prices.length,
  });
}

// Sort by name
results.sort((a, b) => a.name.localeCompare(b.name));

// Output as JSON
console.log(JSON.stringify(results.slice(0, 200), null, 2));
console.log(`\nTotal unique items: ${results.length}`);
