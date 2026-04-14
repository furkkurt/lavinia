"use client";

/**
 * Statik bülten alanı; kampanya HTML’i CMS’de HtmlWidget olarak da kullanılabilir.
 */
export function HomeNewsletter() {
  return (
    <section className="home-newsletter py-5 bg-white border-top border-bottom" data-aos="fade-up">
      <div className="container px-3 px-md-4">
        <div className="row justify-content-center text-center">
          <div className="col-12 col-xl-10 col-xxl-9">
            <h2 className="section-title text-uppercase mb-2">Bültenimize kaydolun</h2>
            <p className="text-muted mb-4 mx-auto home-newsletter__lead" style={{ lineHeight: 1.65 }}>
              Yeni ürünler ve kampanyalardan haberdar olmak için e-posta adresinizi bırakın.
            </p>
            <form
              className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 justify-content-center align-items-stretch align-items-sm-center home-newsletter__form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label htmlFor="home-newsletter-email" className="visually-hidden">
                E-posta
              </label>
              <input
                id="home-newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                className="form-control rounded-0 home-newsletter__input"
                placeholder="E-posta adresiniz"
              />
              <button type="submit" className="btn btn-dark text-uppercase rounded-0 px-4 px-sm-5 home-newsletter__submit flex-shrink-0">
                Kaydol
              </button>
            </form>
            <p className="small text-muted mt-3 mb-0">
              Kaydolduğunuzda gizlilik politikamızı kabul etmiş olursunuz. İstediğiniz zaman çıkabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
