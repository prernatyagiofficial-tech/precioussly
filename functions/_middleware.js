export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    // 1. Identify common social media and link preview bots
    const isBot = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Pinterest/i.test(userAgent);
    const productSlug = url.searchParams.get('product');

    // 2. If it's a human OR not a product link, serve the normal index.html SPA
    if (!isBot || !productSlug) {
        return next();
    }

    // 3. It's a bot! Fetch the product details directly from your Supabase REST API
    const SUPABASE_URL = 'https://gahkjnfiltfcqqdjnxnx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaGtqbmZpbHRmY3FxZGpueG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ2MTMsImV4cCI6MjA5MTMyMDYxM30.r1jhJlkk0KR7V6qFFotATUhyQfcxYc7ZadpbfOXDFCM';

    // Since the URL uses a slug (e.g., golden-bow-necklace), we replace hyphens with wildcards (%) 
    // to match the actual product name in your database (e.g., Golden Bow Necklace)
    const searchQuery = productSlug.replace(/-/g, '%');

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=*&name=ilike.*${searchQuery}*&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const data = await response.json();

        if (data && data.length > 0) {
            const product = data[0];
            
            // Extract the first image from the media array
            let mediaUrl = "https://i.postimg.cc/d3YGXnwC/file-0000000036707208a9cc7d7524fe0927-(1).webp"; // Fallback image
            try {
                const mediaArr = typeof product.media === 'string' ? JSON.parse(product.media) : product.media;
                if (mediaArr && mediaArr.length > 0) mediaUrl = mediaArr[0];
            } catch(e) {}

            // Clean up the description to remove HTML tags for the preview text
            const rawDesc = product.description || product.desc || "Shop curated collections tailored for elegance.";
            const cleanDesc = rawDesc.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";

            // 4. Return a hardcoded meta-tag response exclusively for the bot
            return new Response(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${product.name} | Precioussly</title>
                    <meta property="og:type" content="website">
                    <meta property="og:title" content="${product.name} | Precioussly">
                    <meta property="og:description" content="${cleanDesc}">
                    <meta property="og:image" content="${mediaUrl}">
                    <meta property="og:url" content="${url.href}">
                    <meta name="twitter:card" content="summary_large_image">
                    <meta name="twitter:title" content="${product.name} | Precioussly">
                    <meta name="twitter:description" content="${cleanDesc}">
                    <meta name="twitter:image" content="${mediaUrl}">
                </head>
                <body>
                    <p>Redirecting to Precioussly store...</p>
                </body>
                </html>
            `, {
                headers: { 'content-type': 'text/html;charset=UTF-8' }
            });
        }
    } catch (err) {
        console.error("Bot intercept failed:", err);
    }

    // 5. Fallback: If the database fetch fails, let Cloudflare load the normal index.html
    return next();
}
