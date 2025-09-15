export const CATEGORIES = [
  {
    id: 'eletronicos',
    name: 'Eletrônicos',
    slug: 'eletronicos',
    subcategories: [
      { id: 'smartphones', name: 'Smartphones', slug: 'smartphones' },
      { id: 'notebooks', name: 'Notebooks', slug: 'notebooks' },
      { id: 'tablets', name: 'Tablets', slug: 'tablets' },
    ]
  },
  {
    id: 'moda',
    name: 'Moda',
    slug: 'moda',
    subcategories: [
      { id: 'masculina', name: 'Masculina', slug: 'masculina' },
      { id: 'feminina', name: 'Feminina', slug: 'feminina' },
      { id: 'infantil', name: 'Infantil', slug: 'infantil' },
    ]
  },
  {
    id: 'casa',
    name: 'Casa & Decoração',
    slug: 'casa',
    subcategories: [
      { id: 'moveis', name: 'Móveis', slug: 'moveis' },
      { id: 'decoracao', name: 'Decoração', slug: 'decoracao' },
      { id: 'utilidades', name: 'Utilidades', slug: 'utilidades' },
    ]
  }
];

export const HEADER_LINKS = [
  { label: 'Lojas', href: '/lojas' },
  { label: 'Favoritos', href: '/favoritos' },
  { label: 'Contato', href: '/contato' },
];

export const MOCK_BANNERS = [
  {
    id: '1',
    title: 'Oferta Especial - Smartphones',
    image: 'https://placehold.co/1200x400/0ea5e9/ffffff?text=Oferta+Especial',
    link: '/categoria/smartphones',
    description: 'Até 50% de desconto'
  },
  {
    id: '2',
    title: 'Novidades em Moda',
    image: 'https://placehold.co/1200x400/10b981/ffffff?text=Novidades+Moda',
    link: '/categoria/moda',
    description: 'Coleção Primavera/Verão'
  },
  {
    id: '3',
    title: 'Casa & Decoração',
    image: 'https://placehold.co/1200x400/f59e0b/ffffff?text=Casa+Decoracao',
    link: '/categoria/casa',
    description: 'Renove seu lar'
  }
];

// Banners estáticos para seções específicas
export const STATIC_BANNERS = {
  promotional: {
    id: 'promo-1',
    imageUrl: 'https://placehold.co/1570x261/e11d48/ffffff?text=Banner+Promocional',
    alt: 'Banner promocional com ofertas especiais',
    title: 'Ofertas Imperdíveis',
    link: '/ofertas',
    priority: true
  },
  seasonal: {
    id: 'season-1',
    imageUrl: 'https://placehold.co/1570x261/7c3aed/ffffff?text=Banner+Sazonal',
    alt: 'Banner sazonal com coleção atual',
    title: 'Nova Coleção',
    link: '/novidades'
  },
  brand: {
    id: 'brand-1',
    imageUrl: 'https://placehold.co/1570x261/059669/ffffff?text=Banner+Marca',
    alt: 'Banner da marca com produtos em destaque',
    title: 'Produtos em Destaque'
  }
};