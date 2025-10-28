document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-events-list]');
    if (!container) {
        return;
    }

    const BADGE_CLASSES = {
        primary: 'inline-flex w-max items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary',
        secondary: 'inline-flex w-max items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary',
        accent: 'inline-flex w-max items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent'
    };

    const ICONS = {
        calendar: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" /></svg>',
        clock: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>',
        location: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m17.657 16.657-4.242 4.243a1.5 1.5 0 0 1-2.122 0l-4.243-4.243a8 8 0 1 1 10.607 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>',
        check: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m4.5 12.75 6 6 9-13.5" /></svg>'
    };

    const createInfoItem = (iconKey, text) => {
        if (!text) return null;
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2';

        const iconType = ICONS[iconKey] ? iconKey : 'check';
        const iconWrapper = document.createElement('span');
        iconWrapper.innerHTML = ICONS[iconType];
        li.appendChild(iconWrapper.firstChild);

        const textNode = document.createElement('span');
        textNode.className = 'text-gray-600 text-sm leading-relaxed';
        textNode.textContent = text;
        li.appendChild(textNode);
        return li;
    };

    container.innerHTML = '<p class="text-center text-gray-400 col-span-full py-10">Memuat jadwal acara terbaru...</p>';

    fetch('data/events.json', { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Gagal memuat data event');
            }
            return response.json();
        })
        .then((data) => {
            const entries = Array.isArray(data?.entries) ? data.entries : [];
            container.innerHTML = '';

            if (!entries.length) {
                container.innerHTML = '<p class="text-center text-gray-400 col-span-full py-10">Belum ada jadwal event yang tersedia saat ini.</p>';
                return;
            }

            entries.forEach((item, index) => {
                const article = document.createElement('article');
                article.className = 'h-full rounded-3xl border border-primary/10 bg-white shadow-xl p-8 flex flex-col gap-6 hover:shadow-2xl transition';
                article.setAttribute('data-aos', 'fade-up');
                article.setAttribute('data-aos-delay', String(index * 100));

                const header = document.createElement('div');
                header.className = 'flex flex-col gap-3';

                const badge = document.createElement('span');
                const badgeTheme = BADGE_CLASSES[item.badge] || BADGE_CLASSES.primary;
                badge.className = badgeTheme;
                badge.textContent = item.badge_label || item.badge || 'Event';
                header.appendChild(badge);

                const title = document.createElement('h2');
                title.className = 'text-2xl font-bold text-primary';
                title.textContent = item.title || 'Event Rumah BUMN';
                header.appendChild(title);

                if (item.description) {
                    const desc = document.createElement('p');
                    desc.className = 'text-gray-600 leading-relaxed';
                    desc.textContent = item.description;
                    header.appendChild(desc);
                }

                article.appendChild(header);

                const detailsList = document.createElement('ul');
                detailsList.className = 'text-sm text-gray-600 space-y-2';

                const structuredItems = [];
                if (item.schedule_date) {
                    structuredItems.push(createInfoItem('calendar', item.schedule_date));
                }
                if (item.schedule_time) {
                    structuredItems.push(createInfoItem('clock', item.schedule_time));
                }
                if (item.location) {
                    structuredItems.push(createInfoItem('location', item.location));
                }
                const highlights = Array.isArray(item.highlights) ? item.highlights : [];
                if (highlights.length) {
                    highlights.forEach((highlight) => {
                        structuredItems.push(createInfoItem('check', highlight));
                    });
                }

                // Fallback untuk data lama yang masih memakai item.details
                if (!structuredItems.length) {
                    const legacyDetails = Array.isArray(item.details) ? item.details : [];
                    legacyDetails.forEach((detail) => {
                        const legacyItem = createInfoItem(detail?.icon, detail?.text);
                        if (legacyItem) structuredItems.push(legacyItem);
                    });
                }

                if (structuredItems.length) {
                    structuredItems.forEach((li) => {
                        if (li) detailsList.appendChild(li);
                    });
                } else {
                    const emptyRow = document.createElement('li');
                    emptyRow.className = 'text-gray-400 text-sm';
                    emptyRow.textContent = 'Detail event belum diatur.';
                    detailsList.appendChild(emptyRow);
                }

                article.appendChild(detailsList);

                const footer = document.createElement('div');
                footer.className = 'mt-auto';

                const link = document.createElement('a');
                link.className = 'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/20 transition hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white';
                link.href = item.link || '#';
                const isExternal = typeof item.link === 'string' && item.link.startsWith('http');
                if (isExternal) {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
                link.innerHTML = `${item.link_label || 'Daftar Sekarang'} <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>`;
                footer.appendChild(link);

                article.appendChild(footer);
                container.appendChild(article);
            });

            if (typeof AOS !== 'undefined') {
                AOS.refreshHard();
            }
        })
        .catch((error) => {
            console.error(error);
            container.innerHTML = '<p class="text-center text-rose-500 col-span-full py-10">Terjadi kesalahan saat memuat jadwal event. Silakan coba lagi.</p>';
        });
});
