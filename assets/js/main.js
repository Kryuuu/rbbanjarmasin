document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('nav-toggle');
    const navDropdown = document.getElementById('nav-dropdown');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navDropdown) {
        const body = document.body;
        const menuIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/></svg>`;
        const closeIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M6 18L18 6"/></svg>`;
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
            if (open) {
                navDropdown.style.maxHeight = `${navDropdown.scrollHeight}px`;
            } else {
                navDropdown.style.maxHeight = '0px';
            }
            body.classList.toggle('overflow-hidden', open);
        };

        navToggle.innerHTML = menuIcon;
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-controls', 'nav-dropdown');

        navToggle.addEventListener('click', () => {
            setNavState(!isNavOpen);
        });

        navDropdown.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                setNavState(false);
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                if (isNavOpen) {
                    setNavState(false);
                }
            } else if (isNavOpen) {
                navDropdown.style.maxHeight = `${navDropdown.scrollHeight}px`;
            }
        });
    }

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinks.forEach((link) => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
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
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.hero-swiper .swiper-pagination',
                clickable: true
            }
        });

        new Swiper('.testimonial-swiper', {
            loop: true,
            speed: 700,
            autoHeight: true,
            autoplay: {
                delay: 6000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.testimonial-swiper .swiper-pagination',
                clickable: true
            }
        });
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({
            once: true,
            offset: 120,
            duration: 700,
            easing: 'ease-out-cubic'
        });
    }

    const chartInstances = [];
    const resizeCharts = () => {
        if (!chartInstances.length) return;

        chartInstances.forEach(({ chart, baseHeight }) => {
            chart.updateOptions(
                {
                    chart: { height: baseHeight }
                },
                false,
                true
            );
        });
    };

    if (typeof ApexCharts !== 'undefined') {
        const chartConfigs = [
            { selector: '#chart-digital', color: '#4FC3F7', height: 320, series: [210, 280, 410, 520], years: ['2021', '2022', '2023', '2024'] },
            { selector: '#chart-modern', color: '#A78BFA', height: 260, series: [180, 260, 340, 460], years: ['2021', '2022', '2023', '2024'] },
            { selector: '#chart-online', color: '#34D399', height: 260, series: [90, 180, 260, 335], years: ['2021', '2022', '2023', '2024'] }
        ];

        chartConfigs.forEach(({ selector, color, series, years, height }) => {
            const element = document.querySelector(selector);
            if (!element) return;

            const chartOptions = {
                chart: {
                    type: 'area',
                    height,
                    toolbar: { show: false },
                    background: 'transparent',
                    foreColor: '#DCEEFF'
                },
                series: [{ name: 'Jumlah UMKM', data: series }],
                xaxis: {
                    categories: years,
                    title: { text: 'Tahun', style: { color: '#F2FAFF' } },
                    labels: { style: { colors: Array(years.length).fill('#E5F5FF') } },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    title: { text: 'Jumlah', style: { color: '#F2FAFF' } },
                    labels: { style: { colors: '#E5F5FF' } }
                },
                grid: {
                    borderColor: 'rgba(255, 255, 255, 0.16)',
                    strokeDashArray: 5,
                    xaxis: { lines: { show: false } }
                },
                stroke: {
                    width: 3,
                    curve: 'smooth'
                },
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 0.8,
                        opacityFrom: 0.45,
                        opacityTo: 0.05,
                        stops: [0, 90, 100]
                    }
                },
                markers: {
                    size: 0,
                    strokeColors: '#ffffff',
                    strokeWidth: 2,
                    hover: { sizeOffset: 4 }
                },
                dataLabels: { enabled: false },
                colors: [color],
                tooltip: {
                    theme: 'dark',
                    x: { show: false }
                },
                theme: { mode: 'dark' }
            };

            const chart = new ApexCharts(element, chartOptions);
            chart.render();

            chartInstances.push({
                chart,
                baseHeight: height
            });
        });

        resizeCharts();
    }

    const newsGrid = document.querySelector('[data-news-grid]');
    if (newsGrid) {
        const buildCard = (item, index) => {
            const article = document.createElement('article');
            article.className = 'news-card';
            article.setAttribute('data-aos', 'fade-up');
            article.setAttribute('data-aos-delay', String(index * 100));

            const image = document.createElement('img');
            image.className = 'news-image';
            image.src = item.image || '';
            image.alt = item.title || 'Berita';
            article.appendChild(image);

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
            return article;
        };

        fetch('data/news.json', { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Gagal memuat berita');
                }
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
                    newsGrid.appendChild(buildCard(item, index));
                });
                if (typeof AOS !== 'undefined') {
                    AOS.refreshHard();
                }
            })
            .catch((error) => {
                console.error(error);
                newsGrid.innerHTML = '<p class="col-span-full text-center text-rose-500">Terjadi kesalahan saat memuat berita.</p>';
            });
    }

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
        const offset = peranIndex * (cardWidth + gap);
        peranCarousel.style.transform = `translateX(-${offset}px)`;
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

    
const marquee = document.querySelector('.partner-marquee');
    if (marquee && marquee.children.length < 16) {
        const clones = Array.from(marquee.children).map((node) => node.cloneNode(true));
        clones.forEach((clone) => marquee.appendChild(clone));
    }
});



