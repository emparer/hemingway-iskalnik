//components/GalleryClient.tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  pictures: string[];
  alt?: string;
}

export default function GalleryClient({ pictures, alt = "" }: Props) {
  const [validPictures, setValidPictures] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setValidPictures(Array.from(new Set(pictures.filter(Boolean))));
    setActive(0);
  }, [pictures]);

  const activeIndex = Math.min(active, Math.max(validPictures.length - 1, 0));

  function removePicture(src: string) {
    setValidPictures(current => {
      const next = current.filter(pic => pic !== src);
      if (activeIndex >= next.length) {
        setActive(Math.max(next.length - 1, 0));
      }
      return next;
    });
  }

  if (!validPictures.length) {
    return <div className="gallery-main-placeholder">Galerija trenutno ni na voljo.</div>;
  }

  return (
    <>
      <div className="gallery-main-wrap">
        <img
          className="gallery-main"
          src={validPictures[activeIndex]}
          alt={alt}
          onError={() => removePicture(validPictures[activeIndex])}
        />
        {validPictures.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow prev"
              aria-label="Prejšnja slika"
              onClick={() => setActive(current => (current === 0 ? validPictures.length - 1 : current - 1))}
            >
              ‹
            </button>
            <button
              type="button"
              className="gallery-arrow next"
              aria-label="Naslednja slika"
              onClick={() => setActive(current => (current === validPictures.length - 1 ? 0 : current + 1))}
            >
              ›
            </button>
            <div className="gallery-counter">{activeIndex + 1} / {validPictures.length}</div>
            <div className="gallery-dots">
              {validPictures.map((src, i) => (
                <button
                  key={`dot-${src}-${i}`}
                  type="button"
                  className={`gallery-dot${i === activeIndex ? " active" : ""}`}
                  aria-label={`Prikaži sliko ${i + 1}`}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {validPictures.length > 1 && (
        <div className="gallery-thumbs">
          {validPictures.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className={`gallery-thumb${i === activeIndex ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img
                src={src}
                alt=""
                onError={() => removePicture(src)}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
