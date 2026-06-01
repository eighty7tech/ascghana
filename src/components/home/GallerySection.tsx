"use client";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Album { id: number; name: string; slug: string; cover_url?: string; cover_color: string; category?: string; image_count: number }
interface Props { albums: Album[] }

const GRADS = [
  "linear-gradient(135deg, #8B0000 0%, #1A0505 100%)",
  "linear-gradient(135deg, #0C1C3D 0%, #0A0508 100%)",
  "linear-gradient(135deg, #1A0A0A 0%, #3B0000 100%)",
  "linear-gradient(135deg, #0A1A0A 0%, #0A0508 100%)",
  "linear-gradient(135deg, #1A1A0A 0%, #0A0508 100%)",
  "linear-gradient(135deg, #0A0A1A 0%, #1A0A0A 100%)",
];

export default function GallerySection({ albums }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  const slots = albums.length ? albums.slice(0, 7) : Array.from({ length: 7 }, (_, i) => ({
    id: i + 1, name: `Album ${i + 1}`, slug: `album-${i + 1}`,
    cover_url: undefined, cover_color: "#EF0107", category: "Gallery", image_count: 0,
  }));

  return (
    <section ref={ref} className="section"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="section-label mb-3">Gallery</span>
            <h2 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>
              MOMENTS & MEMORIES
            </h2>
          </div>
          <Link href="/gallery" className="btn-arsenal text-xs px-5" style={{ height: 38 }}>
            <i className="fa-solid fa-images" />Full Gallery
          </Link>
        </motion.div>

        {/* Masonry-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ gridAutoRows: "160px" }}>
          {slots.map((album, i) => {
            const isHero = i === 0;
            const isTall = i === 3;
            return (
              <motion.div key={album.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className={`group relative overflow-hidden rounded cursor-pointer ${isHero ? "md:col-span-2 md:row-span-2" : ""} ${isTall ? "md:row-span-2" : ""}`}
                style={{ background: album.cover_url ? undefined : GRADS[i % GRADS.length] }}>
                <Link href="/gallery" className="absolute inset-0">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: GRADS[i % GRADS.length] }}>
                      <i className="fa-solid fa-images text-3xl opacity-15 text-white" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
                    style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 60%)" }}>
                    <div>
                      <p className="text-white text-xs font-bold" style={{ fontFamily: "var(--font-heading)" }}>{album.name}</p>
                      {album.image_count > 0 && (
                        <p className="text-white/60 text-[10px]">{album.image_count} photos</p>
                      )}
                    </div>
                  </div>
                  {/* Arsenal badge on hero */}
                  {isHero && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{ background: "var(--red)", color: "#fff", fontFamily: "var(--font-heading)" }}>
                      <i className="fa-solid fa-shield-halved mr-1" />ASC Ghana
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
