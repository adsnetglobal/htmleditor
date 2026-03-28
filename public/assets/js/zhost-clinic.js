(function () {
  const cms = window.ZHOST_CMS_CLIENT;
  if (!cms) {
    return;
  }

  const yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  function apiEndpoint() {
    return (
      window.API_URL ||
      window.SCRIPT_URL ||
      window.GAS_URL ||
      "/api"
    );
  }

  async function postAction(action, payload) {
    const response = await fetch(apiEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action, ...payload })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data && data.status === "error")) {
      throw new Error(data.message || "Request gagal diproses.");
    }
    return data;
  }

  function setSeo({ title, description, canonical, image, type }) {
    if (title) {
      document.title = title.slice(0, 60);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", title.slice(0, 60));
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", title.slice(0, 60));
    }

    if (description) {
      const desc = description.slice(0, 160);
      const descTag = document.querySelector('meta[name="description"]');
      if (descTag) descTag.setAttribute("content", desc);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", desc);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", desc);
    }

    if (image) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute("content", image);
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage) twImage.setAttribute("content", image);
    }

    if (type) {
      const ogType = document.querySelector('meta[property="og:type"]');
      if (ogType) ogType.setAttribute("content", type);
    }

    if (canonical) {
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) canonicalEl.setAttribute("href", canonical);
    }
  }

  function injectJsonLd(id, data) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function getSlugFromLocation(prefix) {
    const querySlug = new URLSearchParams(window.location.search).get("slug");
    if (querySlug) {
      return cms.slugifySeo(querySlug);
    }
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === prefix) {
      return cms.slugifySeo(pathParts[1]);
    }
    if (window.SERVICE_SLUG) {
      return cms.slugifySeo(window.SERVICE_SLUG);
    }
    return "";
  }

  function initMobileNav() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");
    const closeBtn = document.querySelector("[data-close-menu]");
    if (!toggle || !mobileNav) return;

    let closeTimer = null;

    function openMenu() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      mobileNav.hidden = false;
      requestAnimationFrame(() => {
        mobileNav.classList.add("open");
      });
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      mobileNav.classList.remove("open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      closeTimer = window.setTimeout(() => {
        if (!mobileNav.classList.contains("open")) {
          mobileNav.hidden = true;
        }
      }, 240);
    }

    toggle.addEventListener("click", () => {
      if (mobileNav.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeBtn?.addEventListener("click", closeMenu);

    mobileNav.addEventListener("click", (event) => {
      if (event.target === mobileNav) {
        closeMenu();
      }
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileNav.classList.contains("open")) {
        closeMenu();
      }
    });
  }

  function initHeroSlider() {
    const slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll(".slide"));
    const dotsWrap = slider.querySelector(".slider-dot-wrap");
    if (!slides.length || !dotsWrap) return;

    let idx = 0;
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "slider-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Slide ${i + 1}`);
      dot.addEventListener("click", () => {
        idx = i;
        render();
      });
      dotsWrap.appendChild(dot);
    });

    function render() {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === idx);
      });
      Array.from(dotsWrap.querySelectorAll(".slider-dot")).forEach((dot, i) => {
        dot.classList.toggle("active", i === idx);
      });
    }

    render();
    setInterval(() => {
      idx = (idx + 1) % slides.length;
      render();
    }, 5300);
  }

  function renderServices(services, targetSelector, limit) {
    const el = document.querySelector(targetSelector);
    if (!el) return;

    const list = limit ? services.slice(0, limit) : services;
    el.innerHTML = "";
    list.forEach((service) => {
      const slug = cms.slugifySeo(service.slug || service.name);
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${service.heroImage || service.detailImage || "/assets/brand/service-facial.svg"}" alt="Layanan ${service.name || "Treatment"} Zhost Klinik" loading="lazy"/>
        <div class="card-body">
          <div class="service-meta"><span class="tag">${service.category || "Treatment"}</span><strong>${service.price || "Harga konsultasi tersedia"}</strong></div>
          <h3>${service.name || "Treatment"}</h3>
          <p>${service.summary || "Perawatan estetika profesional untuk kebutuhan kulit Anda."}</p>
          <a class="btn btn-secondary" href="/layanan/${slug}">Lihat Detail</a>
        </div>`;
      el.appendChild(card);
    });
  }

  function renderTestimonials(items) {
    const wrap = document.querySelector("#testimonialCards");
    if (!wrap) return;
    wrap.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "card testimonial-card";
      const stars = "★".repeat(Math.min(Number(item.rating || 5), 5));
      card.innerHTML = `
        <div class="stars" aria-label="rating ${item.rating || 5}">${stars}</div>
        <p>“${item.quote || "Pelayanan sangat profesional dan ramah."}”</p>
        <strong>${item.name || "Pasien Zhost"}</strong>
        <div class="notice">${item.treatment || "Treatment"}</div>`;
      wrap.appendChild(card);
    });
  }

  function renderPromos(items) {
    const wrap = document.querySelector("#promoCards");
    if (!wrap) return;
    wrap.innerHTML = "";
    (items || []).forEach((promo) => {
      const article = document.createElement("article");
      article.className = "card card-body";
      article.innerHTML = `
        <h3>${promo.title || "Promo Zhost Klinik"}</h3>
        <p>${promo.body || "Dapatkan penawaran treatment terbaik untuk periode terbatas."}</p>
        <a class="btn btn-primary" href="${promo.href || "#appointment"}">${promo.cta || "Lihat Promo"}</a>`;
      wrap.appendChild(article);
    });
  }

  function initGallery(items) {
    const grid = document.querySelector("#beforeAfterGrid");
    const lightbox = document.querySelector("#galleryLightbox");
    if (!grid || !lightbox) return;

    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector("figcaption");
    const closeBtn = lightbox.querySelector("button");

    grid.innerHTML = "";
    items.forEach((item) => {
      const fig = document.createElement("figure");
      fig.className = "gallery-item";
      fig.innerHTML = `
        <img src="${item.thumb}" data-full="${item.full}" alt="${item.alt || item.title || "Before after Zhost Klinik"}" loading="lazy"/>
        <span>${item.title || "Before / After"}</span>`;
      fig.addEventListener("click", () => {
        const img = fig.querySelector("img");
        if (!img) return;
        image.src = img.getAttribute("data-full") || img.src;
        image.alt = img.alt;
        caption.textContent = item.title || "Before / After";
        lightbox.classList.add("open");
      });
      grid.appendChild(fig);
    });

    closeBtn?.addEventListener("click", () => lightbox.classList.remove("open"));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        lightbox.classList.remove("open");
      }
    });
  }

  function initAppointmentForm() {
    const form = document.querySelector("#appointmentForm");
    if (!form) return;

    const steps = Array.from(form.querySelectorAll("[data-form-step]"));
    const bars = Array.from(form.querySelectorAll(".step"));
    const notice = form.querySelector("#appointmentNotice");
    const captchaQuestion = form.querySelector("#captchaQuestion");
    const captchaExpected = form.querySelector("#captchaExpected");
    let current = 0;

    function newCaptcha() {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 1;
      if (captchaQuestion) captchaQuestion.textContent = `${a} + ${b} = ?`;
      if (captchaExpected) captchaExpected.value = String(a + b);
    }

    function render() {
      steps.forEach((step, idx) => {
        step.classList.toggle("hidden", idx !== current);
      });
      bars.forEach((bar, idx) => {
        bar.classList.toggle("active", idx <= current);
      });
    }

    function validateCurrentStep() {
      const step = steps[current];
      if (!step) return true;
      const req = Array.from(step.querySelectorAll("[required]"));
      for (const field of req) {
        if (!field.value || !field.value.trim()) {
          field.focus();
          return false;
        }
      }
      return true;
    }

    form.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!validateCurrentStep()) return;
        current = Math.min(current + 1, steps.length - 1);
        render();
      });
    });

    form.querySelectorAll("[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        current = Math.max(current - 1, 0);
        render();
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateCurrentStep()) return;

      const payload = {
        full_name: form.full_name?.value || "",
        email: form.email?.value || "",
        phone: form.phone?.value || "",
        treatment: form.treatment?.value || "",
        preferred_date: form.preferred_date?.value || "",
        notes: form.notes?.value || "",
        captcha_answer: form.captcha_answer?.value || "",
        captcha_expected: form.captcha_expected?.value || "",
        source_url: window.location.href
      };

      try {
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        await postAction("book_appointment", payload);
        notice.textContent =
          "Terima kasih! Permintaan appointment Anda sudah kami terima. Tim kami akan menghubungi Anda segera.";
        notice.style.color = "#1f6d4f";
        form.reset();
        current = 0;
        render();
        newCaptcha();
      } catch (error) {
        notice.textContent = error.message || "Gagal mengirim appointment.";
        notice.style.color = "#b00020";
      } finally {
        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = false;
      }
    });

    render();
    newCaptcha();
  }

  function initNewsletter() {
    const form = document.querySelector("#newsletterForm");
    if (!form) return;
    const note = form.querySelector(".notice");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = form.email?.value || "";
      try {
        await postAction("subscribe_newsletter", {
          email,
          source_url: window.location.href
        });
        if (note) {
          note.textContent =
            "Cek email Anda untuk konfirmasi langganan (double opt-in).";
          note.style.color = "#1f6d4f";
        }
        form.reset();
      } catch (error) {
        if (note) {
          note.textContent = error.message || "Gagal mendaftar newsletter.";
          note.style.color = "#b00020";
        }
      }
    });
  }

  function renderBlogCards(posts, selector, limit) {
    const wrap = document.querySelector(selector);
    if (!wrap) return;
    wrap.innerHTML = "";
    const list = limit ? posts.slice(0, limit) : posts;
    list.forEach((post) => {
      const slug = cms.slugifySeo(post.slug || post.title);
      const article = document.createElement("article");
      article.className = "card";
      article.innerHTML = `
        <img src="${post.coverImage || "/assets/brand/blog-1.svg"}" alt="Artikel ${post.title || "Zhost Klinik"}" loading="lazy" />
        <div class="card-body">
          <div class="service-meta"><span class="tag">${post.category || "Artikel"}</span><span>${post.publishedAt || ""}</span></div>
          <h3>${post.title || "Artikel"}</h3>
          <p>${post.excerpt || "Insight dan edukasi dari tim medis Zhost Klinik."}</p>
          <a class="btn btn-secondary" href="/blog/${slug}">Baca Artikel</a>
        </div>`;
      wrap.appendChild(article);
    });
  }

  async function initHomePage() {
    initHeroSlider();
    const [services, testimonials, gallery, blogPosts, promos] = await Promise.all([
      cms.getServices(),
      cms.getTestimonials(),
      cms.getBeforeAfterGallery(),
      cms.getBlogPosts(),
      cms.getPromos()
    ]);

    renderPromos(promos);
    renderServices(services, "#serviceCards", 4);
    renderTestimonials(testimonials);
    initGallery(gallery);
    renderBlogCards(blogPosts, "#blogCards", 3);
    initAppointmentForm();
    initNewsletter();
  }

  async function initServiceListPage() {
    const services = await cms.getServices();
    renderServices(services, "#serviceList", null);
  }

  async function initServiceDetailPage() {
    const slug = getSlugFromLocation("layanan");
    if (!slug) return;
    const service = await cms.getServiceBySlug(slug);
    if (!service) {
      const fallback = document.querySelector("#serviceNotFound");
      if (fallback) fallback.classList.remove("hidden");
      return;
    }

    const title = service.name || "Detail Layanan";
    const h1 = document.querySelector("#serviceTitle");
    const summary = document.querySelector("#serviceSummary");
    const image = document.querySelector("#serviceImage");
    const benefits = document.querySelector("#serviceBenefits");
    const process = document.querySelector("#serviceProcess");
    const faq = document.querySelector("#serviceFaq");

    if (h1) h1.textContent = title;
    if (summary) summary.textContent = service.summary || "";
    if (image) {
      image.src = service.detailImage || service.heroImage || "/assets/brand/service-facial.svg";
      image.alt = `Layanan ${title} di Zhost Klinik`;
    }

    if (benefits) {
      benefits.innerHTML = "";
      (service.benefits || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        benefits.appendChild(li);
      });
    }

    if (process) {
      process.innerHTML = "";
      (service.process || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        process.appendChild(li);
      });
    }

    if (faq) {
      faq.innerHTML = "";
      (service.faq || []).forEach((item) => {
        const details = document.createElement("details");
        const sum = document.createElement("summary");
        sum.textContent = item.q || "FAQ";
        const p = document.createElement("p");
        p.textContent = item.a || "";
        details.appendChild(sum);
        details.appendChild(p);
        faq.appendChild(details);
      });
    }

    const canonical = `${window.location.origin}/layanan/${slug}`;
    setSeo({
      title: service.seoTitle || `${title} | Zhost Klinik`,
      description: service.seoDescription || service.summary,
      canonical,
      image: service.heroImage,
      type: "website"
    });

    injectJsonLd("service-schema", {
      "@context": "https://schema.org",
      "@type": "MedicalProcedure",
      name: title,
      description: service.summary,
      provider: {
        "@type": "MedicalClinic",
        name: "Zhost Klinik"
      }
    });
  }

  async function initBlogPage() {
    const posts = await cms.getBlogPosts();
    renderBlogCards(posts, "#blogList", null);
  }

  async function initArticlePage() {
    const slug = getSlugFromLocation("blog");
    if (!slug) return;
    const post = await cms.getPostBySlug(slug);
    if (!post) {
      const fallback = document.querySelector("#articleNotFound");
      if (fallback) fallback.classList.remove("hidden");
      return;
    }

    const title = post.title || "Artikel";
    const category = post.category || "Artikel";
    const excerpt = post.excerpt || "";
    const cover = post.coverImage || "/assets/brand/blog-1.svg";
    const canonical = `${window.location.origin}/blog/${slug}`;

    const h1 = document.querySelector("#articleTitle");
    const meta = document.querySelector("#articleMeta");
    const content = document.querySelector("#articleContent");
    const img = document.querySelector("#articleCover");
    const breadcrumb = document.querySelector("#articleBreadcrumbTitle");

    if (h1) h1.textContent = title;
    if (meta) {
      meta.textContent = `${post.author || "Tim Zhost Klinik"} • ${post.publishedAt || ""} • ${category}`;
    }
    if (img) {
      img.src = cover;
      img.alt = `Cover artikel ${title}`;
      img.loading = "lazy";
    }
    if (content) {
      content.innerHTML = "";
      (post.content || []).forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        content.appendChild(p);
      });
    }
    if (breadcrumb) {
      breadcrumb.textContent = title;
    }

    setSeo({
      title: post.seoTitle || `${title} | Zhost Klinik`,
      description: post.seoDescription || excerpt,
      canonical,
      image: cover,
      type: "article"
    });

    injectJsonLd("article-schema", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: excerpt,
      datePublished: post.publishedAt,
      author: {
        "@type": "Person",
        name: post.author || "Tim Zhost Klinik"
      },
      image: [cover],
      publisher: {
        "@type": "Organization",
        name: "Zhost Klinik"
      },
      mainEntityOfPage: canonical
    });

    injectJsonLd("article-breadcrumb-schema", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Beranda",
          item: `${window.location.origin}/`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${window.location.origin}/blog.html`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: canonical
        }
      ]
    });
  }

  async function initNewsletterConfirmPage() {
    const status = document.querySelector("#newsletterConfirmStatus");
    if (!status) return;
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      status.textContent = "Token konfirmasi tidak ditemukan.";
      status.style.color = "#b00020";
      return;
    }
    try {
      await postAction("confirm_newsletter", { token });
      status.textContent = "Langganan newsletter berhasil dikonfirmasi. Terima kasih!";
      status.style.color = "#1f6d4f";
    } catch (error) {
      status.textContent = error.message || "Konfirmasi newsletter gagal.";
      status.style.color = "#b00020";
    }
  }

  async function bootstrap() {
    initMobileNav();
    const page = document.body.dataset.page;
    switch (page) {
      case "home":
        await initHomePage();
        break;
      case "services":
        await initServiceListPage();
        break;
      case "service-detail":
        await initServiceDetailPage();
        break;
      case "blog":
        await initBlogPage();
        break;
      case "article":
        await initArticlePage();
        break;
      case "newsletter-confirm":
        await initNewsletterConfirmPage();
        break;
      default:
        break;
    }
  }

  bootstrap().catch((error) => {
    console.error("[Zhost Clinic] bootstrap error:", error);
  });
})();
