"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, Badge, Button, Input, Select, Modal, SearchInput, Table, Thead, Th, Tbody, Tr, Td, EmptyState, FormGroup, Switch, StatCard, RichTextField } from "@/components/ui";
import toast from "react-hot-toast";
import ImageUploadField from "@/components/ImageUploadField";

const PRODUCT_CATEGORIES = ["Jersey","Training","Casual","Accessories","Kids","Collectibles","Scarf","Hat","Mug","Poster"];
const SIZES = ["XS","S","M","L","XL","XXL","XXXL","One Size"];
const COLORS_VARIANT = ["Red","White","Black","Navy","Gold","Green","Blue","Grey"];
const COLOR_PRESETS = [
  "linear-gradient(135deg,#EF0107,#9B0000)","linear-gradient(135deg,#1A1A2E,#16213E)",
  "linear-gradient(135deg,#EF0107,#C6A84B)","linear-gradient(135deg,#16213E,#063672)",
  "linear-gradient(135deg,#C6A84B,#E8C97A)","linear-gradient(135deg,#2ECC71,#1A6B35)",
];
const ICONS_MAP = ["fa-solid fa-shirt","fa-solid fa-hat-wizard","fa-solid fa-mug-hot","fa-solid fa-bag-shopping","fa-solid fa-tag","fa-solid fa-star","fa-solid fa-flag","fa-solid fa-medal","fa-solid fa-scarf","fa-solid fa-socks"];

const EMPTY_FORM = { name:"",category:"Jersey",price:"",salePrice:"",stock:"",description:"",sizes:[] as string[],colors:[] as string[],badge:"",inStock:true,color:COLOR_PRESETS[0],icon:"fa-solid fa-shirt",memberDiscount:true,image:"",sku:"",featured:false };

export default function AdminShopPage() {
  const { products, updateProduct, deleteProduct, setProducts } = useApp();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [viewOrders, setViewOrders] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const sf = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggleSize = (s: string) => setForm(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x=>x!==s) : [...p.sizes,s] }));
  const toggleColor = (c: string) => setForm(p => ({ ...p, colors: p.colors.includes(c) ? p.colors.filter(x=>x!==c) : [...p.colors,c] }));

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => catFilter==="All" || p.category===catFilter);

  const openAdd = () => { setForm({...EMPTY_FORM}); setEditId(null); setShowForm(true); };
  const openEdit = (p: any) => {
    setForm({ name:p.name, category:p.category, price:String(p.price), salePrice:String(p.salePrice||""), stock:String(p.stock), description:p.description||"", sizes:[...(p.sizes||[])], colors:[...(p.colors||[])], badge:p.badge||"", inStock:p.inStock, color:p.color||COLOR_PRESETS[0], icon:p.icon||"fa-solid fa-shirt", memberDiscount:p.memberDiscount, image:p.image||"", sku:p.sku||"", featured:p.featured||false });
    setEditId(p.id); setShowForm(true);
  };

  const save = () => {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return; }
    const data = { ...form, price:parseFloat(form.price)||0, salePrice:parseFloat(form.salePrice)||0, stock:parseInt(form.stock)||0, badge:form.badge||undefined };
    if (editId) { updateProduct(editId, data); toast.success("Product updated"); }
    else { setProducts([...products, { id:Date.now(), ...data }]); toast.success("Product added"); }
    setShowForm(false);
  };

  const totalValue = products.reduce((a,p)=>a+p.price*(p.stock||0), 0);
  const lowStock = products.filter(p=>p.stock>0&&p.stock<10).length;
  const outOfStock = products.filter(p=>!p.inStock||p.stock===0).length;

  const mockOrders = [
    { id:"ORD-001",member:"Kwame Asante",item:"Arsenal Ghana Home Jersey",size:"L",qty:1,total:350,status:"Delivered",date:"Mar 15, 2025" },
    { id:"ORD-002",member:"Ama Boateng",item:"Arsenal Ghana Cap",size:"-",qty:2,total:240,status:"Processing",date:"Mar 18, 2025" },
    { id:"ORD-003",member:"Kofi Mensah",item:"Arsenal Ghana Scarf",size:"-",qty:1,total:80,status:"Pending",date:"Mar 20, 2025" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily:"var(--font-display)" }}>SHOP MANAGEMENT</h1>
          <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>Manage products, categories, pricing and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={()=>setViewOrders(true)}><i className="fa-solid fa-receipt mr-1.5" />Orders</Button>
          <Button onClick={openAdd}><i className="fa-solid fa-plus mr-1.5" />Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Products" value={products.length} icon="fa-solid fa-bag-shopping" color="#EF0107" />
        <StatCard label="Inventory Value" value={`GH₵${totalValue.toLocaleString()}`} icon="fa-solid fa-coins" color="#C6A84B" />
        <StatCard label="Low Stock" value={lowStock} icon="fa-solid fa-triangle-exclamation" color="#F59E0B" change="< 10 units" up={false} />
        <StatCard label="Out of Stock" value={outOfStock} icon="fa-solid fa-ban" color="#EF4444" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        <div className="flex gap-1.5 flex-wrap">
          {["All",...PRODUCT_CATEGORIES].map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              className="px-3 py-1.5 text-xs rounded-sm transition-all uppercase tracking-wider"
              style={{ fontFamily:"var(--font-heading)",background:catFilter===c?"var(--color-red)":"rgba(255,255,255,0.05)",color:catFilter===c?"white":"rgba(255,255,255,0.5)",border:`1px solid ${catFilter===c?"var(--color-red)":"rgba(255,255,255,0.08)"}` }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length===0
        ? <EmptyState icon="fa-solid fa-bag-shopping" title="No products found" action={<Button onClick={openAdd}><i className="fa-solid fa-plus mr-2" />Add Product</Button>} />
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p,i)=>(
              <motion.div key={p.id} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}>
                <Card className="group overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                  <div className="relative h-40 overflow-hidden" style={{ background:p.color||COLOR_PRESETS[0] }}>
                    {(p as any).image
                      ? <img src={(p as any).image} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center"><i className={`${p.icon} text-5xl`} style={{ color:"rgba(255,255,255,0.15)" }} /></div>
                    }
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {(p as any).badge && <Badge variant="gold">{(p as any).badge}</Badge>}
                      {(!p.inStock||p.stock===0) && <Badge variant="danger">Out of Stock</Badge>}
                      {p.stock>0&&p.stock<10 && <Badge variant="warning">Low Stock</Badge>}
                      {(p as any).featured && <Badge variant="info">Featured</Badge>}
                    </div>
                    {p.memberDiscount && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-sm" style={{ background:"rgba(46,204,113,0.9)",color:"white",fontFamily:"var(--font-heading)" }}>10% OFF</span>}
                    {(p as any).salePrice > 0 && <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-sm" style={{ background:"rgba(239,1,7,0.9)",color:"white",fontFamily:"var(--font-heading)" }}>SALE</span>}
                  </div>
                  <CardContent>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color:"rgba(255,255,255,0.35)",fontFamily:"var(--font-heading)" }}>{p.category}</p>
                    <h3 className="font-bold text-white text-sm mb-2 leading-snug" style={{ fontFamily:"var(--font-heading)" }}>{p.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {(p as any).salePrice > 0 ? (
                          <span className="text-lg font-black" style={{ color:"var(--color-red)",fontFamily:"var(--font-display)" }}>GH₵{(p as any).salePrice} <span className="text-xs line-through" style={{ color:"rgba(255,255,255,0.35)" }}>GH₵{p.price}</span></span>
                        ) : (
                          <span className="text-lg font-black" style={{ color:"var(--color-gold)",fontFamily:"var(--font-display)" }}>GH₵{p.price}</span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color:p.stock>10?"rgba(255,255,255,0.5)":p.stock>0?"#F59E0B":"#EF4444" }}>{p.stock} left</span>
                    </div>
                    {p.sizes && p.sizes.length>0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {p.sizes.map(s=><span key={s} className="px-1.5 py-0.5 text-[9px] rounded" style={{ background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)" }}>{s}</span>)}
                      </div>
                    )}
                    <div className="flex gap-1.5 pt-2" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                      <Button variant="secondary" size="sm" className="flex-1" onClick={()=>openEdit(p)}>
                        <i className="fa-solid fa-pen mr-1" />Edit
                      </Button>
                      <Button variant="ghost" size="icon" onClick={()=>{ updateProduct(p.id,{ inStock:!p.inStock }); toast.success("Stock status updated"); }} title="Toggle stock">
                        <i className={`fa-solid ${p.inStock?"fa-toggle-on":"fa-toggle-off"} text-sm`} style={{ color:p.inStock?"#22C55E":"rgba(255,255,255,0.3)" }} />
                      </Button>
                      <Button variant="danger" size="icon" onClick={()=>{ if(!confirm("Delete product?"))return; deleteProduct(p.id); toast.success("Product deleted"); }}>
                        <i className="fa-solid fa-trash text-xs" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
      }

      {/* Add/Edit Product Modal */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title={editId?"Edit Product":"Add New Product"} size="xl">
        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">

          <ImageUploadField
            label="Product image"
            value={form.image}
            onChange={(image) => setForm((p) => ({ ...p, image }))}
            folder="shop"
            previewHeight={160}
            hint="Main product photo for the shop catalog."
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormGroup label="Product Name *" icon="fa-solid fa-tag">
                <Input value={form.name} onChange={sf("name")} placeholder="e.g. Arsenal Ghana Home Jersey 2024/25" />
              </FormGroup>
            </div>
            <FormGroup label="SKU / Product Code" icon="fa-solid fa-barcode">
              <Input value={form.sku} onChange={sf("sku")} placeholder="e.g. ASC-JRS-001" />
            </FormGroup>
            <FormGroup label="Category" icon="fa-solid fa-folder">
              <Select value={form.category} onChange={sf("category")}>
                {PRODUCT_CATEGORIES.map(c=><option key={c} style={{ background:"#0D1629" }}>{c}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Price (GH₵) *" icon="fa-solid fa-money-bill">
              <Input type="number" value={form.price} onChange={sf("price")} placeholder="350" min="0" />
            </FormGroup>
            <FormGroup label="Sale Price (GH₵) — leave 0 if no sale" icon="fa-solid fa-tag">
              <Input type="number" value={form.salePrice} onChange={sf("salePrice")} placeholder="0" min="0" />
            </FormGroup>
            <FormGroup label="Stock Quantity" icon="fa-solid fa-boxes-stacked">
              <Input type="number" value={form.stock} onChange={sf("stock")} placeholder="50" min="0" />
            </FormGroup>
            <FormGroup label="Badge Label (optional)" icon="fa-solid fa-certificate">
              <Input value={form.badge} onChange={sf("badge")} placeholder="e.g. Bestseller, New, Limited Edition" />
            </FormGroup>
            <div className="sm:col-span-2">
              <FormGroup label="Description" icon="fa-solid fa-align-left">
                <RichTextField value={form.description} onChange={v => setForm((p:any) => ({...p, description: v}))} placeholder="Product description…" minHeight={160} />
              </FormGroup>
            </div>

            {/* Available Sizes */}
            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-ruler mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Available Sizes
              </p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map(s=><button key={s} type="button" onClick={()=>toggleSize(s)} className="px-3 py-1.5 text-xs rounded-sm transition-all" style={{ background:form.sizes.includes(s)?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${form.sizes.includes(s)?"var(--color-red)":"rgba(255,255,255,0.08)"}`,color:form.sizes.includes(s)?"var(--color-red)":"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)" }}>{s}</button>)}
              </div>
            </div>

            {/* Color Variants */}
            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-swatchbook mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Color Variants
              </p>
              <div className="flex gap-2 flex-wrap">
                {COLORS_VARIANT.map(c=><button key={c} type="button" onClick={()=>toggleColor(c)} className="px-3 py-1.5 text-xs rounded-sm transition-all" style={{ background:form.colors.includes(c)?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${form.colors.includes(c)?"var(--color-red)":"rgba(255,255,255,0.08)"}`,color:form.colors.includes(c)?"var(--color-red)":"rgba(255,255,255,0.5)",fontFamily:"var(--font-heading)" }}>{c}</button>)}
              </div>
            </div>

            {/* Card Background (shown when no image) */}
            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-palette mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Card Background (used when no photo)
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {COLOR_PRESETS.map((c,i)=><button type="button" key={i} onClick={()=>setForm(p=>({...p,color:c}))} className="w-12 h-8 rounded-sm transition-transform hover:scale-105" style={{ background:c,outline:form.color===c?"2px solid white":"none",outlineOffset:"2px" }} />)}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"rgba(255,255,255,0.45)",fontFamily:"var(--font-heading)" }}>
                <i className="fa-solid fa-icons mr-1.5 text-[10px]" style={{ color:"var(--color-red)" }} />Fallback Icon
              </p>
              <div className="flex gap-2 flex-wrap">
                {ICONS_MAP.map(icon=><button type="button" key={icon} onClick={()=>setForm(p=>({...p,icon}))} className="w-10 h-10 rounded-sm flex items-center justify-center transition-all" style={{ background:form.icon===icon?"rgba(239,1,7,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.08)"}`,color:form.icon===icon?"var(--color-red)":"rgba(255,255,255,0.4)" }}><i className={`${icon} text-base`} /></button>)}
              </div>
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 grid grid-cols-3 gap-4 p-4 rounded-sm" style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)" }}>
              <Switch checked={form.inStock} onChange={()=>setForm(p=>({...p,inStock:!p.inStock}))} label="In Stock" />
              <Switch checked={form.memberDiscount} onChange={()=>setForm(p=>({...p,memberDiscount:!p.memberDiscount}))} label="10% Member Discount" />
              <Switch checked={form.featured} onChange={()=>setForm(p=>({...p,featured:!p.featured}))} label="Featured Product" />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Button variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Button>
          <Button onClick={save}><i className="fa-solid fa-save mr-1.5" />{editId?"Update Product":"Add Product"}</Button>
        </div>
      </Modal>

      {/* Orders Modal */}
      <Modal open={viewOrders} onClose={()=>setViewOrders(false)} title="Recent Orders" size="lg">
        <CardContent className="p-0">
          <Table>
            <Thead><Th>Order ID</Th><Th>Member</Th><Th>Product</Th><Th>Qty</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th></Thead>
            <Tbody>
              {mockOrders.map(o=>(
                <Tr key={o.id}>
                  <Td><span className="font-mono text-xs font-bold" style={{ color:"var(--color-gold)" }}>{o.id}</span></Td>
                  <Td className="font-medium text-white">{o.member}</Td>
                  <Td className="max-w-[180px] truncate">{o.item}{o.size!=="-"&&` (${o.size})`}</Td>
                  <Td className="text-center">{o.qty}</Td>
                  <Td className="font-bold" style={{ color:"var(--color-gold)" }}>GH₵{o.total}</Td>
                  <Td><Badge variant={o.status==="Delivered"?"success":o.status==="Processing"?"info":"warning"}>{o.status}</Badge></Td>
                  <Td className="text-white/40 text-xs">{o.date}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <p className="p-4 text-xs text-center" style={{ color:"rgba(255,255,255,0.3)" }}>Real orders sync from Paystack webhooks in production</p>
        </CardContent>
      </Modal>
    </div>
  );
}
