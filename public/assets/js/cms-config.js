(function () {
  // Contentful headless CMS configuration.
  // Admin clinic mengelola data di Contentful UI tanpa mengubah kode frontend.
  // Isi value berikut via pipeline/templating sebelum production deploy.
  window.ZHOST_CMS = {
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
})();
