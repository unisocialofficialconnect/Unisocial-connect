import React, { useState, useEffect } from "react";
import { Store, Tag, ShoppingBag, Star, Heart, Search, Filter, ArrowRight, Share2, Shield, User, MapPin, Zap, X, Plus, MessageSquare, Image as ImageIcon, ThumbsUp, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function MarketplaceView() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [products, setProducts] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', category: 'Eletrônicos', condition: 'Usado — seminovo', description: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [messageText, setMessageText] = useState("Oi, esse item está disponível?");

  useEffect(() => {
    if (selectedProduct) {
       supabase.from('users').select('*').eq('id', selectedProduct.seller_id).single().then(({data}) => setSellerInfo(data));
       setMessageText("Oi, esse item está disponível?");
    } else {
       setSellerInfo(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (showAddProduct) {
       if (navigator.geolocation) {
           navigator.geolocation.getCurrentPosition((pos) => {
               setLocationCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
           }, () => {
               console.log("Localização negada");
           });
       }
    } else {
       setLocationCoords(null);
       setProductImages([]);
       setNewProduct({ title: '', price: '', category: 'Eletrônicos', condition: 'Usado — seminovo', description: '', imageUrl: '' });
    }
  }, [showAddProduct]);

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
       let uploadedUrls: string[] = [];
       for (const file of productImages) {
           const fileExt = file.name.split('.').pop();
           const fileName = `${Math.random()}.${fileExt}`;
           const filePath = `${user.id}/products/${fileName}`;
           const { error } = await supabase.storage.from('media').upload(filePath, file);
           if (!error) {
               const { data } = supabase.storage.from('media').getPublicUrl(filePath);
               uploadedUrls.push(data.publicUrl);
           }
       }
       const finalImageUrl = uploadedUrls.length > 0 ? uploadedUrls.join(',') : newProduct.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600";
       const locationString = locationCoords ? `${locationCoords.lat},${locationCoords.lng}` : "Online";

       await supabase.from('products').insert([{
          seller_id: user.id,
          title: newProduct.title,
          price: parseFloat(newProduct.price),
          category: `${newProduct.category}:::${newProduct.condition}`,
          description: newProduct.description,
          image_url: finalImageUrl,
          location: locationString
       }]);
       setShowAddProduct(false);
       fetchProducts();
    } catch(err: any) {
       alert("Erro ao adicionar: " + err.message);
    } finally {
       setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedProduct) return;
    try {
        await supabase.from('messages').insert([{
            sender_id: user.id,
            receiver_id: selectedProduct.seller_id,
            text: `${messageText}\n\n(Ref: ${selectedProduct.title})`,
            created_at: new Date().toISOString()
        }]);
        alert("Mensagem enviada com sucesso! Verifique seu Chat.");
        setMessageText("");
    } catch(e: any) {
        alert("Erro ao enviar: " + e.message);
    }
  };

  const filteredItems = products.filter(item => {
    const itemCat = item.category?.includes(':::') ? item.category.split(':::')[0] : item.category;
    const matchesCategory = activeCategory === "Todos" || itemCat === activeCategory;
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
                      <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-slate-800">
                         <img src={item.image_url?.split(',')[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
               <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 p-2.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors z-30"><X size={20} /></button>
               <div className="md:w-1/2 p-4 h-full custom-scrollbar overflow-y-auto">
                  <div className="flex flex-col gap-2">
                     {(selectedProduct.image_url?.split(',') || ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"]).map((url: string, i: number) => (
                         <img key={i} src={url} alt={selectedProduct.title} className="w-full h-72 md:h-auto object-cover rounded-[1.5rem] bg-slate-800" />
                     ))}
                  </div>
               </div>
               
               <div className="md:w-1/2 p-6 md:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar bg-uni-dark/50">
                   {/* Cabeçalho */}
                   <div>
                      <h2 className="text-3xl font-display font-black text-white leading-tight">{selectedProduct.title}</h2>
                      <p className="text-2xl font-black text-white mt-1 tabular-nums">R$ {selectedProduct.price}</p>
                   </div>

                   {/* Botões de Ação Rápidos */}
                   <div className="flex gap-4">
                      <button className="p-2 text-slate-400 hover:text-white transition-colors"><ThumbsUp size={22} /></button>
                      <button className="p-2 text-slate-400 hover:text-white transition-colors"><Bookmark size={22} /></button>
                      <button className="p-2 text-slate-400 hover:text-white transition-colors"><Share2 size={22} /></button>
                   </div>

                   {/* Enviar Mensagem */}
                   {user?.id !== selectedProduct.seller_id && (
                       <div className="border border-white/10 rounded-2xl p-4 bg-white/5 flex flex-col gap-3 shadow-sm">
                          <div className="flex items-center gap-2">
                             <MessageSquare size={16} className="text-uni-blue" />
                             <span className="text-sm font-bold text-white">Enviar mensagem ao vendedor</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                             <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-uni-blue outline-none" />
                             <button onClick={handleSendMessage} className="bg-uni-blue text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-uni-blue/80 transition-colors shrink-0">Enviar</button>
                          </div>
                       </div>
                   )}

                   {/* Descrição */}
                   <div>
                      <h3 className="text-xl font-bold text-white mb-2">Descrição</h3>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedProduct.description || "Nenhuma descrição fornecida."}</p>
                      
                      <div className="mt-4 flex gap-8">
                         <div>
                             <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">Condição</span>
                             <span className="text-sm text-white font-medium">{selectedProduct.category?.includes(':::') ? selectedProduct.category.split(':::')[1] : 'Usado — seminovo'}</span>
                         </div>
                         <div>
                             <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-1">Categoria</span>
                             <span className="text-sm text-white font-medium">{selectedProduct.category?.includes(':::') ? selectedProduct.category.split(':::')[0] : selectedProduct.category}</span>
                         </div>
                      </div>
                   </div>

                   {/* Vendedor */}
                   <div className="border-t border-white/5 pt-6">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="text-xl font-bold text-white">Vendedor</h3>
                         <ArrowRight size={16} className="text-slate-500" />
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                            {sellerInfo?.avatar_url ? (
                                <img src={sellerInfo.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-3 text-slate-500" />
                            )}
                         </div>
                         <div className="flex-1">
                             <p className="font-bold text-white text-lg">{sellerInfo?.name || "Carregando..."}</p>
                             <p className="text-xs text-slate-400">Vendedor ativo</p>
                         </div>
                         <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Seguir</button>
                      </div>
                   </div>

                   {/* Localização */}
                   {selectedProduct.location && selectedProduct.location.includes(',') && (() => {
                       const [lat, lng] = selectedProduct.location.split(',').map(parseFloat);
                       return (
                           <div className="border-t border-white/5 pt-6 pb-4">
                              <h3 className="text-xl font-bold text-white mb-4">Localização</h3>
                              <div className="w-full h-40 rounded-[1.5rem] overflow-hidden border border-white/10 opacity-90 hover:opacity-100 transition-opacity bg-slate-800">
                                  <iframe 
                                     width="100%" 
                                     height="100%" 
                                     frameBorder="0" 
                                     scrolling="no" 
                                     marginHeight="0" 
                                     marginWidth="0" 
                                     src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}>
                                  </iframe>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                 <p className="text-xs text-slate-400">A localização é aproximada</p>
                                 <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 transition-colors">
                                     <MapPin size={12} /> Marcar como local
                                 </button>
                              </div>
                           </div>
                       );
                   })()}
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
               <form onSubmit={handleAddProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-1">Título</label>
                     <input type="text" required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-uni-purple outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-1">Descrição do Produto</label>
                     <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-uni-purple outline-none resize-none" placeholder="Detalhes do produto..."></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Preço (R$)</label>
                        <input type="number" required min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-uni-purple outline-none" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Condição</label>
                        <select value={newProduct.condition} onChange={e => setNewProduct({...newProduct, condition: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-uni-purple outline-none">
                           <option value="Novo">Novo</option>
                           <option value="Usado — como novo">Usado — como novo</option>
                           <option value="Usado — seminovo">Usado — seminovo</option>
                           <option value="Usado — bom">Usado — bom</option>
                           <option value="Usado — aceitável">Usado — aceitável</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-1">Categoria</label>
                     <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-uni-purple outline-none">
                        <option value="Eletrônicos">Eletrônicos</option>
                        <option value="Informática">Informática</option>
                        <option value="Móveis">Móveis</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Veículos">Veículos</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-400 mb-2">Imagens do Produto (Até 6)</label>
                     <div className="flex flex-wrap gap-2">
                        {productImages.map((file, i) => (
                           <div key={i} className="w-16 h-16 rounded-xl overflow-hidden relative group">
                              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} className="text-white"/></button>
                           </div>
                        ))}
                        {productImages.length < 6 && (
                           <label className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 hover:text-uni-purple hover:border-uni-purple/50 cursor-pointer transition-colors bg-white/5">
                               <ImageIcon size={20} />
                               <input type="file" multiple accept="image/*" className="hidden" onChange={e => {
                                   if (e.target.files) {
                                      const newFiles = Array.from(e.target.files);
                                      setProductImages(prev => [...prev, ...newFiles].slice(0, 6));
                                   }
                               }} />
                           </label>
                        )}
                     </div>
                  </div>

                  {locationCoords && (
                     <div>
                         <label className="block text-sm font-bold text-slate-400 mb-1">Localização Automática</label>
                         <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10 opacity-60 pointer-events-none bg-slate-800">
                             <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                scrolling="no" 
                                marginHeight="0" 
                                marginWidth="0" 
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${locationCoords.lng-0.01},${locationCoords.lat-0.01},${locationCoords.lng+0.01},${locationCoords.lat+0.01}&layer=mapnik&marker=${locationCoords.lat},${locationCoords.lng}`}>
                             </iframe>
                         </div>
                     </div>
                  )}
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
