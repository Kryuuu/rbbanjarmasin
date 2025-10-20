document.addEventListener('DOMContentLoaded', function () {
    const navToggle = document.getElementById('nav-toggle');
    const navDropdown = document.getElementById('nav-dropdown');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navDropdown) {
        const body = document.body;
        const menuIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/></svg>';
        const closeIcon = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M6 18L18 6"/></svg>';
        let isNavOpen = false;

        navDropdown.classList.remove('nav-open');
        navDropdown.setAttribute('aria-hidden', 'true');
        navDropdown.style.maxHeight = '0px';

        const setNavState = (open) => {
            isNavOpen = open;
            navDropdown.classList.toggle('nav-open', open);
            navDropdown.setAttribute('aria-hidden', String(!open));
            navToggle.setAttribute('aria-expanded', String(open));
            navToggle.innerHTML = open ? closeIcon : menuIcon;
            navDropdown.style.maxHeight = open ? navDropdown.scrollHeight + 'px' : '0px';
            body.classList.toggle('overflow-hidden', open);
        };

        navToggle.innerHTML = menuIcon;
        navToggle.setAttribute('aria-controls', 'nav-dropdown');
        navToggle.setAttribute('aria-expanded', 'false');

        navToggle.addEventListener('click', () => setNavState(!isNavOpen));

        navDropdown.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setNavState(false));
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                if (isNavOpen) setNavState(false);
            } else if (isNavOpen) {
                navDropdown.style.maxHeight = navDropdown.scrollHeight + 'px';
            }
        });
    }

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                navLinks.forEach((link) => {
                    const href = link.getAttribute('href');
                    if (href === '#' + id) link.classList.add('active');
                    else link.classList.remove('active');
                });
            });
        },
        { threshold: 0.45 }
    );

    document.querySelectorAll('main section[id]').forEach((section) => {
        sectionObserver.observe(section);
    });

    if (typeof Swiper !== 'undefined') {
        new Swiper('.hero-swiper', {
            loop: true,
            speed: 800,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.hero-swiper .swiper-pagination', clickable: true }
        });
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({ once: true, offset: 120, duration: 700, easing: 'ease-out-cubic' });
    }

    const chartInstances = [];
    let testimonialSwiper = null;

    const resizeCharts = () => {
        chartInstances.forEach(({ chart, baseHeight }) => {
            chart.updateOptions({ chart: { height: baseHeight } }, false, true);
        });
    };

    const renderAreaChart = (elementId, entries, color, height) => {
        if (typeof ApexCharts === 'undefined') return;
        const element = document.querySelector(elementId);
        if (!element) return;

        const years = entries.map((item) => item.tahun);
        const totals = entries.map((item) => Number(item.jumlah ?? item.total ?? 0));

        element.innerHTML = '';

        const chart = new ApexCharts(element, {
            chart: { type: 'area', height, toolbar: { show: false }, background: 'transparent', foreColor: '#DCEEFF' },
            series: [{ name: 'Jumlah', data: totals }],
            xaxis: {
                categories: years,
                title: { text: 'Tahun', style: { color: '#F2FAFF' } },
                labels: { style: { colors: years.map(() => '#E5F5FF') } },
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: {
                title: { text: 'Jumlah', style: { color: '#F2FAFF' } },
                labels: { style: { colors: '#E5F5FF' } }
            },
            grid: { borderColor: 'rgba(255, 255, 255, 0.16)', strokeDashArray: 5, xaxis: { lines: { show: false } } },
            stroke: { width: 3, curve: 'smooth' },
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 0.8, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] }
            },
            markers: { size: 0, strokeColors: '#ffffff', strokeWidth: 2, hover: { sizeOffset: 4 } },
            dataLabels: { enabled: false },
            colors: [color],
            tooltip: { theme: 'dark', x: { show: false } },
            theme: { mode: 'dark' }
        });

        chart.render();
        chartInstances.push({ chart, baseHeight: height });
    };

    const loadStatistics = () => {
        if (typeof ApexCharts === 'undefined') return;

        const statsGrid = document.querySelector('[data-stat-grid]');
        const chartMeta = {
            digital: { elementId: '#chart-digital', headingSelector: '[data-chart-title="digital"]', defaultColor: '#4FC3F7', defaultHeight: 320 },
            modern: { elementId: '#chart-modern', headingSelector: '[data-chart-title="modern"]', defaultColor: '#A78BFA', defaultHeight: 260 },
            online: { elementId: '#chart-online', headingSelector: '[data-chart-title="online"]', defaultColor: '#34D399', defaultHeight: 260 }
        };

        fetch('data/statistics.json', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Gagal memuat statistik');
                return response.json();
            })
            .then((data) => {
                chartInstances.forEach(({ chart }) => chart.destroy());
                chartInstances.length = 0;

                if (statsGrid) {
                    const cards = Array.isArray(data?.cards) ? data.cards : [];
                    statsGrid.innerHTML = '';

                    if (!cards.length) {
                        statsGrid.innerHTML = '<div class="col-span-full text-center text-white/80 py-6">Belum ada data statistik.</div>';
                    } else {
                        cards.forEach((card, index) => {
                            const cardEl = document.createElement('div');
                            cardEl.className = 'stat-card bg-white/10 backdrop-blur rounded-xl p-5';
                            cardEl.setAttribute('data-aos', 'fade-up');
                            cardEl.setAttribute('data-aos-delay', String(index * 100));

                            if (card.icon) {
                                const img = document.createElement('img');
                                img.src = card.icon;
                                img.alt = card.label || 'Statistik';
                                img.className = 'w-16 h-16 rounded-full shadow-lg mb-4 object-cover';
                                cardEl.appendChild(img);
                            }

                            const label = document.createElement('span');
                            label.className = 'block text-sm uppercase text-white/70 tracking-wide';
                            label.textContent = card.label || 'Statistik';
                            cardEl.appendChild(label);

                            const value = document.createElement('span');
                            value.className = 'text-3xl font-extrabold mt-2';
                            const number = Number(card.value ?? 0);
                            value.textContent = Number.isFinite(number) ? number.toLocaleString('id-ID') : String(card.value ?? '0');
                            cardEl.appendChild(value);

                            statsGrid.appendChild(cardEl);
                        });
                    }
                }

                const charts = data?.charts || {};
                Object.keys(chartMeta).forEach((key) => {
                    const meta = chartMeta[key];
                    const chartData = charts[key];
                    const headingEl = document.querySelector(meta.headingSelector);
                    if (chartData && chartData.title && headingEl) headingEl.textContent = chartData.title;

                    const entries = Array.isArray(chartData?.entries) ? chartData.entries : [];
                    if (!entries.length) {
                        const container = document.querySelector(meta.elementId);
                        if (container) container.innerHTML = '<p class="text-center text-white/70 text-sm pt-6">Belum ada data.</p>';
                        return;
                    }

                    const color = chartData.color || meta.defaultColor;
                    const height = Number(chartData.height) || meta.defaultHeight;
                    renderAreaChart(meta.elementId, entries, color, height);
                });

                if (typeof AOS !== 'undefined') AOS.refreshHard();
            })
            .catch((error) => {
                console.error(error);
                if (statsGrid) statsGrid.innerHTML = '<div class="col-span-full text-center text-white/80 py-6">Terjadi kesalahan saat memuat statistik.</div>';
            });
    };

    const loadTestimonials = () => {
        const swiperContainer = document.querySelector('[data-testimonial-swiper]');
        const wrapper = document.querySelector('[data-testimonial-wrapper]');
        if (!swiperContainer || !wrapper) return;

        wrapper.innerHTML = '<div class="swiper-slide"><div class="testimonial-card text-gray-400">Memuat testimoni...</div></div>';

        fetch('data/testimonials.json', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Gagal memuat testimoni');
                return response.json();
            })
            .then((data) => {
                const entries = Array.isArray(data?.entries) ? data.entries : [];
                wrapper.innerHTML = '';

                if (!entries.length) {
                    wrapper.innerHTML = '<div class="swiper-slide"><div class="testimonial-card text-gray-400">Belum ada testimoni.</div></div>';
                } else {
                    entries.forEach((item, index) => {
                        const slide = document.createElement('div');
                        slide.className = 'swiper-slide';

                        const card = document.createElement('div');
                        card.className = 'testimonial-card';
                        card.setAttribute('data-aos', 'fade-up');
                        card.setAttribute('data-aos-delay', String(index * 100));

                        const quote = document.createElement('p');
                        quote.className = 'testimonial-text';
                        quote.textContent = '"' + (item.quote || '') + '"';
                        card.appendChild(quote);

                        const authorWrap = document.createElement('div');
                        authorWrap.className = 'testimonial-author';

                        const textWrap = document.createElement('div');
                        const nameEl = document.createElement('p');
                        nameEl.className = 'author-name';
                        nameEl.textContent = item.name || 'UMKM';
                        textWrap.appendChild(nameEl);

                        if (item.role) {
                            const roleEl = document.createElement('p');
                            roleEl.className = 'author-role';
                            roleEl.textContent = item.role;
                            textWrap.appendChild(roleEl);
                        }

                        authorWrap.appendChild(textWrap);
                        card.appendChild(authorWrap);
                        slide.appendChild(card);
                        wrapper.appendChild(slide);
                    });
                }

                if (testimonialSwiper) testimonialSwiper.destroy(true, true);

                if (typeof Swiper !== 'undefined') {
                    testimonialSwiper = new Swiper('.testimonial-swiper', {
                        loop: true,
                        speed: 700,
                        autoHeight: true,
                        autoplay: { delay: 6000, disableOnInteraction: false },
                        pagination: { el: '.testimonial-swiper .swiper-pagination', clickable: true }
                    });
                }

                if (typeof AOS !== 'undefined') AOS.refreshHard();
            })
            .catch((error) => {
                console.error(error);
                wrapper.innerHTML = '<div class="swiper-slide"><div class="testimonial-card text-rose-500">Terjadi kesalahan saat memuat testimoni.</div></div>';
            });
    };

    const loadPartners = () => {
        const desktopContainer = document.querySelector('[data-partner-desktop]');
        const marqueeContainer = document.querySelector('[data-partner-marquee]');
        if (!desktopContainer && !marqueeContainer) return;

        if (desktopContainer) desktopContainer.innerHTML = '<p class="text-gray-400 text-sm">Memuat mitra & kolaborator...</p>';
        if (marqueeContainer) marqueeContainer.innerHTML = '<p class="text-gray-400 text-sm">Memuat mitra & kolaborator...</p>';

        const createNode = (partner) => {
            const img = document.createElement('img');
            img.src = partner.logo || '';
            img.alt = partner.name || 'Mitra';
            img.className = 'partner-logo';

            if (partner.url) {
                const anchor = document.createElement('a');
                anchor.href = partner.url;
                anchor.target = partner.url.startsWith('http') ? '_blank' : '_self';
                anchor.rel = 'noopener noreferrer';
                anchor.appendChild(img);
                return anchor;
            }

            return img;
        };

        fetch('data/partners.json', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Gagal memuat mitra');
                return response.json();
            })
            .then((data) => {
                const entries = Array.isArray(data?.entries) ? data.entries : [];

                if (desktopContainer) {
                    desktopContainer.innerHTML = '';
                    if (!entries.length) {
                        desktopContainer.innerHTML = '<p class="text-gray-400 text-sm">Belum ada mitra terdaftar.</p>';
                    } else {
                        entries.forEach((partner) => desktopContainer.appendChild(createNode(partner)));
                    }
                }

                if (marqueeContainer) {
                    marqueeContainer.innerHTML = '';
                    if (!entries.length) {
                        marqueeContainer.innerHTML = '<p class="text-gray-400 text-sm">Belum ada mitra terdaftar.</p>';
                    } else {
                        const loops = entries.length < 6 ? 2 : 1;
                        for (let i = 0; i < loops; i += 1) {
                            entries.forEach((partner) => marqueeContainer.appendChild(createNode(partner)));
                        }
                    }
                }
            })
            .catch((error) => {
                console.error(error);
                if (desktopContainer) desktopContainer.innerHTML = '<p class="text-rose-500 text-sm">Terjadi kesalahan saat memuat mitra.</p>';
                if (marqueeContainer) marqueeContainer.innerHTML = '<p class="text-rose-500 text-sm">Terjadi kesalahan saat memuat mitra.</p>';
            });
    };

    const loadNews = () => {
        const newsGrid = document.querySelector('[data-news-grid]');
        if (!newsGrid) return;

        fetch('data/news.json', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Gagal memuat berita');
                return response.json();
            })
            .then((data) => {
                const entries = Array.isArray(data?.entries) ? data.entries : [];
                newsGrid.innerHTML = '';

                if (!entries.length) {
                    newsGrid.innerHTML = '<p class="col-span-full text-center text-gray-400">Belum ada berita untuk ditampilkan.</p>';
                    return;
                }

                entries.forEach((item, index) => {
                    const article = document.createElement('article');
                    article.className = 'news-card';
                    article.setAttribute('data-aos', 'fade-up');
                    article.setAttribute('data-aos-delay', String(index * 100));

                    if (item.image) {
                        const img = document.createElement('img');
                        img.className = 'news-image';
                        img.src = item.image;
                        img.alt = item.title || 'Berita';
                        article.appendChild(img);
                    }

                    const body = document.createElement('div');
                    body.className = 'news-body';

                    const tag = document.createElement('span');
                    tag.className = 'news-tag';
                    tag.textContent = item.tag || 'Berita';
                    body.appendChild(tag);

                    const title = document.createElement('h3');
                    title.className = 'news-title';
                    title.textContent = item.title || 'Judul Berita';
                    body.appendChild(title);

                    const excerpt = document.createElement('p');
                    excerpt.className = 'news-text';
                    excerpt.textContent = item.excerpt || '';
                    body.appendChild(excerpt);

                    if (item.link) {
                        const link = document.createElement('a');
                        link.href = item.link;
                        link.className = 'inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:text-primary/80';
                        link.target = item.link.startsWith('http') ? '_blank' : '_self';
                        link.rel = 'noopener noreferrer';
                        link.innerHTML = 'Baca selengkapnya <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3"></path></svg>';
                        body.appendChild(link);
                    }

                    article.appendChild(body);
                newsGrid.appendChild(article);
                });

                if (typeof AOS !== 'undefined') AOS.refreshHard();
            })
            .catch((error) => {
                console.error(error);
                newsGrid.innerHTML = '<p class="col-span-full text-center text-rose-500">Terjadi kesalahan saat memuat berita.</p>';
            });
    };

    loadStatistics();
    loadTestimonials();
    loadPartners();
    loadNews();

    const peranCarousel = document.getElementById('peran-carousel');
    const prevButton = document.getElementById('peran-prev');
    const nextButton = document.getElementById('peran-next');
    let peranIndex = 0;

    const updatePeranCarousel = () => {
        if (!peranCarousel) return;
        const cards = peranCarousel.querySelectorAll('.peran-card');
        if (!cards.length) return;
        const cardWidth = cards[0].getBoundingClientRect().width;
        const computed = window.getComputedStyle(peranCarousel);
        const gapValue = computed.getPropertyValue('gap') || computed.getPropertyValue('column-gap') || '24';
        const gap = parseFloat(gapValue) || 24;
        peranCarousel.style.transform = 'translateX(-' + peranIndex * (cardWidth + gap) + 'px)';
    };

    prevButton?.addEventListener('click', () => {
        peranIndex = Math.max(0, peranIndex - 1);
        updatePeranCarousel();
    });

    nextButton?.addEventListener('click', () => {
        if (!peranCarousel) return;
        const cards = peranCarousel.querySelectorAll('.peran-card');
        const maxIndex = Math.max(0, cards.length - 1);
        peranIndex = Math.min(maxIndex, peranIndex + 1);
        updatePeranCarousel();
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(() => {
            updatePeranCarousel();
            resizeCharts();
        });
    });

    updatePeranCarousel();
    resizeCharts();
});
