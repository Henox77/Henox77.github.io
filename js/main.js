/* ============================================================
   MAIN — Theme toggle, Lenis smooth scroll, page loader, nav
   ============================================================ */

(function () {
  'use strict';  /* ---------- Clean, Fast & Lightweight Core Loaded ---------- */
  const html = document.documentElement;
  const THEME_KEY = 'ukr-portfolio-theme';

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  html.setAttribute('data-theme', savedTheme);

  const toggle = document.getElementById('themeToggle');
  const sweepCircle = document.getElementById('themeSweepCircle');

  if (toggle && sweepCircle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      // Position sweep circle
      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      sweepCircle.style.left = x + 'px';
      sweepCircle.style.top = y + 'px';
      sweepCircle.style.background = next === 'light' ? '#f8f9fa' : '#0a0714';
      
      sweepCircle.style.transition = 'none';
      sweepCircle.style.transform = 'translate(-50%, -50%) scale(0)';
      sweepCircle.style.opacity = '1';
      void sweepCircle.offsetWidth; // force reflow
      
      sweepCircle.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      sweepCircle.style.transform = 'translate(-50%, -50%) scale(3000)';
      
      setTimeout(() => {
        html.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        window.dispatchEvent(new Event('theme-change'));
      }, 300);
      
      setTimeout(() => {
        sweepCircle.style.transition = 'opacity 0.3s ease';
        sweepCircle.style.opacity = '0';
      }, 600);
    });
  } else if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
      window.dispatchEvent(new Event('theme-change'));
    });
  }


  /* ============================================================
     2. LENIS SKEW & GSAP LETTER-BY-LETTER REVEAL
     ============================================================ */
  /* Scroll skew disabled for lag-free rendering */

  // Letter by Letter scroll reveal on headings
  function initLetterByLetterReveal() {
    const headings = document.querySelectorAll('.section-title');
    headings.forEach(heading => {
      // Don't process if already split
      if (heading.querySelector('.char-span')) return;
      
      const splitNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const chars = node.textContent.split('');
          const fragment = document.createDocumentFragment();
          chars.forEach(char => {
            const span = document.createElement('span');
            span.className = 'char-span';
            span.style.display = 'inline-block';
            span.style.transformOrigin = 'center bottom';
            span.style.whiteSpace = char === ' ' ? 'pre' : 'normal';
            span.textContent = char;
            fragment.appendChild(span);
          });
          node.parentNode.replaceChild(fragment, node);
        } else {
          const children = Array.from(node.childNodes);
          children.forEach(child => splitNode(child));
        }
      };
      
      splitNode(heading);
      const chars = heading.querySelectorAll('.char-span');
      
      gsap.fromTo(chars, 
        { 
          opacity: 0, 
          y: 35, 
          rotateX: -45, 
          scale: 0.9 
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.015,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    });
  }
  initLetterByLetterReveal();


  /* ============================================================
     3. HORIZONTAL DRAG-MOMENTUM CAROUSEL
     ============================================================ */
  function initProjectsCarousel() {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    let velX = 0;
    let momentumID;
    let lastX = 0;
    
    grid.addEventListener('mousedown', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      
      isDown = true;
      grid.classList.add('active');
      startX = e.pageX - grid.offsetLeft;
      scrollLeft = grid.scrollLeft;
      velX = 0;
      cancelAnimationFrame(momentumID);
    });
    
    grid.addEventListener('mouseleave', () => {
      if (!isDown) return;
      isDown = false;
      grid.classList.remove('active');
      beginMomentumScroll();
    });
    
    grid.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      grid.classList.remove('active');
      beginMomentumScroll();
    });
    
    grid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - grid.offsetLeft;
      const walk = (x - startX) * 1.5;
      grid.scrollLeft = scrollLeft - walk;
      
      velX = x - lastX;
      lastX = x;
    });

    // Touch events for drag-momentum
    grid.addEventListener('touchstart', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      isDown = true;
      startX = e.touches[0].pageX - grid.offsetLeft;
      scrollLeft = grid.scrollLeft;
      velX = 0;
      cancelAnimationFrame(momentumID);
    }, { passive: true });

    grid.addEventListener('touchend', () => {
      isDown = false;
      beginMomentumScroll();
    });

    grid.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - grid.offsetLeft;
      const walk = (x - startX) * 1.2;
      grid.scrollLeft = scrollLeft - walk;
      velX = x - lastX;
      lastX = x;
    }, { passive: true });
    
    function beginMomentumScroll() {
      if (Math.abs(velX) < 0.5) return;
      grid.scrollLeft -= velX;
      velX *= 0.95; // Friction
      momentumID = requestAnimationFrame(beginMomentumScroll);
    }
  }
  initProjectsCarousel();


  /* ============================================================
     4. GLOBAL COMMAND PALETTE SEARCH & TRIGGER LOGIC
     ============================================================ */
  function initCommandPalette() {
    const palette = document.getElementById('cmdPalette');
    const searchInput = document.getElementById('cmdPaletteSearch');
    const listContainer = document.getElementById('cmdPaletteList');
    const overlay = document.getElementById('cmdPaletteOverlay');
    
    if (!palette || !searchInput || !listContainer) return;
    
    let isOpen = false;
    let filteredCommands = [];
    let activeIndex = 0;
    
    const scrollToSection = (selector) => {
      const target = document.querySelector(selector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      closePalette();
    };
    
    const openCaseStudy = (projectId) => {
      closePalette();
      const btn = document.querySelector(`.btn-case-study[data-project="${projectId}"]`);
      if (btn) btn.click();
    };
    
    const commands = [
      { id: 'home', title: 'Go to Home', category: 'Navigation', icon: 'home', action: () => scrollToSection('#hero') },
      { id: 'about', title: 'Go to About', category: 'Navigation', icon: 'user', action: () => scrollToSection('#about') },
      { id: 'experience', title: 'Go to Experience', category: 'Navigation', icon: 'briefcase', action: () => scrollToSection('#experience') },
      { id: 'projects', title: 'Go to Projects', category: 'Navigation', icon: 'folder', action: () => scrollToSection('#projects') },
      { id: 'skills', title: 'Go to Skills', category: 'Navigation', icon: 'cpu', action: () => scrollToSection('#skills') },
      { id: 'contact', title: 'Go to Contact', category: 'Navigation', icon: 'mail', action: () => scrollToSection('#contact') },
      
      { id: 'case-sap', title: 'View Case Study: SAP Integration Tracker', category: 'Case Studies', icon: 'file-text', action: () => openCaseStudy('sap-tracker') },
      { id: 'case-inbox', title: 'View Case Study: L2 Escalation Portal', category: 'Case Studies', icon: 'file-text', action: () => openCaseStudy('client-inbox-tracker') },
      { id: 'case-satellite', title: 'View Case Study: Satellite Crop Classification', category: 'Case Studies', icon: 'file-text', action: () => openCaseStudy('satellite-crop') },
      { id: 'case-cityflo', title: 'View Case Study: CityFlo BI Dashboards', category: 'Case Studies', icon: 'file-text', action: () => openCaseStudy('cityflo-bi') },
      
      { id: 'toggle-theme', title: 'Toggle Theme (Dark / Light)', category: 'Actions', icon: 'sun', action: () => document.getElementById('themeToggle')?.click() },
      { id: 'download-resume', title: 'Open Resume PDF', category: 'Actions', icon: 'download', action: () => window.open('assets/resume.pdf', '_blank') }
    ];
    
    function openPalette() {
      isOpen = true;
      palette.style.display = 'flex';
      palette.setAttribute('aria-hidden', 'false');
      gsap.to(overlay, { opacity: 1, duration: 0.25 });
      gsap.fromTo('.cmd-palette-wrapper', { y: -30, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' });
      
      if (window.lenis) window.lenis.stop();
      searchInput.value = '';
      filterCommands('');
      setTimeout(() => searchInput.focus(), 50);
    }
    
    function closePalette() {
      isOpen = false;
      if (window.lenis) window.lenis.start();
      gsap.to('.cmd-palette-wrapper', { y: -20, scale: 0.97, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => {
        palette.style.display = 'none';
        palette.setAttribute('aria-hidden', 'true');
      }});
      gsap.to(overlay, { opacity: 0, duration: 0.2 });
    }
    
    function filterCommands(query) {
      const q = query.toLowerCase().trim();
      if (!q) {
        filteredCommands = [...commands];
      } else {
        filteredCommands = commands.filter(cmd => 
          cmd.title.toLowerCase().includes(q) || 
          cmd.category.toLowerCase().includes(q)
        );
      }
      activeIndex = 0;
      renderCommands();
    }
    
    function renderCommands() {
      listContainer.innerHTML = '';
      if (filteredCommands.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 0.9rem;">No results found.</div>';
        return;
      }
      
      const categories = {};
      filteredCommands.forEach((cmd, index) => {
        if (!categories[cmd.category]) {
          categories[cmd.category] = [];
        }
        categories[cmd.category].push({ cmd, index });
      });
      
      Object.keys(categories).forEach(cat => {
        const groupTitle = document.createElement('div');
        groupTitle.className = 'cmd-palette-group-title';
        groupTitle.textContent = cat;
        listContainer.appendChild(groupTitle);
        
        categories[cat].forEach(({ cmd, index }) => {
          const item = document.createElement('div');
          item.className = `cmd-palette-item ${index === activeIndex ? 'active' : ''}`;
          item.setAttribute('data-index', index);
          
          item.innerHTML = `
            <div class="cmd-palette-item-left">
              <span class="cmd-palette-item-icon"><i data-lucide="${cmd.icon}" style="width:16px; height:16px"></i></span>
              <span class="cmd-palette-item-title">${cmd.title}</span>
            </div>
            <span class="cmd-palette-item-shortcut">Action</span>
          `;
          
          item.addEventListener('mouseenter', () => {
            activeIndex = index;
            updateActiveItem();
          });
          
          item.addEventListener('click', () => {
            cmd.action();
          });
          
          listContainer.appendChild(item);
        });
      });
      
      if (window.lucide) {
        window.lucide.createIcons({ node: listContainer });
      }
    }
    
    function updateActiveItem() {
      const items = listContainer.querySelectorAll('.cmd-palette-item');
      items.forEach(item => {
        const index = parseInt(item.getAttribute('data-index'), 10);
        if (index === activeIndex) {
          item.classList.add('active');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('active');
        }
      });
    }
    
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % filteredCommands.length;
        updateActiveItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + filteredCommands.length) % filteredCommands.length;
        updateActiveItem();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });
    
    searchInput.addEventListener('input', (e) => {
      filterCommands(e.target.value);
    });
    
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          closePalette();
        } else {
          openPalette();
        }
      }
    });
    
    overlay.addEventListener('click', closePalette);
  }
  initCommandPalette();

  /* ---------- Smooth anchor scrolling ---------- */
  let isAnchorScrolling = false;
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        if (isAnchorScrolling) return;
        isAnchorScrolling = true;

        // Instantly resolve character animations to prevent stuck wavy baseline text
        if (window.gsap) {
          window.gsap.set('.reveal-char', { opacity: 1, y: '0%', rotateX: 0 });
        }

        target.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { isAnchorScrolling = false; }, 500);
      }
    });
  });

  /* ---------- Page Loader ---------- */
  function runLoader() {
    const loader = document.getElementById('pageLoader');
    const loaderName = document.getElementById('loaderName');
    const loaderBar = document.getElementById('loaderBar');

    if (!loader) {
      window.initAnimations();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(loader, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            // Fire animations after loader
            window.initAnimations();
            // Re-init lucide icons (deferred script, safe to call after DOM ready)
            if (window.lucide) window.lucide.createIcons();
          }
        });
      }
    });

    tl.to(loaderName, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    })
    .to(loaderBar, {
      width: '100%',
      duration: 0.8,
      ease: 'power2.inOut'
    }, '-=0.3')
    .to(loaderName, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: 'power2.in'
    }, '+=0.1');
  }

  /* ---------- Scroll to Top Button ---------- */
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Project Category Filters ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length > 0 && projectCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class on buttons
        filterBtns.forEach(b => {
          b.classList.remove('active');
        });
        
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        
        // Get Flip state
        const state = Flip.getState(projectCards);
        
        projectCards.forEach(card => {
          const category = card.getAttribute('data-category');
          
          // Kill active tweens to prevent layout stutter
          gsap.killTweensOf(card);
          
          if (filterValue === 'all' || category === filterValue) {
            // Clear the display style
            card.style.display = '';
          } else {
            // Hide card
            card.style.display = 'none';
          }
        });

        // Run Flip transition
        Flip.from(state, {
          duration: 0.5,
          ease: 'power2.out',
          absolute: true,
          onComplete: () => ScrollTrigger.refresh()
        });
      });
    });
  }

  // Ensure Lucide icons render reliably
  const refreshIcons = () => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  };
  refreshIcons();
  window.addEventListener('load', refreshIcons);

  /* ---------- Discord Lanyard RPC & Spotify Integration ---------- */
  function initLanyard() {
    const DEFAULT_DISCORD_ID = localStorage.getItem('henox_discord_id') || '1462496241693753558';
    let currentDiscordId = DEFAULT_DISCORD_ID;
    let socket = null;
    let heartbeatInterval = null;
    let spotifyProgressTimer = null;

    const elements = {
      card: document.getElementById('lanyardCard'),
      avatar: document.getElementById('lanyardAvatar'),
      statusDot: document.getElementById('lanyardStatusDot'),
      username: document.getElementById('lanyardUsername'),
      tag: document.getElementById('lanyardTag'),
      customStatus: document.getElementById('lanyardCustomStatus'),
      spotifyBox: document.getElementById('lanyardSpotifyBox'),
      spotifyAlbum: document.getElementById('lanyardSpotifyAlbum'),
      spotifyTrack: document.getElementById('lanyardSpotifyTrack'),
      spotifyArtist: document.getElementById('lanyardSpotifyArtist'),
      spotifyBar: document.getElementById('lanyardSpotifyBar'),
      changeIdBtn: document.getElementById('lanyardChangeIdBtn')
    };

    if (!elements.avatar) return;

    if (elements.changeIdBtn) {
      elements.changeIdBtn.addEventListener('click', () => {
        const newId = prompt("Discord User ID'ni (Snowflake) gir:", currentDiscordId);
        if (newId && newId.trim()) {
          currentDiscordId = newId.trim();
          localStorage.setItem('henox_discord_id', currentDiscordId);
          connectWebSocket();
        }
      });
    }

    function updateUI(data) {
      if (!data) return;
      const user = data.discord_user;
      const status = data.discord_status || 'offline';

      // Avatar & Identity
      if (user) {
        if (elements.username) elements.username.textContent = user.global_name || user.username || 'Henox';
        if (elements.tag) elements.tag.textContent = `@${user.username}`;

        if (user.avatar) {
          elements.avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
        } else {
          elements.avatar.src = `https://cdn.discordapp.com/embed/avatars/0.png`;
        }
      }

      // Status Dot
      if (elements.statusDot) {
        elements.statusDot.className = 'lanyard-status-dot status-' + status;
        elements.statusDot.title = `Discord Status: ${status.toUpperCase()}`;
      }

      // Custom Status
      let customStatusText = 'Discord RPC Active';
      if (data.activities && data.activities.length > 0) {
        const customAct = data.activities.find(a => a.type === 4);
        if (customAct) {
          let emojiHTML = '';
          if (customAct.emoji) {
            if (customAct.emoji.id) {
              emojiHTML = `<img src="https://cdn.discordapp.com/emojis/${customAct.emoji.id}.png" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;">`;
            } else if (customAct.emoji.name) {
              emojiHTML = customAct.emoji.name + ' ';
            }
          }
          customStatusText = `${emojiHTML}${customAct.state || ''}`;
        } else {
          const gameAct = data.activities.find(a => a.type === 0);
          if (gameAct) {
            customStatusText = `Oynuyor: ${gameAct.name}`;
          }
        }
      }
      if (elements.customStatus) {
        elements.customStatus.innerHTML = customStatusText || 'Hypercord Client Developer';
      }

      // Enhanced Spotify Activity Parser
      let spotifyData = data.spotify;
      let spotifyActivity = (data.activities || []).find(a => a.name === 'Spotify' || a.type === 2);

      if (!spotifyData && spotifyActivity) {
        let albumArtUrl = '';
        if (spotifyActivity.assets && spotifyActivity.assets.large_image) {
          const imgId = spotifyActivity.assets.large_image.replace('spotify:', '');
          albumArtUrl = `https://i.scdn.co/image/${imgId}`;
        }
        spotifyData = {
          song: spotifyActivity.details || 'Spotify Music',
          artist: spotifyActivity.state || '',
          album: spotifyActivity.assets ? spotifyActivity.assets.large_text : '',
          album_art_url: albumArtUrl,
          timestamps: spotifyActivity.timestamps || null
        };
      }

      if (spotifyData && (data.listening_to_spotify || spotifyActivity)) {
        if (elements.spotifyBox) elements.spotifyBox.style.display = 'flex';
        let imgUrl = spotifyData.album_art_url;
        if (!imgUrl && spotifyData.album_art_id) {
          imgUrl = `https://i.scdn.co/image/${spotifyData.album_art_id}`;
        }
        if (elements.spotifyAlbum && imgUrl) {
          elements.spotifyAlbum.src = imgUrl;
          elements.spotifyAlbum.style.display = 'block';
        }
        if (elements.spotifyTrack) elements.spotifyTrack.textContent = spotifyData.song || 'Spotify Track';
        if (elements.spotifyArtist) elements.spotifyArtist.textContent = spotifyData.artist ? `by ${spotifyData.artist}` : '';

        if (spotifyProgressTimer) clearInterval(spotifyProgressTimer);
        if (spotifyData.timestamps && spotifyData.timestamps.start && spotifyData.timestamps.end) {
          const start = spotifyData.timestamps.start;
          const end = spotifyData.timestamps.end;
          const totalDuration = end - start;

          const updateBar = () => {
            const now = Date.now();
            const elapsed = now - start;
            const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            if (elements.spotifyBar) elements.spotifyBar.style.width = `${pct}%`;
          };

          updateBar();
          spotifyProgressTimer = setInterval(updateBar, 1000);
        } else {
          if (elements.spotifyBar) elements.spotifyBar.style.width = '100%';
        }
      } else {
        if (elements.spotifyBox) elements.spotifyBox.style.display = 'none';
        if (spotifyProgressTimer) clearInterval(spotifyProgressTimer);
      }
    }

    function connectWebSocket() {
      if (socket) {
        try { socket.close(); } catch (_) {}
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);

      // REST fetch fallback for fast render
      fetch(`https://api.lanyard.rest/v1/users/${currentDiscordId}`)
        .then(r => r.json())
        .then(res => {
          if (res && res.success && res.data) {
            updateUI(res.data);
          }
        })
        .catch(err => console.log('Lanyard REST error:', err));

      // Connect WebSocket
      try {
        socket = new WebSocket('wss://api.lanyard.rest/socket');
        socket.onopen = () => {
          socket.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: currentDiscordId }
          }));
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.op === 1) {
              const heartbeatMs = msg.d.heartbeat_interval;
              heartbeatInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ op: 3 }));
                }
              }, heartbeatMs);
            } else if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
              updateUI(msg.d);
            }
          } catch (e) {}
        };

        socket.onclose = () => {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          setTimeout(connectWebSocket, 10000);
        };
      } catch (e) {}
    }

    connectWebSocket();
  }

  /* ---------- TR / EN Internationalization Engine ---------- */
  const i18nData = {
    tr: {
      'nav.home': 'Ana Sayfa',
      'nav.about': 'Hakkımda',
      'nav.projects': 'Projeler',
      'nav.skills': 'Yetenekler',
      'nav.contact': 'İletişim',
      'hero.greeting': 'Merhaba, Ben',
      'hero.subtitle': 'Yazılım geliştiriciyim. <strong><a href="https://hypercord.pro" target="_blank" style="color:var(--accent-light); text-decoration:underline;">Hypercord (hypercord.pro)</a></strong> projesinin kurucusuyum. Discord modları, temalar ve web projeleri geliştiriyorum.',
      'hero.availability': 'Hypercord Geliştiriliyor · henox.me',
      'hero.cta.work': 'Projeleri İncele →',
      'hero.cta.hypercord': 'Hypercord.pro Ziyaret Et',
      'hero.cta.contact': 'İletişime Geç →',
      'about.label': 'Hakkımda',
      'about.title': 'Hypercord\'un geliştiricisiyim — Discord modları ve web projeleri geliştiriyorum.',
      'about.bio.badge': 'Biyografi',
      'about.bio.title': 'Yazılım Geliştirici & Hypercord Kurucusu',
      'about.bio.p1': 'Ben Henox (<a href="https://henox.me" style="color:var(--accent-light);">henox.me</a>). Açık kaynaklı Discord istemci modu <strong><a href="https://hypercord.pro" target="_blank" style="color:var(--accent-light);">Hypercord (hypercord.pro)</a></strong> projesinin kurucusuyum.',
      'about.bio.p2': 'Projelerimde genelde <strong>HTML, CSS, JavaScript, PHP, Laravel, Python, Node.js, React, Next.js, Vite, ASP.NET Core, Tailwind CSS, Docker</strong> ve <strong>PostgreSQL</strong> kullanıyorum.',
      'lanyard.badge': 'Discord Durumu',
      'spotify.label': 'Spotify\'da Dinliyor',
      'projects.label': 'Projeler & Üretimler',
      'projects.title': 'Geliştirdiğim <span class="accent-text">Projeler.</span>',
      'projects.subtitle': 'Geliştirdiğim projeler ve üzerinde çalıştığım araçlar.',
      'filter.all': 'Tüm Projeler',
      'filter.flagship': 'Amiral Gemi Mod',
      'filter.discord': 'Discord Araçları',
      'filter.web': 'Web & API',
      'hypercord.category': 'Açık Kaynaklı Discord İstemci Modu',
      'hypercord.title': 'Hypercord (hypercord.pro)',
      'hypercord.desc': 'Geliştirdiğim açık kaynaklı Discord istemci modu. Özel rozetler, temalar ve eklentiler yüklemenizi sağlar.',
      'hypercord.bullet1': 'Özel profil rozetleri, CSS temaları ve eklenti desteği.',
      'hypercord.bullet2': 'Hızlı, hafif ve düşük kaynak kullanımı.',
      'hypercord.btn.website': 'Resmi Web Sitesi (hypercord.pro) ↗',
      'hypercord.btn.github': 'GitHub Profili (Henox77) ↗',
      'lanyard.category': 'Tam Donanımlı Entegrasyon',
      'lanyard.title': 'Lanyard Canlı RPC & Spotify Kartı',
      'lanyard.desc': 'Canlı Discord durumu ve Spotify müzik çalar entegrasyonu.',
      'lanyard.btn.view': 'Yukarıdaki Kartı Gör ↑',
      'skills.label': 'Yetenekler & Teknolojiler',
      'skills.title': 'Teknoloji <span class="accent-text">Yığınım.</span>',
      'skills.subtitle': 'Kullandığım diller, kütüphaneler ve araçlar.',
      'skills.cat.frontend': 'Frontend Teknolojileri',
      'skills.cat.backend': 'Backend & API Sistemleri',
      'skills.cat.database': 'Veritabanı & DevOps',
      'contact.label': 'İletişime Geç',
      'contact.title': 'İletişime <span class="accent-text">Geç.</span>',
      'contact.subtitle': 'Sorularınız, proje fikirleriniz veya geri bildirimleriniz için e-posta atabilirsiniz.',
      'contact.email.label': 'E-posta',
      'contact.project.label': 'Hypercord Projesi',
      'contact.github.label': 'GitHub',
      'footer.builtby': 'Henox (henox.me) · 2026'
    },
    en: {
      'nav.home': 'Home',
      'nav.about': 'About',
      'nav.projects': 'Projects',
      'nav.skills': 'Skills',
      'nav.contact': 'Contact',
      'hero.greeting': "Hello, I'm",
      'hero.subtitle': 'Software developer & founder of <strong><a href="https://hypercord.pro" target="_blank" style="color:var(--accent-light); text-decoration:underline;">Hypercord (hypercord.pro)</a></strong>. Building Discord mods, custom themes, and web apps.',
      'hero.availability': 'Building Hypercord · henox.me',
      'hero.cta.work': 'View Projects →',
      'hero.cta.hypercord': 'Visit Hypercord.pro',
      'hero.cta.contact': 'Get in Touch →',
      'about.label': 'About Me',
      'about.title': 'Developer of Hypercord — building Discord client mods and web projects.',
      'about.bio.badge': 'Biography',
      'about.bio.title': 'Software Developer & Founder of Hypercord',
      'about.bio.p1': 'I am Henox (<a href="https://henox.me" style="color:var(--accent-light);">henox.me</a>), creator and lead developer of <strong><a href="https://hypercord.pro" target="_blank" style="color:var(--accent-light);">Hypercord (hypercord.pro)</a></strong> — an open-source custom Discord client modification.',
      'about.bio.p2': 'I regularly work with <strong>HTML, CSS, JavaScript, PHP, Laravel, Python, Node.js, React, Next.js, Vite, ASP.NET Core, Tailwind CSS, Docker,</strong> and <strong>PostgreSQL</strong>.',
      'lanyard.badge': 'Discord Status',
      'spotify.label': 'Listening to Spotify',
      'projects.label': 'Projects',
      'projects.title': 'Projects I\'ve <span class="accent-text">built.</span>',
      'projects.subtitle': 'Projects I\'ve built and tools I\'m working on.',
      'filter.all': 'All',
      'filter.flagship': 'Flagship Client Mod',
      'filter.discord': 'Discord Tools',
      'filter.web': 'Web & API',
      'hypercord.category': 'Open-Source Discord Client Mod',
      'hypercord.title': 'Hypercord (hypercord.pro)',
      'hypercord.desc': 'Open-source Discord client mod I built. Allows adding custom badges, themes, and plugins.',
      'hypercord.bullet1': 'Custom profile badges, CSS themes, and plugin support.',
      'hypercord.bullet2': 'Fast, lightweight architecture with low RAM usage.',
      'hypercord.btn.website': 'Official Website (hypercord.pro) ↗',
      'hypercord.btn.github': 'GitHub Profile (Henox77) ↗',
      'skills.label': 'Skills & Tools',
      'skills.title': 'Tech <span class="accent-text">Stack.</span>',
      'skills.subtitle': 'Languages, frameworks, and tools I use.',
      'skills.cat.frontend': 'Frontend Technologies',
      'skills.cat.backend': 'Backend & API Systems',
      'skills.cat.database': 'Database & DevOps',
      'contact.label': 'Contact',
      'contact.title': 'Get in <span class="accent-text">Touch.</span>',
      'contact.subtitle': 'Feel free to send an email for questions, project ideas, or feedback.',
      'contact.email.label': 'Email',
      'contact.project.label': 'Hypercord Project',
      'contact.github.label': 'GitHub',
      'footer.builtby': 'Henox (henox.me) · 2026'
    }
  };

  function initLanguageSwitcher() {
    let currentLang = localStorage.getItem('henox_lang') || 'tr';
    const langBtn = document.getElementById('langToggle');
    const langLabel = document.getElementById('langLabel');

    function applyLanguage(lang) {
      currentLang = lang;
      localStorage.setItem('henox_lang', lang);
      if (langLabel) langLabel.textContent = lang.toUpperCase();

      const dict = i18nData[lang] || i18nData.tr;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
          el.innerHTML = dict[key];
        }
      });
    }

    if (langBtn) {
      langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const nextLang = currentLang === 'tr' ? 'en' : 'tr';
        applyLanguage(nextLang);
      });
    }

    applyLanguage(currentLang);
  }

  function dismissLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.style.transition = 'opacity 0.25s ease';
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        if (window.initAnimations) window.initAnimations();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }, 250);
    }
  }

  /* ---------- Ultra-Smooth GPU-Accelerated Custom Cursor ---------- */
  function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    document.body.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX, dotY = mouseY;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function renderCursor() {
      dotX += (mouseX - dotX) * 0.35;
      dotY += (mouseY - dotY) * 0.35;
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    const bindHover = (el) => {
      el.addEventListener('mouseenter', () => {
        dot.classList.add('hovering');
        ring.classList.add('hovering');
      });
      el.addEventListener('mouseleave', () => {
        dot.classList.remove('hovering');
        ring.classList.remove('hovering');
      });
    };

    document.querySelectorAll('a, button, .btn, .project-card, .bento-card, .filter-btn, .nav-link, .contact-link').forEach(bindHover);

    window.addEventListener('mousedown', () => dot.classList.add('clicking'));
    window.addEventListener('mouseup', () => dot.classList.remove('clicking'));
  }

  /* ---------- Tactile Synth Audio Feedback (Hover & Click) ---------- */
  class TactileSynth {
    constructor() { this.ctx = null; }
    init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
    }
    playHover() {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.025);
      gain.gain.setValueAtTime(0.018, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.025);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }
    playClick() {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }
  const synth = new TactileSynth();

  // Attach hover sound listeners
  const bindAudioEvents = () => {
    document.querySelectorAll('a, button, .btn, .project-card, .bento-card, .filter-btn, .nav-link, .contact-link, .theme-toggle, .lang-toggle, .skill-tag').forEach(el => {
      if (el.dataset.audioBound) return;
      el.dataset.audioBound = 'true';
      el.addEventListener('mouseenter', () => synth.playHover(), { passive: true });
    });
  };

  bindAudioEvents();
  window.addEventListener('DOMContentLoaded', bindAudioEvents);

  // Click sound listener
  document.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .btn, .project-card, .filter-btn, .nav-link, .contact-link, .lang-toggle, .theme-toggle, .skill-tag')) {
      synth.playClick();
    }
  }, { passive: true });

  /* ---------- Live Footer Clock ---------- */
  function initFooterClock() {
    const clockVal = document.getElementById('sessionTimerValue');
    if (!clockVal) return;
    const updateClock = () => {
      const now = new Date();
      clockVal.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ---------- Run Everything ---------- */
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      initLanyard();
      initLanguageSwitcher();
      initCustomCursor();
      initFooterClock();
      dismissLoader();
    });
  } else {
    initLanyard();
    initLanguageSwitcher();
    initCustomCursor();
    initFooterClock();
    dismissLoader();
  }

})();
