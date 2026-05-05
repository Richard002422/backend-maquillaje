export type Look = {
  id: string
  name: string
  tagline: string
  gradient: string
}

export type Product = {
  id: string
  name: string
  category: string
  price: string
  swatch: string
  rating: number
}

export const LOOKS: Look[] = [
  {
    id: 'natural',
    name: 'Glow natural',
    tagline: 'Piel luminosa, labios suaves y cejas definidas.',
    gradient: 'linear-gradient(135deg, #f5e6dc 0%, #e8c4b8 45%, #c9a08a 100%)',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Sombras intensas y delineado gráfico para fotos.',
    gradient: 'linear-gradient(135deg, #2d1f2e 0%, #8b2942 50%, #d4a574 100%)',
  },
  {
    id: 'fiesta',
    name: 'Noche de fiesta',
    tagline: 'Brillos, smokey y labial statement.',
    gradient: 'linear-gradient(135deg, #1a1025 0%, #6b2d5c 40%, #f0c14d 100%)',
  },
  {
    id: 'minimal',
    name: 'Clean girl',
    tagline: 'Base ligera, rubor melocotón y máscara al ras.',
    gradient: 'linear-gradient(135deg, #faf6f2 0%, #f0d9ce 50%, #e8b4b8 100%)',
  },
]

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Serum brillo 24h',
    category: 'Skincare',
    price: '32,00 €',
    swatch: '#e8c4b8',
    rating: 4.8,
  },
  {
    id: 'p2',
    name: 'Base fluida HD',
    category: 'Rostro',
    price: '28,50 €',
    swatch: '#d4a574',
    rating: 4.7,
  },
  {
    id: 'p3',
    name: 'Paleta atardecer',
    category: 'Ojos',
    price: '42,00 €',
    swatch: '#8b2942',
    rating: 4.9,
  },
  {
    id: 'p4',
    name: 'Labial velvet',
    category: 'Labios',
    price: '22,00 €',
    swatch: '#9e2a44',
    rating: 4.6,
  },
  {
    id: 'p5',
    name: 'Iluminador polvo',
    category: 'Rostro',
    price: '35,00 €',
    swatch: '#f0c14d',
    rating: 4.8,
  },
  {
    id: 'p6',
    name: 'Delineador punta pincel',
    category: 'Ojos',
    price: '18,90 €',
    swatch: '#1a1025',
    rating: 4.5,
  },
]
