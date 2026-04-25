export async function onRequest(context) {
    const SUPABASE_URL = 'https://gahkjnfiltfcqqdjnxnx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaGtqbmZpbHRmY3FxZGpueG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ2MTMsImV4cCI6MjA5MTMyMDYxM30.r1jhJlkk0KR7V6qFFotATUhyQfcxYc7ZadpbfOXDFCM';

    let urls = ``;
    // 1. Sabse pehle Homepage ka link add karein
    urls += `
    <url>
        <loc>https://precioussly.com/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>\n`;

    try {
        // 2. Supabase se saare active products mangwayein
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=name&is_hidden=neq.true`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const products = await response.json();

        // 3. Har product ke naam ko link mein convert karke add karein
        if (products && Array.isArray(products)) {
            products.forEach(product => {
                if (product.name) {
                    const slug = product.name.toString().toLowerCase().trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\-]+/g, '')
                        .replace(/\-\-+/g, '-');
                    
                    urls += `
    <url>
        <loc>https://precioussly.com/?product=${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>\n`;
                }
            });
        }
    } catch (err) {
        console.error("Sitemap generation failed:", err);
    }

    // 4. Final XML format banakar return karein
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>`;

    return new Response(sitemap, {
        headers: { 'content-type': 'application/xml;charset=UTF-8' }
    });
}
