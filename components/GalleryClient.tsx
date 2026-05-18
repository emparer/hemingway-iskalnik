// components/GalleryClient.tsx
"use client";

import { useEffect, useState } from "react";

type GalleryPicture = {
  full: string;
  thumb: string;
};

interface Props {
  pictures: GalleryPicture[];
  alt?: string;
}

export default function GalleryClient({ pictures, alt = "" }: Props) {
  const [validPictures, setValidPictures] = useState<GalleryPicture[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    console.log("========== GalleryClient mounted/updated ==========");
    console.log("[GalleryClient] raw pictures prop:", pictures);
    console.log("[GalleryClient] alt:", alt);

    const cleaned = pictures.filter((pic) => {
    const keep = Boolean(pic?.full);

    if (!keep) {
      console.warn("[GalleryClient] removed invalid picture:", pic);
    }

    return keep;
  });

  const unique = Array.from(
    new Map(cleaned.map((pic) => [pic.full, pic])).values()
  );

  console.log("[GalleryClient] cleaned unique pictures:", unique);
  console.log("[GalleryClient] picture count:", unique.length);

  setValidPictures(unique);
  setActive(0);
  }, [pictures, alt]);

  const activeIndex = Math.min(active, Math.max(validPictures.length - 1, 0));
  const activePicture = validPictures[activeIndex]?.full;

  useEffect(() => {
    console.log("[GalleryClient] validPictures state:", validPictures);
  }, [validPictures]);

  useEffect(() => {
    console.log("[GalleryClient] active index changed:", activeIndex);
    console.log("[GalleryClient] active picture:", activePicture);
  }, [activeIndex, activePicture]);

  function removePicture(src: string) {
    console.error("[GalleryClient] image failed to load, removing:", src);

    setValidPictures((current) => {
      const next = current.filter((pic) => pic.full !== src && pic.thumb !== src);

      console.log("[GalleryClient] pictures before remove:", current);
      console.log("[GalleryClient] pictures after remove:", next);

      if (activeIndex >= next.length) {
        const nextActive = Math.max(next.length - 1, 0);
        console.log("[GalleryClient] fixing active index:", nextActive);
        setActive(nextActive);
      }

      return next;
    });
  }

  function goPrevious() {
    setActive((current) => {
      const next = current === 0 ? validPictures.length - 1 : current - 1;
      console.log("[GalleryClient] previous clicked:", { current, next });
      return next;
    });
  }

  function goNext() {
    setActive((current) => {
      const next = current === validPictures.length - 1 ? 0 : current + 1;
      console.log("[GalleryClient] next clicked:", { current, next });
      return next;
    });
  }

  function selectPicture(index: number, src: string) {
    console.log("[GalleryClient] thumbnail/dot clicked:", {
      index,
      src,
    });

    setActive(index);
  }

  if (!validPictures.length) {
    console.warn("[GalleryClient] no valid pictures available");

    return (
      <div className="gallery-main-placeholder">
        Galerija trenutno ni na voljo.
      </div>
    );
  }

  return (
    <>
      <div className="gallery-main-wrap">
        <img
          className="gallery-main"
          src={activePicture}
          alt={alt}
          onLoad={() => {
            console.log("[GalleryClient] main image loaded:", activePicture);
          }}
          onError={() => {
            removePicture(activePicture);
          }}
        />

        {validPictures.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow prev"
              aria-label="Prejšnja slika"
              onClick={goPrevious}
            >
              ‹
            </button>

            <button
              type="button"
              className="gallery-arrow next"
              aria-label="Naslednja slika"
              onClick={goNext}
            >
              ›
            </button>

            <div className="gallery-counter">
              {activeIndex + 1} / {validPictures.length}
            </div>

            <div className="gallery-dots">
              {validPictures.map((pic, i) => (
                <button
                  key={`dot-${pic.full}-${i}`}
                  type="button"
                  className={`gallery-dot${i === activeIndex ? " active" : ""}`}
                  aria-label={`Prikaži sliko ${i + 1}`}
                  onClick={() => selectPicture(i, pic.full)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {validPictures.length > 1 && (
        <div className="gallery-thumbs">
          {validPictures.map((pic, i) => (
            <button
              key={`${pic.full}-${i}`}
              type="button"
              className={`gallery-thumb${i === activeIndex ? " active" : ""}`}
              onClick={() => selectPicture(i, pic.full)}
            >
              <img
                src={pic.thumb || pic.full}
                alt=""
                onLoad={() => {
                  console.log("[GalleryClient] thumbnail loaded:", pic.thumb || pic.full);
                }}
                onError={() => {
                  removePicture(pic.thumb || pic.full);
                }}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}