/*!
 * HTA Assistant — on-site help bot for honeytreatacademy.com
 * Replaces the Tawk.to widget. No third-party scripts, no tracking.
 * Include once per page, just before </body>:
 *   <script src="hta-bot.js" defer></script>
 *
 * To edit answers, centres or courses, change the CONFIG / CENTRES / TRACKS
 * blocks below. Nothing else needs touching.
 */
(function () {
  'use strict';
  if (window.__htaBotLoaded) return;
  window.__htaBotLoaded = true;

  /* ------------------------------------------------------------------
   * 1. SETTINGS
   * ---------------------------------------------------------------- */
  var CONFIG = {
    botName: 'HTA Assistant',
    phone: '+2348073342278',
    phoneDisplay: '+234-807-334-2278',
    email: 'contact@honeytreatacademy.com',
    whatsapp: '',               // e.g. '2348073342278' to show a "Chat on WhatsApp" option
    community: 'https://chat.whatsapp.com/IYuxshSL3nLK2MAzeVy0af?mode=gi_t',
    handoffEndpoint: 'https://formspree.io/f/xeevpblr', // "Ask the team" messages go here
    coursesPage: 'courses.html',
    hours: '9 AM to 6 PM',
    greetBubbleDelayMs: 9000,    // small "Need help?" bubble; set 0 to disable
    storageKey: 'htaBot.v1'
  };

  /* Centre labels MUST match the labels used by the enrolment modal on courses.html */
  var CENTRES = {
    akilo:     { label: 'Akilo Centre (Lagos)',        area: 'Lagos',  address: '',  phone: '+234-807-334-2278', tracks: ['construction'] },
    abuleegba: { label: 'Abule Egba Centre (Lagos)',   area: 'Lagos',  address: 'No. 17, Oguntade Street, Orile Agege, Lagos', phone: '+234-807-334-2278', tracks: ['construction', 'agriculture', 'digital'] },
    tijani:    { label: 'Tijani Bello Centre (Lagos)', area: 'Lagos',  address: '19, Tijani Bello, behind Jendol Supermarket, Ojodu Berger, Lagos', phone: '+234-811-382-9658', tracks: ['digital'] },
    magodo:    { label: 'Magodo Centre (Lagos)',       area: 'Lagos',  address: '9A Bankole Street, Isheri, Magodo Phase 1, Lagos', phone: '+234-813-361-7719', tracks: ['digital', 'entertainment'] },
    osogbo:    { label: 'Osogbo Centre (Osun)',        area: 'Osun',   address: 'Old Ojuolape shopping complex, Ayetoro, off Osogbo/Offa express, Osogbo', phone: '+234-807-334-2278', tracks: ['construction', 'agriculture', 'digital'] },
    monatan:   { label: 'Monatan Centre (Ibadan)',     area: 'Ibadan', address: 'Honeytreat Skill Centre building, opposite 7Up, Monatan, off Iwo Road, Ibadan', phone: '+234-805-907-6272', tracks: ['construction', 'agriculture', 'digital'] },
    abuja:     { label: 'Abuja Centre (Abuja)',        area: 'Abuja',  address: '', phone: '+234-807-334-2278', tracks: ['construction'] }
  };

  var TRACKS = {
    construction: {
      title: 'Construction Skills', enrollName: 'Construction Skills', anchor: 'courses.html#construction',
      blurb: 'Hands-on, BOSCH-certified training in the most in-demand building trades.',
      centres: ['akilo', 'abuleegba', 'osogbo', 'monatan', 'abuja'],
      courses: [
        ['Plumbing & Pipe Fitting', 6, ['plumbing', 'plumber', 'pipe', 'pipe fitting', 'water supply']],
        ['Electrical Wiring & Installation', 8, ['electrical', 'electrician', 'wiring', 'electric']],
        ['Carpentry & Joinery / Furniture Making', 8, ['carpentry', 'carpenter', 'joinery', 'furniture', 'roofing']],
        ['Masonry & Bricklaying', 6, ['masonry', 'mason', 'bricklaying', 'block work', 'plastering']],
        ['Tiling & Flooring', 4, ['tiling', 'tiles', 'tiler', 'flooring', 'screeding']],
        ['Painting & Decoration', 4, ['painting', 'painter', 'decoration', 'decorative']],
        ['Welding & Fabrication', 0, ['welding', 'welder', 'fabrication']],
        ['Construction Site Management', 0, ['site management', 'site manager']]
      ],
      words: ['construction', 'building', 'builder', 'trade', 'trades', 'artisan', 'plumbing', 'plumber', 'pipe', 'electrical', 'electrician', 'wiring', 'carpentry', 'carpenter', 'joinery', 'furniture', 'masonry', 'mason', 'bricklaying', 'tiling', 'tiles', 'tiler', 'painting', 'painter', 'welding', 'welder', 'fabrication', 'roofing', 'plastering']
    },
    agriculture: {
      title: 'Agripreneur Skills', enrollName: 'Agripreneur Skills', anchor: 'courses.html#agriculture',
      blurb: 'Modern farming that combines science, technology and business to make agriculture profitable.',
      centres: ['abuleegba', 'osogbo', 'monatan'],
      courses: [
        ['Fish Farming (Aquaculture)', 8, ['fish', 'catfish', 'aquaculture', 'pond']],
        ['Snail Farming', 0, ['snail']],
        ['Poultry Farming', 6, ['poultry', 'chicken', 'broiler', 'layers', 'birds']],
        ['Crop Production', 10, ['crop', 'crops', 'planting', 'soil']],
        ['Agribusiness Management', 6, ['agribusiness', 'agric business']],
        ['Agrotech & Digital Agriculture', 0, ['agrotech', 'agritech', 'digital agriculture']],
        ['Post-Harvest Technology & Value Addition', 0, ['post harvest', 'post-harvest', 'processing', 'value addition']]
      ],
      words: ['agriculture', 'agric', 'agro', 'agripreneur', 'farming', 'farm', 'farmer', 'fish', 'catfish', 'aquaculture', 'snail', 'poultry', 'chicken', 'crop', 'crops', 'agribusiness', 'agrotech', 'agritech', 'livestock']
    },
    digital: {
      title: 'Digital Skills', enrollName: 'Digital Skills', anchor: 'courses.html#digital',
      blurb: 'Job-ready tech skills for the digital economy — no prior experience needed.',
      centres: ['tijani', 'magodo', 'abuleegba', 'osogbo', 'monatan'],
      courses: [
        ['Data Analytics (Excel, Python, Power BI)', 10, ['data', 'analytics', 'analyst', 'excel', 'python', 'power bi', 'sql']],
        ['Web Development', 12, ['web', 'website', 'frontend', 'front end', 'html', 'css', 'javascript']],
        ['Software Engineering / Development', 0, ['software', 'programming', 'coding', 'developer', 'code']],
        ['Digital Marketing', 8, ['marketing', 'digital marketing', 'seo', 'social media', 'ads']],
        ['Graphic Design', 6, ['graphic', 'graphics', 'design', 'canva', 'photoshop', 'coreldraw']],
        ['Project Management', 0, ['project management', 'project manager']],
        ['Virtual Assistance', 4, ['virtual assistant', 'virtual assistance', 'remote work']],
        ['Cybersecurity Basics', 8, ['cyber', 'cybersecurity', 'security', 'hacking']]
      ],
      words: ['digital', 'tech', 'technology', 'computer', 'ict', 'data', 'analytics', 'analyst', 'excel', 'python', 'web', 'website', 'software', 'programming', 'coding', 'developer', 'marketing', 'seo', 'graphic', 'graphics', 'design', 'canva', 'photoshop', 'cyber', 'cybersecurity', 'frontend', 'virtual']
    },
    entertainment: {
      title: 'Entertainment Skills', enrollName: 'Entertainment Skills', anchor: 'courses.html#entertainment',
      blurb: 'Turn your creative passion into a profession, with training at our Magodo studio centre.',
      centres: ['magodo'],
      courses: [
        ['Music Production', 8, ['music', 'beat', 'beats', 'producer', 'mixing', 'mastering', 'daw']],
        ['Live Sound Engineering', 0, ['sound', 'audio', 'live sound', 'sound engineering']],
        ['Digital Mixing Console', 0, ['mixing console', 'console', 'mixer']],
        ['Videography & Cinematography', 8, ['video', 'videography', 'cinematography', 'film', 'filmmaking']],
        ['Video Editing', 0, ['editing', 'video editing', 'editor']],
        ['Photography', 6, ['photo', 'photography', 'photographer', 'camera']],
        ['Event Coverage', 4, ['event coverage', 'live streaming', 'streaming', 'content creation']]
      ],
      words: ['entertainment', 'creative', 'music', 'sound', 'audio', 'video', 'videography', 'cinematography', 'film', 'photo', 'photography', 'photographer', 'camera', 'editing', 'streaming', 'studio']
    }
  };
  var TRACK_ORDER = ['construction', 'agriculture', 'digital', 'entertainment'];

  var CITY_WORDS = {
    lagos: 'Lagos', agege: 'Lagos', ojodu: 'Lagos', berger: 'Lagos', magodo: 'Lagos', isheri: 'Lagos', ikeja: 'Lagos', ogba: 'Lagos', akilo: 'Lagos', 'abule egba': 'Lagos',
    ibadan: 'Ibadan', oyo: 'Ibadan', monatan: 'Ibadan', iwo: 'Ibadan',
    osun: 'Osun', osogbo: 'Osun', oshogbo: 'Osun',
    abuja: 'Abuja', fct: 'Abuja'
  };

  /* ------------------------------------------------------------------
   * 2. INTENTS  (keywords -> handler).  Multi-word phrases score higher.
   * ---------------------------------------------------------------- */
  var INTENTS = [
    { id: 'enroll', words: ['enrol', 'enroll', 'enrolment', 'enrollment', 'register', 'registration', 'sign up', 'signup', 'apply', 'application', 'admission', 'join a class', 'join the class', 'get started', 'start now', 'book a slot', 'how do i join', 'i want to join', 'enrol me', 'sign me up'] },
    { id: 'fees', words: ['fee', 'fees', 'price', 'prices', 'cost', 'costs', 'how much', 'tuition', 'amount', 'naira', 'afford', 'expensive', 'cheap', 'installment', 'instalment', 'payment', 'pay', 'charge'] },
    { id: 'scholarship', words: ['free', 'scholarship', 'sponsor', 'sponsored', 'sponsorship', 'grant', 'funded', 'funding', 'discount', 'promo'] },
    { id: 'centres', words: ['centre', 'center', 'centres', 'centers', 'branch', 'branches', 'location', 'locations', 'located', 'address', 'where', 'near me', 'close to me', 'nearest', 'office', 'direction', 'directions', 'map'] },
    { id: 'duration', words: ['how long', 'duration', 'weeks', 'months', 'length', 'how many weeks', 'how many months', 'timeframe'] },
    { id: 'schedule', words: ['start date', 'when does', 'when is', 'next class', 'next batch', 'next intake', 'resumption', 'resume', 'intake', 'schedule', 'timetable', 'weekend', 'weekends', 'evening', 'cohort', 'batch', 'class time', 'class days'] },
    { id: 'hours', words: ['opening hours', 'open', 'opening', 'close', 'closing', 'working hours', 'office hours', 'what time'] },
    { id: 'cert', words: ['certificate', 'certificates', 'certification', 'certified', 'accredited', 'accreditation', 'recognised', 'recognized', 'nbte', 'bosch', 'lsetf', 'niob', 'aosh', 'city and guilds'] },
    { id: 'online', words: ['online', 'remote', 'virtual class', 'zoom', 'from home', 'distance learning', 'e-learning', 'elearning'] },
    { id: 'requirements', words: ['requirement', 'requirements', 'qualification', 'qualifications', 'prerequisite', 'experience', 'beginner', 'no experience', 'age', 'how old', 'waec', 'degree', 'laptop', 'what do i need', 'eligible', 'eligibility'] },
    { id: 'corporate', words: ['corporate', 'company', 'companies', 'staff training', 'organisation', 'organization', 'team training', 'employees', 'workforce', 'csr', 'partnership', 'partner with'] },
    { id: 'jobs', words: ['job', 'jobs', 'placement', 'employment', 'employed', 'career', 'careers', 'hire', 'hiring', 'internship', 'work after', 'get work', 'own business', 'start a business'] },
    { id: 'contact', words: ['contact', 'phone', 'call', 'number', 'email', 'talk to', 'speak to', 'human', 'agent', 'person', 'staff', 'customer care', 'customer service', 'support', 'whatsapp', 'reach you'] },
    { id: 'community', words: ['community', 'alumni', 'whatsapp group', 'graduates', 'group chat'] },
    { id: 'testimonials', words: ['testimonial', 'testimonials', 'review', 'reviews', 'success story', 'success stories', 'stories'] },
    { id: 'about', words: ['about', 'who are you', 'what is hta', 'honeytreat', 'history', 'mission', 'vision', 'founded'] },
    { id: 'courses', words: ['course', 'courses', 'program', 'programs', 'programme', 'programmes', 'training', 'trainings', 'learn', 'skill', 'skills', 'offer', 'track', 'tracks', 'what do you teach', 'what can i learn', 'class', 'classes'] },
    { id: 'greeting', words: ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening', 'how far', 'bawo', 'sannu', 'kedu', 'greetings'] },
    { id: 'thanks', words: ['thank', 'thanks', 'thank you', 'appreciate', 'great', 'ok thanks', 'alright'] },
    { id: 'bye', words: ['bye', 'goodbye', 'see you', 'later', 'good night'] }
  ];

  /* ------------------------------------------------------------------
   * 3. TEXT HELPERS
   * ---------------------------------------------------------------- */
  function norm(s) {
    return (' ' + String(s || '').toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9₦&+\-\s]/g, ' ')
      .replace(/\s+/g, ' ') + ' ');
  }
  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function lev1(a, b) { // true when edit distance <= 1
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return diff + (la - i) + (lb - j) <= 1;
  }
  function tokens(n) {
    return n.trim().split(' ').filter(Boolean).map(stem);
  }
  function scoreWords(n, toks, words) {
    var score = 0;
    for (var k = 0; k < words.length; k++) {
      var w = words[k].toLowerCase();
      if (w.indexOf(' ') > -1) {
        if (n.indexOf(' ' + w + ' ') > -1) score += 2.5;
        continue;
      }
      var sw = stem(w);
      for (var t = 0; t < toks.length; t++) {
        if (toks[t] === sw) { score += 1; break; }
        if (sw.length >= 5 && toks[t].length >= 5 && lev1(toks[t], sw)) { score += 0.8; break; }
      }
    }
    return score;
  }
  function detectTrack(n, toks) {
    var best = null, bestScore = 0;
    for (var i = 0; i < TRACK_ORDER.length; i++) {
      var key = TRACK_ORDER[i];
      var s = scoreWords(n, toks, TRACKS[key].words);
      if (key === 'agriculture' && n.indexOf(' crop production ') > -1) s += 3;
      if (s > bestScore) { bestScore = s; best = key; }
    }
    return best;
  }
  function detectCourse(n, toks) {
    var best = null, bestScore = 0;
    TRACK_ORDER.forEach(function (key) {
      TRACKS[key].courses.forEach(function (c) {
        var s = scoreWords(n, toks, c[2]);
        if (s > bestScore) { bestScore = s; best = { track: key, name: c[0], weeks: c[1] }; }
      });
    });
    return bestScore >= 1 ? best : null;
  }
  function detectCity(n) {
    for (var w in CITY_WORDS) {
      if (n.indexOf(' ' + w + ' ') > -1) return CITY_WORDS[w];
    }
    return null;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Tiny, safe formatter for bot-authored text: **bold**, [label](url), new lines, "• " bullets.
  function fmt(text) {
    var h = esc(text);
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\(((?:https?:\/\/|tel:|mailto:|[a-z0-9\-]+\.html)[^)\s]*)\)/gi, function (_, label, url) {
      var ext = /^https?:/i.test(url) && url.indexOf(location.host) === -1;
      return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
    });
    return h.replace(/\n/g, '<br>');
  }
  function telHref(p) { return 'tel:' + p.replace(/[^+\d]/g, ''); }

  /* ------------------------------------------------------------------
   * 4. ANSWERS
   * ---------------------------------------------------------------- */
  var state = { open: false, track: null, misses: 0, lastQuestion: '', msgs: [] };

  function trackChips(prefix) {
    return TRACK_ORDER.map(function (k) {
      return { label: (prefix || '') + TRACKS[k].title.replace(' Skills', ''), act: (prefix ? 'enroll:' : 'track:') + k };
    });
  }
  var MAIN_CHIPS = [
    { label: 'Explore courses', act: 'say:What courses do you offer?' },
    { label: 'Find a centre', act: 'say:Where are your centres?' },
    { label: 'Enrol now', act: 'say:I want to enrol' },
    { label: 'Fees & payment', act: 'say:How much are the fees?' },
    { label: 'Talk to our team', act: 'handoff' }
  ];

  function centreLine(key) {
    var c = CENTRES[key];
    var name = c.label.replace(/\s*\(.*\)/, '');
    var addr = c.address ? c.address + ' · ' : 'call for directions: ';
    return '• **' + name + '** (' + c.area + ') — ' + addr + '[' + c.phone + '](' + telHref(c.phone) + ')';
  }
  function courseLines(key) {
    return TRACKS[key].courses.map(function (c) {
      return '• ' + c[0] + (c[1] ? ' — ' + c[1] + ' weeks' : '');
    }).join('\n');
  }
  function trackCentreNames(key) {
    return TRACKS[key].centres.map(function (c) { return CENTRES[c].label; }).join(', ');
  }

  function answerTrack(key) {
    var t = TRACKS[key];
    state.track = key;
    return {
      text: '**' + t.title + '** — ' + t.blurb + '\n\nCourses include:\n' + courseLines(key) +
        '\n\n**Available at:** ' + trackCentreNames(key) + '.',
      chips: [
        { label: 'Enrol in ' + t.title.replace(' Skills', ''), act: 'enroll:' + key },
        { label: 'Centres & addresses', act: 'say:Where can I learn ' + t.title.toLowerCase() + '?' },
        { label: 'Fees', act: 'say:How much does it cost?' },
        { label: 'Full details', act: 'link:' + t.anchor }
      ]
    };
  }

  function answerCentres(track, city) {
    var keys = Object.keys(CENTRES);
    if (track) keys = keys.filter(function (k) { return CENTRES[k].tracks.indexOf(track) > -1; });
    if (city) {
      var inCity = keys.filter(function (k) { return CENTRES[k].area === city; });
      if (inCity.length) keys = inCity;
      else if (track) {
        return {
          text: 'We don\'t currently offer ' + TRACKS[track].title + ' in ' + city + '. It\'s available at:\n' +
            TRACKS[track].centres.map(centreLine).join('\n'),
          chips: [{ label: 'Enrol in ' + TRACKS[track].title.replace(' Skills', ''), act: 'enroll:' + track }, { label: 'Talk to our team', act: 'handoff' }]
        };
      }
    }
    var intro = track ? TRACKS[track].title + ' is taught at:'
      : (city ? (keys.length === 1 ? 'Our centre in ' + city + ':' : 'Our ' + city + ' centres:') : 'Here are our training centres:');
    var chips = track
      ? [{ label: 'Enrol in ' + TRACKS[track].title.replace(' Skills', ''), act: 'enroll:' + track }, { label: 'Opening hours', act: 'say:What are your opening hours?' }]
      : [{ label: 'Which centre teaches what?', act: 'say:What courses do you offer?' }, { label: 'Enrol now', act: 'say:I want to enrol' }];
    return { text: intro + '\n' + keys.map(centreLine).join('\n') + '\n\nAll centres are open ' + CONFIG.hours + '.', chips: chips };
  }

  function answerDuration(track, course) {
    if (course && course.weeks) {
      state.track = course.track;
      return {
        text: '**' + course.name + '** runs for about **' + course.weeks + ' weeks**, with hands-on practice and assessment before certification.',
        chips: [{ label: 'Enrol in this track', act: 'enroll:' + course.track }, { label: 'Fees', act: 'say:How much does it cost?' }]
      };
    }
    if (track) {
      var withWeeks = TRACKS[track].courses.filter(function (c) { return c[1]; });
      return {
        text: 'Typical course lengths in ' + TRACKS[track].title + ':\n' +
          withWeeks.map(function (c) { return '• ' + c[0] + ' — ' + c[1] + ' weeks'; }).join('\n') +
          '\n\nFor courses not listed, the centre team will confirm the duration when you enrol.',
        chips: [{ label: 'Enrol in ' + TRACKS[track].title.replace(' Skills', ''), act: 'enroll:' + track }, { label: 'Next start date', act: 'say:When does the next class start?' }]
      };
    }
    return {
      text: 'Most courses run between **4 and 12 weeks** — for example Tiling is 4 weeks, Plumbing 6 weeks, Data Analytics 10 weeks and Web Development 12 weeks. Which course are you looking at?',
      chips: trackChips()
    };
  }

  function respond(raw) {
    var n = norm(raw), toks = tokens(n);
    var track = detectTrack(n, toks);
    var course = detectCourse(n, toks);
    var city = detectCity(n);
    var scores = {};
    INTENTS.forEach(function (it) { scores[it.id] = scoreWords(n, toks, it.words); });

    // Resolve the leading intent
    var order = INTENTS.map(function (i) { return i.id; });
    var top = null, topScore = 0;
    order.forEach(function (id) {
      if (scores[id] > topScore) { topScore = scores[id]; top = id; }
    });
    // "courses" / "greeting" are weak signals — a specific topic wins
    if ((top === 'courses' || top === 'greeting') && track) top = 'track';
    if (!top && track) top = 'track';
    if (!top && city) top = 'centres';
    if (top === 'hours' && scores.centres > 0 && scores.hours <= scores.centres) top = 'centres';
    var ctxTrack = track || (course && course.track) || state.track;

    if (top) state.misses = 0;

    switch (top) {
      case 'track':
        return answerTrack(track || course.track);

      case 'enroll':
        if (track || course) return doEnrollReply(track || course.track);
        if (state.track) {
          return {
            text: 'Would you like to enrol in **' + TRACKS[state.track].title + '**, or a different track?',
            chips: [{ label: 'Yes, enrol in ' + TRACKS[state.track].title.replace(' Skills', ''), act: 'enroll:' + state.track }].concat(
              trackChips('Enrol: ').filter(function (c) { return c.act !== 'enroll:' + state.track; }))
          };
        }
        return {
          text: 'Great choice! Which track would you like to enrol in? I\'ll open the enrolment form — you pick the centre closest to you and fill in your details.',
          chips: trackChips('Enrol: ')
        };

      case 'fees':
        return {
          text: 'Fees depend on the course and the centre you choose, so our team shares the current fees and payment options directly' +
            (ctxTrack ? ' for **' + TRACKS[ctxTrack].title + '**' : '') + '.\n\nThe fastest way to get them: call [' + CONFIG.phoneDisplay + '](' + telHref(CONFIG.phone) +
            '), or leave your question and the team will get back to you. Starting your enrolment also gets a centre to contact you with the full breakdown.',
          chips: [
            { label: 'Ask the team', act: 'handoff' },
            { label: 'Call now', act: 'link:' + telHref(CONFIG.phone) },
            ctxTrack ? { label: 'Enrol in ' + TRACKS[ctxTrack].title.replace(' Skills', ''), act: 'enroll:' + ctxTrack } : { label: 'Enrol now', act: 'say:I want to enrol' }
          ]
        };

      case 'scholarship':
        return {
          text: 'Sponsored and discounted places depend on the partner programmes running at the time, so the team is the best source — they\'ll tell you what\'s open right now and how to qualify.',
          chips: [{ label: 'Ask the team', act: 'handoff' }, { label: 'Call now', act: 'link:' + telHref(CONFIG.phone) }]
        };

      case 'centres':
        return answerCentres(track || (course && course.track) || null, city);

      case 'duration':
        return answerDuration(ctxTrack, course);

      case 'schedule':
        return {
          text: 'New classes open regularly at each centre. The next start date — and whether weekday or weekend classes suit you — depends on the course and centre, so the centre team confirms it when you enrol or enquire.',
          chips: [
            ctxTrack ? { label: 'Enrol in ' + TRACKS[ctxTrack].title.replace(' Skills', ''), act: 'enroll:' + ctxTrack } : { label: 'Enrol now', act: 'say:I want to enrol' },
            { label: 'Ask the team', act: 'handoff' }
          ]
        };

      case 'hours':
        return {
          text: 'Our centres are open from **' + CONFIG.hours + '**. You can reach the main line on [' + CONFIG.phoneDisplay + '](' + telHref(CONFIG.phone) + ').',
          chips: [{ label: 'Find a centre', act: 'say:Where are your centres?' }, { label: 'Talk to our team', act: 'handoff' }]
        };

      case 'cert':
        return {
          text: 'Yes — HTA programmes lead to **internationally recognised certification**, delivered with partners including LSETF, BOSCH, NBTE, NIOB and AOSH. You\'re assessed at the end of your course and certified once you pass.',
          chips: [{ label: 'Explore courses', act: 'say:What courses do you offer?' }, { label: 'Enrol now', act: 'say:I want to enrol' }]
        };

      case 'online':
        return {
          text: 'Alongside hands-on training at our centres, HTA offers **flexible online learning** you can follow from anywhere in Nigeria. Practical trades such as construction are taught on-site. Ask the team which courses are running online right now.',
          chips: [{ label: 'Ask the team', act: 'handoff' }, { label: 'Digital courses', act: 'track:digital' }]
        };

      case 'requirements':
        return {
          text: 'You can start from the basics — our digital courses need **no prior experience**, and trade courses are taught hands-on from the ground up. For anything specific (age, a laptop for digital classes, previous training), the centre team will confirm when you enrol.',
          chips: [{ label: 'Enrol now', act: 'say:I want to enrol' }, { label: 'Ask a specific question', act: 'handoff' }]
        };

      case 'corporate':
        return {
          text: 'We run **tailored training packages for organisations** — trade skills, digital skills, health & safety and soft-skills programmes for your staff. Tell us about your team and what you need, and we\'ll get back to you.',
          chips: [{ label: 'Send a request', act: 'handoff' }, { label: 'Call now', act: 'link:' + telHref(CONFIG.phone) }]
        };

      case 'jobs':
        return {
          text: 'HTA supports graduates with **job placement** through our alumni network and industry connections, and our business development training helps if you\'d rather start your own business. Many of our graduates now run their own tiling, farming and creative businesses.',
          chips: [{ label: 'Read success stories', act: 'link:testimonials.html' }, { label: 'Join the community', act: 'link:' + CONFIG.community }]
        };

      case 'contact':
        var lines = 'You can reach us here:\n• Phone: [' + CONFIG.phoneDisplay + '](' + telHref(CONFIG.phone) + ')\n• Email: [' + CONFIG.email + '](mailto:' + CONFIG.email + ')\n• Main office: 9A Bankole Street, Isheri, Magodo Phase 1, Lagos\n\nOr leave a message here and the team will reply.';
        var c = [{ label: 'Leave a message', act: 'handoff' }, { label: 'Call now', act: 'link:' + telHref(CONFIG.phone) }];
        if (CONFIG.whatsapp) c.push({ label: 'Chat on WhatsApp', act: 'link:https://wa.me/' + CONFIG.whatsapp });
        return { text: lines, chips: c };

      case 'community':
        return {
          text: 'Join the HTA community on WhatsApp to connect with students and alumni: [Join the community](' + CONFIG.community + ').',
          chips: MAIN_CHIPS.slice(0, 3)
        };

      case 'testimonials':
        return {
          text: 'Our graduates have gone on to run tiling businesses, fish farms and creative studios, and to land digital jobs. Read and watch their stories on our [Testimonials page](testimonials.html).',
          chips: MAIN_CHIPS.slice(0, 3)
        };

      case 'about':
        return {
          text: '**Honeytreat Trade Academy (HTA)** is a Nigerian vocational training institution. We\'ve trained **3,000+** people with **30+** expert instructors across construction, agriculture, digital and entertainment skills, at centres in Lagos, Ibadan, Osun and Abuja. [More about us](about.html).',
          chips: MAIN_CHIPS.slice(0, 3)
        };

      case 'courses':
        return {
          text: 'We train in four industry tracks:\n• **Construction** — plumbing, electrical, carpentry, tiling, welding and more\n• **Agriculture** — fish, snail and poultry farming, crops, agribusiness\n• **Digital** — data analytics, web & software development, digital marketing, design\n• **Entertainment** — music production, sound engineering, cinematography, photography\n\nWhich one interests you?',
          chips: trackChips()
        };

      case 'greeting':
        return { text: 'Hello! 👋 How can I help you today?', chips: MAIN_CHIPS };

      case 'thanks':
        return { text: 'You\'re welcome! Is there anything else I can help you with?', chips: MAIN_CHIPS.slice(0, 3) };

      case 'bye':
        return { text: 'Thanks for stopping by — we\'d love to train you. Take care!', chips: [] };
    }

    // Nothing matched
    state.misses++;
    state.lastQuestion = raw;
    return {
      text: state.misses > 1
        ? 'I\'m still not sure about that one. The quickest route is to send your question to our team — they\'ll reply by email or phone.'
        : 'I don\'t have an answer for that yet. I can pass your question to our team, or you can pick a topic below.',
      chips: [{ label: 'Send to the team', act: 'handoff' }].concat(MAIN_CHIPS.slice(0, 4))
    };
  }

  /* ------------------------------------------------------------------
   * 5. ENROLMENT BRIDGE — opens the existing enrolment modal on courses.html
   * ---------------------------------------------------------------- */
  function centreLabels(key) { return TRACKS[key].centres.map(function (c) { return CENTRES[c].label; }); }

  function doEnrollReply(key) {
    state.track = key;
    var t = TRACKS[key];
    var onCourses = typeof window.openEnrollModal === 'function';
    setTimeout(function () { openEnrollment(key); }, onCourses ? 700 : 1200);
    return {
      text: onCourses
        ? 'Opening the **' + t.title + '** enrolment form now. Pick the centre closest to you and fill in your details — you\'ll get a confirmation email and the centre team will contact you.'
        : 'Taking you to the **' + t.title + '** enrolment form… Pick the centre closest to you and fill in your details — you\'ll get a confirmation email and the centre team will contact you.',
      chips: []
    };
  }
  function openEnrollment(key) {
    var t = TRACKS[key];
    if (typeof window.openEnrollModal === 'function') {
      if (window.innerWidth < 640) setOpen(false);
      window.openEnrollModal(t.enrollName, centreLabels(key));
    } else {
      save();
      location.href = CONFIG.coursesPage + '#enroll=' + key;
    }
  }
  function handleEnrollHash() {
    var m = /#enroll=([a-z]+)/.exec(location.hash || '');
    if (!m || !TRACKS[m[1]] || typeof window.openEnrollModal !== 'function') return;
    var key = m[1];
    setTimeout(function () {
      if (window.innerWidth < 640) setOpen(false);
      window.openEnrollModal(TRACKS[key].enrollName, centreLabels(key));
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }, 350);
  }

  /* ------------------------------------------------------------------
   * 6. UI
   * ---------------------------------------------------------------- */
  var CSS = [
    '#hta-bot{--hb-green:var(--green-main,#2d6a4f);--hb-green-d:var(--green-dark,#1a4a2e);--hb-purple:var(--purple-main,#5c3d9e);--hb-purple-d:var(--purple-dark,#3a1f6e);--hb-pale:var(--green-pale,#d8f3dc);--hb-text:#1a2018;--hb-muted:#5f6b5a;font-family:var(--font-body,"DM Sans",system-ui,sans-serif);position:fixed;right:20px;bottom:20px;z-index:9990;line-height:1.45;color:var(--hb-text)}',
    '#hta-bot *{box-sizing:border-box}',
    '#hta-bot .hb-launch{width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(135deg,var(--hb-green),var(--hb-purple));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(58,31,110,.35);transition:transform .2s ease}',
    '#hta-bot .hb-launch:hover{transform:scale(1.06)}',
    '#hta-bot .hb-launch:focus-visible,#hta-bot button:focus-visible,#hta-bot a:focus-visible,#hta-bot input:focus-visible,#hta-bot textarea:focus-visible{outline:3px solid #f0d080;outline-offset:2px}',
    '#hta-bot .hb-launch svg{width:28px;height:28px}',
    '#hta-bot .hb-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#52b788;border:2px solid #fff}',
    '#hta-bot .hb-bubble{position:absolute;right:72px;bottom:10px;background:#fff;color:var(--hb-text);padding:.6rem .9rem;border-radius:14px 14px 4px 14px;box-shadow:0 8px 24px rgba(0,0,0,.14);font-size:.88rem;white-space:nowrap;cursor:pointer;border:0;font-family:inherit}',
    '#hta-bot .hb-bubble[hidden]{display:none}',
    '#hta-bot .hb-panel{position:absolute;right:0;bottom:76px;width:370px;max-width:calc(100vw - 32px);height:min(580px,calc(100vh - 110px));background:#fff;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;transform-origin:bottom right;animation:hbIn .22s ease}',
    '#hta-bot .hb-panel[hidden]{display:none}',
    '@keyframes hbIn{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}',
    '#hta-bot .hb-head{background:linear-gradient(135deg,var(--hb-green-d),var(--hb-purple-d));color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}',
    '#hta-bot .hb-avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;letter-spacing:.04em;flex-shrink:0}',
    '#hta-bot .hb-title{font-weight:700;font-size:.98rem;color:#fff;margin:0}',
    '#hta-bot .hb-sub{font-size:.75rem;color:rgba(255,255,255,.78);display:flex;align-items:center;gap:6px}',
    '#hta-bot .hb-sub:before{content:"";width:7px;height:7px;border-radius:50%;background:#52b788}',
    '#hta-bot .hb-x{margin-left:auto;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '#hta-bot .hb-x svg{width:16px;height:16px}',
    '#hta-bot .hb-log{flex:1;overflow-y:auto;padding:16px 14px 8px;background:#f4f7f2;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}',
    '#hta-bot .hb-msg{max-width:88%;padding:.65rem .85rem;border-radius:16px;font-size:.88rem;line-height:1.5;word-wrap:break-word}',
    '#hta-bot .hb-bot{background:#fff;border:1px solid #e2e8e4;border-bottom-left-radius:4px;align-self:flex-start;color:var(--hb-text)}',
    '#hta-bot .hb-user{background:var(--hb-green);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
    '#hta-bot .hb-msg a{color:var(--hb-purple);font-weight:600;text-decoration:underline}',
    '#hta-bot .hb-user a{color:#fff}',
    '#hta-bot .hb-msg strong{font-weight:700}',
    '#hta-bot .hb-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:100%}',
    '#hta-bot .hb-chip{border:1.5px solid var(--hb-purple);background:#fff;color:var(--hb-purple);border-radius:100px;padding:.4rem .8rem;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s,color .15s}',
    '#hta-bot .hb-chip:hover{background:var(--hb-purple);color:#fff}',
    '#hta-bot .hb-typing{display:inline-flex;gap:4px;padding:.8rem .9rem}',
    '#hta-bot .hb-typing i{width:7px;height:7px;border-radius:50%;background:#a3b1a0;animation:hbDot 1s infinite}',
    '#hta-bot .hb-typing i:nth-child(2){animation-delay:.15s}#hta-bot .hb-typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes hbDot{0%,80%,100%{opacity:.35;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}',
    '#hta-bot .hb-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #e2e8e4;background:#fff;flex-shrink:0}',
    '#hta-bot .hb-input{flex:1;min-width:0;border:1.5px solid #e2e8e4;border-radius:100px;padding:.65rem 1rem;font-size:16px;font-family:inherit;color:var(--hb-text);background:#fafaf8}',
    '#hta-bot .hb-input:focus{outline:none;border-color:var(--hb-green);background:#fff}',
    '#hta-bot .hb-send{width:42px;height:42px;border-radius:50%;border:0;background:var(--hb-green);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#hta-bot .hb-send:disabled{opacity:.5;cursor:default}',
    '#hta-bot .hb-send svg{width:18px;height:18px}',
    '#hta-bot .hb-foot{font-size:.68rem;color:var(--hb-muted);text-align:center;padding:0 12px 8px;background:#fff}',
    '#hta-bot .hb-hand{background:#fff;border:1px solid #e2e8e4;border-radius:16px;padding:12px;align-self:stretch;display:flex;flex-direction:column;gap:8px}',
    '#hta-bot .hb-hand label{font-size:.75rem;font-weight:600;color:var(--hb-text)}',
    '#hta-bot .hb-hand input,#hta-bot .hb-hand textarea{width:100%;border:1.5px solid #e2e8e4;border-radius:10px;padding:.55rem .75rem;font-size:16px;font-family:inherit;color:var(--hb-text);background:#fafaf8;resize:vertical}',
    '#hta-bot .hb-hand input:focus,#hta-bot .hb-hand textarea:focus{outline:none;border-color:var(--hb-green);background:#fff}',
    '#hta-bot .hb-hand .hb-row{display:flex;gap:8px}',
    '#hta-bot .hb-btn{border:0;border-radius:100px;padding:.6rem 1rem;font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;background:var(--hb-green);color:#fff}',
    '#hta-bot .hb-btn.hb-ghost{background:#eef2ec;color:var(--hb-text)}',
    '#hta-bot .hb-err{color:#b3261e;font-size:.78rem}',
    '@media (max-width:480px){#hta-bot{right:14px;bottom:14px}#hta-bot .hb-panel{position:fixed;right:8px;left:8px;bottom:84px;width:auto;max-width:none;height:calc(100vh - 100px);height:calc(100dvh - 100px)}#hta-bot .hb-bubble{display:none}}',
    '@media (prefers-reduced-motion:reduce){#hta-bot .hb-panel,#hta-bot .hb-typing i{animation:none}#hta-bot .hb-launch{transition:none}}',
    '@media print{#hta-bot{display:none}}'
  ].join('');

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';

  var root, panel, log, input, sendBtn, launch, bubble;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build() {
    var style = el('style');
    style.id = 'hta-bot-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    root = el('div');
    root.id = 'hta-bot';

    panel = el('div', 'hb-panel');
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', CONFIG.botName);

    var head = el('div', 'hb-head',
      '<div class="hb-avatar" aria-hidden="true">HTA</div>' +
      '<div><div class="hb-title">' + esc(CONFIG.botName) + '</div><div class="hb-sub">Courses, centres &amp; enrolment help</div></div>');
    var x = el('button', 'hb-x', ICON_X);
    x.type = 'button';
    x.setAttribute('aria-label', 'Close chat');
    x.addEventListener('click', function () { setOpen(false); launch.focus(); });
    head.appendChild(x);

    log = el('div', 'hb-log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-relevant', 'additions');

    var form = el('form', 'hb-form');
    form.setAttribute('autocomplete', 'off');
    input = el('input', 'hb-input');
    input.type = 'text';
    input.placeholder = 'Type your question…';
    input.maxLength = 400;
    input.setAttribute('aria-label', 'Type your question');
    sendBtn = el('button', 'hb-send', ICON_SEND);
    sendBtn.type = 'submit';
    sendBtn.setAttribute('aria-label', 'Send');
    form.appendChild(input);
    form.appendChild(sendBtn);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      userSays(v);
    });

    var foot = el('div', 'hb-foot', 'Need a person? Call <a href="' + telHref(CONFIG.phone) + '" style="color:inherit;text-decoration:underline">' + esc(CONFIG.phoneDisplay) + '</a>');

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    panel.appendChild(foot);

    launch = el('button', 'hb-launch', ICON_CHAT + '<span class="hb-dot" aria-hidden="true"></span>');
    launch.type = 'button';
    launch.setAttribute('aria-label', 'Chat with ' + CONFIG.botName);
    launch.setAttribute('aria-expanded', 'false');
    launch.addEventListener('click', function () { setOpen(!state.open); });

    bubble = el('button', 'hb-bubble', 'Need help choosing a course?');
    bubble.type = 'button';
    bubble.hidden = true;
    bubble.addEventListener('click', function () { setOpen(true); });

    root.appendChild(panel);
    root.appendChild(bubble);
    root.appendChild(launch);
    document.body.appendChild(root);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.open) setOpen(false);
    });
  }

  function setOpen(v) {
    state.open = v;
    panel.hidden = !v;
    bubble.hidden = true;
    launch.setAttribute('aria-expanded', String(v));
    launch.innerHTML = v ? ICON_X : ICON_CHAT;
    if (v) {
      if (!log.childNodes.length) greet();
      setTimeout(function () { input.focus({ preventScroll: true }); scrollDown(); }, 60);
    }
    save();
  }

  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function addMsg(from, text, remember) {
    var m = el('div', 'hb-msg ' + (from === 'user' ? 'hb-user' : 'hb-bot'), from === 'user' ? esc(text) : fmt(text));
    log.appendChild(m);
    if (remember !== false) {
      state.msgs.push({ f: from, t: text });
      if (state.msgs.length > 40) state.msgs = state.msgs.slice(-40);
    }
    scrollDown();
    return m;
  }

  function clearChips() {
    var old = log.querySelectorAll('.hb-chips');
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
  }

  function addChips(chips) {
    clearChips();
    state.chips = chips && chips.length ? chips : null;
    if (!state.chips) return;
    var wrap = el('div', 'hb-chips');
    chips.forEach(function (c) {
      var b = el('button', 'hb-chip');
      b.type = 'button';
      b.textContent = c.label;
      b.addEventListener('click', function () { runAction(c); });
      wrap.appendChild(b);
    });
    log.appendChild(wrap);
    scrollDown();
  }

  function runAction(c) {
    var a = c.act || '';
    if (a.indexOf('say:') === 0) return userSays(a.slice(4), c.label);
    if (a.indexOf('track:') === 0) return userSays(TRACKS[a.slice(6)].title, c.label, answerTrack(a.slice(6)));
    if (a.indexOf('enroll:') === 0) return userSays(c.label, c.label, doEnrollReply(a.slice(7)));
    if (a === 'handoff') { clearChips(); addMsg('user', c.label); return showHandoff(); }
    if (a.indexOf('link:') === 0) {
      var url = a.slice(5);
      save();
      if (/^https?:/.test(url) && url.indexOf(location.host) === -1) window.open(url, '_blank', 'noopener');
      else location.href = url;
    }
  }

  var busy = false;
  function userSays(text, shown, forced) {
    if (busy) return;
    clearChips();
    addMsg('user', shown || text);
    var reply = forced || respond(text);
    botSays(reply);
  }

  function botSays(reply) {
    busy = true;
    sendBtn.disabled = true;
    var t = el('div', 'hb-msg hb-bot hb-typing', '<i></i><i></i><i></i>');
    t.setAttribute('aria-label', 'Typing');
    log.appendChild(t);
    scrollDown();
    var delay = Math.min(1100, 350 + reply.text.length * 3);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
      addMsg('bot', reply.text);
      addChips(reply.chips);
      busy = false;
      sendBtn.disabled = false;
      save();
    }, delay);
  }

  function greet() {
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var intro = 'Hi 👋 I\'m the ' + CONFIG.botName + '. I can help you choose a course, find a centre near you and start your enrolment.';
    if (page.indexOf('courses') === 0) intro += '\n\nTell me what you\'d like to learn — for example "plumbing", "data analytics" or "fish farming".';
    else intro += '\n\nWhat would you like to do?';
    addMsg('bot', intro);
    addChips(MAIN_CHIPS);
  }

  /* ---- "Ask the team" form (sends to Formspree) ---- */
  function showHandoff() {
    var box = el('form', 'hb-hand');
    box.setAttribute('novalidate', '');
    var q = state.lastQuestion || '';
    box.innerHTML =
      '<div style="font-size:.85rem;font-weight:700">Send a message to the HTA team</div>' +
      '<div><label for="hbN">Your name</label><input id="hbN" name="name" required maxlength="80" autocomplete="name"></div>' +
      '<div><label for="hbC">Email or phone number</label><input id="hbC" name="contact" required maxlength="120" autocomplete="email"></div>' +
      '<div><label for="hbQ">Your question</label><textarea id="hbQ" name="question" rows="3" maxlength="1200" required></textarea></div>' +
      '<div class="hb-err" hidden></div>' +
      '<div class="hb-row"><button type="submit" class="hb-btn">Send message</button><button type="button" class="hb-btn hb-ghost">Cancel</button></div>';
    box.querySelector('textarea').value = q;
    log.appendChild(box);
    scrollDown();
    setTimeout(function () { box.querySelector('#hbN').focus({ preventScroll: true }); }, 50);

    var err = box.querySelector('.hb-err');
    box.querySelector('.hb-ghost').addEventListener('click', function () {
      box.parentNode.removeChild(box);
      addMsg('bot', 'No problem. Anything else I can help with?');
      addChips(MAIN_CHIPS.slice(0, 4));
    });
    box.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = box.name.value.trim(), contact = box.contact.value.trim(), question = box.question.value.trim();
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
      var isPhone = /^[+\d][\d\s\-()]{6,}$/.test(contact);
      if (!name || !question || !(isEmail || isPhone)) {
        err.hidden = false;
        err.textContent = 'Please add your name, a valid email or phone number, and your question.';
        return;
      }
      var btn = box.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      var data = new FormData();
      data.append('name', name);
      if (isEmail) { data.append('email', contact); } else { data.append('phone', contact); }
      data.append('message', question);
      data.append('source', 'Website chatbot — ' + location.pathname);
      data.append('_subject', 'HTA website chat: question from ' + name);
      fetch(CONFIG.handoffEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          box.parentNode.removeChild(box);
          state.lastQuestion = '';
          addMsg('bot', 'Thanks, ' + name.split(' ')[0] + '! Your message is with the HTA team and they\'ll get back to you shortly' + (isEmail ? ' by email.' : ' by phone.'));
          addChips(MAIN_CHIPS.slice(0, 3));
          save();
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Send message';
          err.hidden = false;
          err.innerHTML = 'That didn\'t go through. Please call <a href="' + telHref(CONFIG.phone) + '">' + esc(CONFIG.phoneDisplay) + '</a> or email <a href="mailto:' + CONFIG.email + '">' + esc(CONFIG.email) + '</a>.';
        });
    });
  }

  /* ---- persistence across pages (per browser tab session) ---- */
  function save() {
    try {
      sessionStorage.setItem(CONFIG.storageKey, JSON.stringify({
        open: state.open, track: state.track, msgs: state.msgs, chips: state.chips || null
      }));
    } catch (e) { /* storage unavailable — chat still works */ }
  }
  function restore() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(CONFIG.storageKey) || 'null'); } catch (e) { s = null; }
    if (!s || !s.msgs || !s.msgs.length) return false;
    state.track = s.track || null;
    s.msgs.forEach(function (m) { addMsg(m.f, m.t, true); });
    if (s.chips) addChips(s.chips);
    if (s.open && !/#enroll=/.test(location.hash)) setOpen(true);
    return true;
  }

  function init() {
    build();
    var had = restore();
    handleEnrollHash();
    if (!had && CONFIG.greetBubbleDelayMs > 0) {
      setTimeout(function () {
        var privacy = document.getElementById('htaPrivacyPopup');
        var privacyOpen = privacy && privacy.style.display === 'block';
        var modal = document.getElementById('enrollModalOverlay');
        var modalOpen = modal && modal.classList.contains('open');
        if (!state.open && !privacyOpen && !modalOpen) bubble.hidden = false;
      }, CONFIG.greetBubbleDelayMs);
    }
    window.HTABot = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, ask: function (q) { setOpen(true); userSays(q); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
