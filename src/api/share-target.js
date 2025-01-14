export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { text, title, url } = req.body;
            // Redirigir a la aplicación con los datos compartidos
            res.redirect(307, `/calendar?shared=true&text=${encodeURIComponent(text || '')}&title=${encodeURIComponent(title || '')}&url=${encodeURIComponent(url || '')}`);
        }
        catch (error) {
            res.redirect(307, '/calendar?error=share-failed');
        }
    }
    else {
        // Manejar GET requests (cuando se abre la app desde un share)
        res.redirect(307, '/calendar');
    }
}
