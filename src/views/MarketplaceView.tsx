import React, { useState } from "react";
import { Store, Tag, ShoppingBag, Star, Heart, Search, Filter, ArrowRight, Share2, Shield, User, MapPin, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";

export default function MarketplaceView() {
  const [activeCategory, setActiveCategory] = useState("Explorar");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const categories = ["Explorar", "Eletrônicos", "Moda", "Veículos", "Imóveis", "Serviços"];

  const items = [
    { 
      id: 1, 
      title: "Setup Gamer Premium v2", 
      price: "R$ 4.500", 
      category: "Eletrônicos", 
      image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Rick Tech", rating: 4.9, verified: true },
      location: "São Paulo, SP",
      description: "Setup completo com RTX 4080, 32GB RAM, i9 13th Gen. Perfeito estado."
    },
    { 
      id: 2, 
      title: "Câmera Mirrorless Profesional", 
      price: "R$ 3.200", 
      category: "Eletrônicos", 
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Ana Fotografia", rating: 4.8, verified: false },
      location: "Rio de Janeiro, RJ",
      description: "Câmera compacta com 2 lentes extras inclusas."
    },
    { 
      id: 3, 
      title: "Tênis Edição Especial Üni", 
      price: "R$ 890", 
      category: "Moda", 
      image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Üni Store", rating: 5.0, verified: true },
      location: "Curitiba, PR",
      description: "Edição limitada em colab com a Üni Social."
    },
    { 
      id: 4, 
      title: "Fones Studio Pro Noise Cancel", 
      price: "R$ 1.100", 
      category: "Eletrônicos", 
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Audio Gear", rating: 4.7, verified: true },
      location: "Belo Horizonte, MG",
      description: "Cancelamento de ruído ativo e 40h de bateria."
    },
    { 
      id: 5, 
      title: "Jaqueta de Couro Vintage", 
      price: "R$ 450", 
      category: "Moda", 
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Boutique Retro", rating: 4.5, verified: false },
      location: "Porto Alegre, RS",
      description: "Couro legítimo, pouquíssimo uso."
    },
    { 
      id: 6, 
      title: "Patinete Elétrico UniGlide", 
      price: "R$ 2.400", 
      category: "Veículos", 
      image: "https://images.unsplash.com/photo-1563200057-3f3240212ff9?auto=format&fit=crop&q=80&w=600",
      seller: { name: "Smart Mobility", rating: 4.6, verified: true },
      location: "Florianópolis, SC",
      description: "Autonomia de 30km, velocidade máx 25km/h."
    },
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === "Explorar" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      return newFavs;
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col pt-6 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-uni-purple to-uni-blue rounded-3xl flex items-center justify-center shadow-lg shadow-uni-purple/20">
                  <ShoppingBag size={28} className="text-white" />
              </div>
              <div>
                  <h1 className="text-4xl font-display font-black tracking-tight text-white">Marketplace</h1>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Premium Trading Hub</p>
              </div>
           </div>

           <div className="flex flex-1 max-w-xl items-center gap-3">
              <div className="relative flex-1 group">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-uni-purple transition-colors" />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="O que você está procurando hoje?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-uni-purple transition-all placeholder:text-slate-600 font-medium"
                 />
              </div>
              <button className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors">
                 <Filter size={20} className="text-slate-400" />
              </button>
           </div>
        </div>

        {/* Banner Area */}
        <div className="relative h-48 md:h-64 rounded-[2rem] overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-uni-darker to-transparent flex flex-col justify-center px-10">
                <span className="text-uni-blue font-black uppercase tracking-[0.3em] text-[10px] mb-2">Exclusivo Üni</span>
                <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4">Üni Tech Week</h2>
                <p className="text-slate-300 max-w-sm mb-6 text-sm font-medium">As melhores tecnologias selecionadas por nossa IA com preços especiais.</p>
                <button className="bg-uni-blue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all w-fit shadow-xl shadow-uni-blue/20">Ver Agora</button>
            </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
           {categories.map((cat, i) => (
               <button 
                  key={i} 
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-8 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all border", 
                    activeCategory === cat 
                      ? 'bg-white text-uni-dark border-transparent shadow-xl' 
                      : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
                  )}
               >
                   {cat}
               </button>
           ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {filteredItems.map((item, idx) => (
               <motion.div 
                 key={item.id}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 onClick={() => setSelectedProduct(item)}
                 className="group relative flex flex-col bg-white/5 border border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/10 transition-all hover:shadow-2xl hover:shadow-black/50 cursor-pointer"
               >
                  <div className="relative aspect-[4/5] overflow-hidden p-4">
                      <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                         <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      
                      <button 
                        onClick={(e) => toggleFavorite(e, item.id)}
                        className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-3xl rounded-full text-white hover:bg-white/20 transition-all z-10 border border-white/20 shadow-xl"
                      >
                          <Heart size={18} className={favorites.has(item.id) ? "fill-uni-purple text-uni-purple" : ""} />
                      </button>

                      <div className="absolute bottom-8 left-8 bg-uni-dark/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                         <Star size={12} className="text-yellow-500 fill-yellow-500" />
                         <span className="text-[10px] font-black text-white">{item.seller.rating}</span>
                      </div>
                  </div>

                  <div className="p-8 pt-0">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                            <User size={12} className="text-slate-400" />
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.seller.name}</span>
                         {item.seller.verified && <Shield size={12} className="text-uni-blue" />}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                         <p className="text-2xl font-black text-uni-blue tabular-nums">{item.price}</p>
                         <button className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-uni-purple transition-colors text-white">
                            <ArrowRight size={18} />
                         </button>
                      </div>
                  </div>
               </motion.div>
           ))}
        </div>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-uni-darker/90 backdrop-blur-2xl" onClick={() => setSelectedProduct(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-4xl bg-uni-dark/50 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
               <button 
                 onClick={() => setSelectedProduct(null)}
                 className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors z-30"
               >
                 <X size={24} />
               </button>

               <div className="md:w-1/2 p-4 h-full">
                  <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-64 md:h-full object-cover rounded-[2rem]" />
               </div>

               <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
                  <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                           <span className="bg-uni-purple/20 text-uni-purple px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedProduct.category}</span>
                           <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                               <MapPin size={12} />
                               {selectedProduct.location}
                           </div>
                        </div>
                        <h2 className="text-4xl font-display font-black text-white mb-4">{selectedProduct.title}</h2>
                        <p className="text-slate-400 leading-relaxed font-medium">{selectedProduct.description}</p>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10"></div>
                               <div>
                                  <p className="font-bold text-white flex items-center gap-1.5">
                                     {selectedProduct.seller.name}
                                     {selectedProduct.seller.verified && <Shield size={14} className="text-uni-blue" />}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                                     <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                     {selectedProduct.seller.rating} Reputation
                                  </div>
                               </div>
                            </div>
                            <button className="text-[10px] font-black text-uni-blue uppercase tracking-widest hover:underline">Ver Perfil</button>
                         </div>
                      </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total</span>
                         <span className="text-4xl font-black text-white tabular-nums">{selectedProduct.price}</span>
                      </div>
                      <div className="flex gap-3">
                         <button className="flex-1 bg-gradient-to-r from-uni-purple to-uni-blue py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-uni-purple/20 flex items-center justify-center gap-2 text-white">
                            <Zap size={16} className="fill-white" />
                            Comprar Agora
                         </button>
                         <button className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 transition-colors">
                            <Share2 size={24} className="text-white" />
                         </button>
                      </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
