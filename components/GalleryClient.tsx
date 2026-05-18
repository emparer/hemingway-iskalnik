//components/GalleryClient.tsx
"use client";

import { useState } from "react";

interface Props {
  pictures: string[];
  alt?: string;
}

export default function GalleryClient({ pictures, alt = "" }: Props) {
  const [active, setActive] = useState(0);

  if (!pictures.length) {
    return <div className="gallery-main-placeholder">📷 Ni slike</div>;
  }

  return (
    <>
      <img
        className="gallery-main"
        src={pictures[active]}
        alt={alt}
        onError={e => { (e.target as HTMLImageElement).src = pictures.find((_, i) => i !== active) || ""; }}
      />
      {pictures.length > 1 && (
        <div className="gallery-thumbs">
          {pictures.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              className={i === active ? "active" : ""}
              onClick={() => setActive(i)}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ))}
        </div>
      )}
    </>
  );
}
