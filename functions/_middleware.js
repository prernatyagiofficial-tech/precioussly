export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || '';

    // 1. Yahan humne Googlebot, Bingbot aur baaki search engines ko add kar diya hai
    const isBot = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Pinterest|Googlebot|bingbot|yandex|duckduckbot|slurp/i.test(userAgent);
    const productSlug = url.searchParams.get('product');

    // 2. Agar bot nahi hai ya product link nahi hai, toh normal website load hone do
    if (!isBot || !productSlug) {
        return next();
    }

    const SUPABASE_URL = 'https://gahkjnfiltfcqqdjnxnx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaGtqbmZpbHRmY3FxZGpueG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ2MTMsImV4cCI6MjA5MTMyMDYxM30.r1jhJlkk0KR7V6qFFotATUhyQfcxYc7ZadpbfOXDFCM';

    const exactSearchString = `*${productSlug.replace(/-/g, '%')}*`;
    const searchQuery = encodeURIComponent(exactSearchString);

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/products?select=*&name=ilike.${searchQuery}&limit=1`,
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
            
            let mediaUrl = "https://i.postimg.cc/d3YGXnwC/file-0000000036707208a9cc7d7524fe0927-(1).webp"; 
            try {
                const mediaArr = typeof product.media === 'string' ? JSON.parse(product.media) : product.media;
                if (mediaArr && mediaArr.length > 0) mediaUrl = mediaArr[0];
            } catch(e) {}

            const rawDesc = product.description || product.desc || "Shop curated collections tailored for elegance.";
            const cleanDesc = rawDesc.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + "...";

            // 3. Yahan humne <body> tag mein product ka naam, photo aur price daal diya hai
            // taaki Google usko padh sake aur apne search results mein dikha sake!
            return new Response(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${product.name} | Precioussly</title>
                    <meta name="description" content="${cleanDesc}">
                    <meta property="og:type" content="website">
                    <meta property="og:title" content="${product.name} | Precioussly">
                    <meta property="og:description" content="${cleanDesc}">
                    <meta property="og:image" content="${mediaUrl}">
                    <meta property="og:url" content="${url.href}">
                    <meta name="twitter:card" content="summary_large_image">
                </head>
                <body>
                    <header>
                        <h1>${product.name}</h1>
                    </header>
                    <main>
                        <img src="${mediaUrl}" alt="${product.name}">
                        <p>${cleanDesc}</p>
                        <p>Price: ₹${product.price}</p>
                    </main>
                    <footer>
                        <p><a href="/">Go to Precioussly Homepage</a></p>
                    </footer>
                </body>
                </html>
            `, {
                headers: { 'content-type': 'text/html;charset=UTF-8' }
            });
        }
    } catch (err) {
        console.error("Bot intercept failed:", err);
    }

    return next();
}
