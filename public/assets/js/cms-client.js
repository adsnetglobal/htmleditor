(function () {
  const fallback = window.ZHOST_FALLBACK_CONTENT || {
    services: [],
    testimonials: [],
    beforeAfter: [],
    promos: [],
    blogPosts: []
  };

  const defaultConfig = {
    provider: "contentful",
    spaceId: "",
    environment: "master",
    accessToken: "",
    contentTypes: {
      services: "services",
      testimonials: "testimonials",
      gallery: "gallery",
      promos: "promos",
      articles: "articles"
    }
  };

  const userConfig = window.ZHOST_CMS || {};
  const cmsConfig = {
    ...defaultConfig,
    ...userConfig,
    contentTypes: {
      ...defaultConfig.contentTypes,
      ...(userConfig.contentTypes || {})
    }
  };

  function slugifySeo(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function mapItem(fields = {}) {
    const mapped = {};
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      if (value && value.fields && value.sys && value.sys.type === "Link") {
        mapped[key] = value;
      } else if (value && value.fields && value.sys && value.sys.type === "Asset") {
        mapped[key] = value;
      } else {
        mapped[key] = value;
      }
    });

    if (!mapped.slug && mapped.title) {
      mapped.slug = slugifySeo(mapped.title);
    }
    if (mapped.slug) {
      mapped.slug = slugifySeo(mapped.slug);
    }
    return mapped;
  }

  async function fetchContentfulEntries(contentType) {
    if (!cmsConfig.spaceId || !cmsConfig.accessToken) {
      return [];
    }

    const endpoint = `https://cdn.contentful.com/spaces/${encodeURIComponent(
      cmsConfig.spaceId
    )}/environments/${encodeURIComponent(
      cmsConfig.environment || "master"
    )}/entries?content_type=${encodeURIComponent(contentType)}&include=1&limit=200`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${cmsConfig.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Contentful fetch failed (${response.status})`);
    }

    const payload = await response.json();
    return (payload.items || []).map((entry) => mapItem(entry.fields));
  }

  async function withFallback(primaryLoader, fallbackKey) {
    try {
      const data = await primaryLoader();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return fallback[fallbackKey] || [];
    } catch (error) {
      console.warn(`[CMS] Falling back for ${fallbackKey}:`, error.message);
      return fallback[fallbackKey] || [];
    }
  }

  async function getServices() {
    return withFallback(
      () => fetchContentfulEntries(cmsConfig.contentTypes.services),
      "services"
    );
  }

  async function getTestimonials() {
    return withFallback(
      () => fetchContentfulEntries(cmsConfig.contentTypes.testimonials),
      "testimonials"
    );
  }

  async function getBeforeAfterGallery() {
    return withFallback(
      () => fetchContentfulEntries(cmsConfig.contentTypes.gallery),
      "beforeAfter"
    );
  }

  async function getPromos() {
    return withFallback(
      () => fetchContentfulEntries(cmsConfig.contentTypes.promos),
      "promos"
    );
  }

  async function getBlogPosts() {
    return withFallback(
      () => fetchContentfulEntries(cmsConfig.contentTypes.articles),
      "blogPosts"
    );
  }

  async function getServiceBySlug(slug) {
    const services = await getServices();
    return services.find((service) => slugifySeo(service.slug || service.name) === slugifySeo(slug));
  }

  async function getPostBySlug(slug) {
    const posts = await getBlogPosts();
    return posts.find((post) => slugifySeo(post.slug || post.title) === slugifySeo(slug));
  }

  window.ZHOST_CMS_CLIENT = {
    cmsConfig,
    slugifySeo,
    getServices,
    getTestimonials,
    getBeforeAfterGallery,
    getPromos,
    getBlogPosts,
    getServiceBySlug,
    getPostBySlug
  };
})();
