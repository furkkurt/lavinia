"use client";

import Image from "next/image";

const INSTA_IMAGES = [1, 2, 3, 4, 5, 6].map((n) => `/images/insta-item${n}.jpg`);

function instagramProfileUrl(): string {
  const raw = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
  if (raw) return raw;
  return "https://www.instagram.com/";
}

export function HomeInstagram() {
  const profileUrl = instagramProfileUrl();

  return (
    <section className="instagram instagram-home position-relative" data-aos="fade-up">
      <div className="container-fluid px-0 instagram-home__grid">
        <div className="row g-0">
          {INSTA_IMAGES.map((src, idx) => (
            <div key={src} className="col-6 col-sm-4 col-md-2">
              <div className="insta-item insta-item--static h-100">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-block h-100"
                  aria-label={`Instagram görseli ${idx + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={400}
                    height={400}
                    className="img-fluid w-100"
                    style={{ objectFit: "cover", aspectRatio: "1" }}
                    sizes="(max-width: 576px) 50vw, (max-width: 768px) 33vw, 16vw"
                    unoptimized
                  />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="instagram-button-overlay">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn instagram-follow-btn text-uppercase"
        >
          Instagram&apos;da takip et
        </a>
      </div>
    </section>
  );
}
