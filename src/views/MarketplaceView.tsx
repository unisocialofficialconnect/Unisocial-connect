import React, { useState, useEffect } from "react";
import { Store, Tag, ShoppingBag, Star, Heart, Search, Filter, ArrowRight, Share2, Shield, User, MapPin, Zap, X, Plus, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function MarketplaceView() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [products, setProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', category: 'Eletrônicos', description: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
       setProducts(data);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
       await supabase.from('products').insert([{
          seller_id: user.id,
          title: newProduct.title,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          description: newProduct.description,
          image_url: newProduct.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
          location: "Online"
       }]);
       setShowAddProduct(false);
       setNewProduct({ title: '', price: '', category: 'Eletrônicos', description: '', imageUrl: '' });
       fetchProducts();
    } catch(err: any) {
       alert("Erro ao adicionar: " + err.message);
    } finally {
       setSubmitting(false);
    }
  };

  const filteredItems = products.filter(item => {
    const matchesCategory = activeCategory === "Todos" || item.category === activeCategory;
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

           <div className="flex items-center gap-3">
              <div className="relative group">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-uni-purple transition-colors" />
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full md:w-64 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-uni-purple transition-all placeholder:text-slate-600 font-medium text-white"
                 />
              </div>
              <button onClick={() => setShowAddProduct(true)} className="p-3.5 bg-uni-purple hover:bg-uni-purple/80 text-white rounded-2xl transition-colors">
                 <Plus size={20} />
              </button>
           </div>
        </div>

        <div className="relative h-48 md:h-64 rounded-[2rem] overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" alt="Banner" className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-uni-darker to-transparent flex flex-col justify-center px-10">
                <span className="text-uni-blue font-black uppercase tracking-[0.3em] text-[10px] mb-2">Exclusivo Üni</span>
                <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4">Üni Tech Week</h2>
                <p className="text-slate-300 max-w-sm mb-6 text-sm font-medium">As melhores tecnologias selecionadas por nossa IA com preços especiais.</p>
                <button className="bg-uni-blue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all w-fit shadow-xl shadow-uni-blue/20">Ver Agora</button>
            </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar no-scrollbar">
           {["Todos", "Eletrônicos", "Informática", "Móveis", "Serviços", "Veículos"].map((cat, i) => (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {filteredItems.map((item) => (
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
                         <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                      
                      <button 
                        onClick={(e) => toggleFavorite(e, item.id)}
                        className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-3xl rounded-full text-white hover:bg-white/20 transition-all z-10 border border-white/20 shadow-xl"
                      >
                          <Heart size={18} className={favorites.has(item.id) ? "fill-uni-purple text-uni-purple" : ""} />
                      </button>
                  </div>

                  <div className="p-8 pt-0">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center justify-between">
                         <p className="text-2xl font-black text-uni-blue tabular-nums">R$ {item.price}</p>
                         <button className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-uni-purple transition-colors text-white">
                            <ArrowRight size={18} />
                         </button>
                      </div>
                  </div>
               </motion.div>
           ))}
        </div>
      </div>

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
               <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors z-30"><X size={24} /></button>
               <div className="md:w-1/2 p-4 h-full"><img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-full h-64 md:h-full object-cover rounded-[2rem]" /></div>
               <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between">
                  <div className="space-y-6">
                      <div>
                        <span className="bg-uni-purple/20 text-uni-purple px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedProduct.category}</span>
                        <h2 className="text-4xl font-display font-black text-white mt-4">{selectedProduct.title}</h2>
                        <p className="text-slate-400 mt-4 leading-relaxed">{selectedProduct.description}</p>
                      </div>
                  </div>
                  <div className="mt-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between px-2">
                         <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total</span>
                         <span className="text-4xl font-black text-white tabular-nums">R$ {selectedProduct.price}</span>
                      </div>
                      <div className="flex gap-3">
                         <button className="flex-1 bg-gradient-to-r from-uni-purple to-uni-blue py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-white">
                            <Zap size={16} className="fill-white" /> Comprar Agora
                         </button>
                      </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showAddProduct && (
         <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-uni-dark w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
               <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Vender Produto</h2>
                  <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
               </div>
               <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-1">Título</label>
                     <input type="text" required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Preço (R$)</label>
                        <input type="number" required min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Categoria</label>
                        <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white">
                           <option value="Eletrônicos">Eletrônicos</option>
                           <option value="Informática">Informática</option>
                           <option value="Móveis">Móveis</option>
                           <option value="Serviços">Serviços</option>
                           <option value="Veículos">Veículos</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-1">URL Imagem</label>
                     <input type="url" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white" />
                  </div>
                  <button disabled={submitting} type="submit" className="w-full bg-uni-purple py-3 rounded-xl font-bold text-white mt-4 hover:bg-uni-purple/80">
                     {submitting ? "Processando..." : "Publicar"}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
