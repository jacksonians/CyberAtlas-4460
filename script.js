'use strict';

(function () {
  const scroller = document.getElementById('scroller');
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const dotRailList = document.querySelector('#dot-rail ul');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = prefersReducedMotion.matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const magneticSelectors = ['.btn', '.chip'];

  function buildDotRail() {
    if (!dotRailList || !scenes.length) return;

    const fragment = document.createDocumentFragment();

    scenes.forEach((scene, index) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Go to section ${index + 1}`);
      button.dataset.index = String(index);

      button.addEventListener('click', (event) => {
        event.preventDefault();
        const targetScene = scenes[index];
        if (!targetScene) return;

        targetScene.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        setActiveScene(index);
      });

      listItem.appendChild(button);
      fragment.appendChild(listItem);
    });

    dotRailList.appendChild(fragment);
  }

  function getDots() {
    return Array.from(dotRailList.querySelectorAll('button'));
  }

  function clearActive() {
    getDots().forEach((dot) => dot.classList.remove('active'));
    scenes.forEach((scene) => scene.classList.remove('is-active'));
  }

  function setActiveScene(index) {
    clearActive();
    const dots = getDots();
    const scene = scenes[index];
    if (dots[index]) {
      dots[index].classList.add('active');
    }
    if (scene) {
      scene.classList.add('is-active');
    }
  }

  function setupIntersectionHighlight() {
    if (hasGSAP && !reduceMotion) {
      // ScrollTrigger handles active states when enabled.
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = scenes.indexOf(entry.target);
            if (index !== -1) {
              setActiveScene(index);
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.4
      }
    );

    scenes.forEach((scene) => observer.observe(scene));
  }

  function revealFallback() {
    document
      .querySelectorAll('.card, .chip, .scene .placeholder, .checklist li, .source-list li, .avatar')
      .forEach((el) => {
        el.style.transform = 'none';
        el.style.opacity = '1';
        el.style.filter = 'none';
      });
  }

  function setupMagnetic() {
    if (reduceMotion || !magneticSelectors.length) return;

    const magnetElements = document.querySelectorAll(magneticSelectors.join(','));
    magnetElements.forEach((element) => {
      const strength = element.classList.contains('chip') ? 4 : 8;
      const animationEase = { duration: 0.4, ease: 'power3.out' };

      element.addEventListener('pointerenter', () => {
        element.dataset.magnet = 'true';
      });

      element.addEventListener('pointermove', (event) => {
        if (element.dataset.magnet !== 'true') return;
        const rect = element.getBoundingClientRect();
        const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
        const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * strength;

        if (hasGSAP) {
          gsap.to(element, { x: offsetX, y: offsetY, ...animationEase });
        } else {
          element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
      });

      element.addEventListener('pointerleave', () => {
        delete element.dataset.magnet;
        if (hasGSAP) {
          gsap.to(element, { x: 0, y: 0, ...animationEase });
        } else {
          element.style.transform = 'translate(0, 0)';
        }
      });
    });
  }

  function setupParallax() {
    if (!hasGSAP || reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);
    const layers = ['.bg-gradient', '.bg-glow', '.bg-grid'];
    layers.forEach((selector, index) => {
      const amplitude = index === 2 ? 4 : 8;
      gsap.to(selector, {
        yPercent: index % 2 === 0 ? amplitude : -amplitude,
        ease: 'none',
        scrollTrigger: {
          trigger: scroller,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        }
      });
    });
  }

  function setupSceneAnimations() {
    if (!hasGSAP || reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    scenes.forEach((scene, index) => {
      if (index === 0) {
        ScrollTrigger.create({
          trigger: scene,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveScene(index),
          onEnterBack: () => setActiveScene(index)
        });
        return;
      }

      const cards = scene.querySelectorAll('.card');
      const headings = scene.querySelectorAll('h1, h2, h3');
      const paragraph = scene.querySelectorAll('p:not(.muted)');
      const chips = scene.querySelectorAll('.chip');
      const misc = scene.querySelectorAll('.placeholder, .checklist li, .source-list li, .avatar');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top center',
          end: 'bottom center',
          toggleActions: 'play none none reverse',
          onEnter: () => setActiveScene(index),
          onEnterBack: () => setActiveScene(index)
        },
        defaults: { ease: 'power3.out' }
      });

      if (headings.length) {
        tl.fromTo(
          headings,
          { y: 26, opacity: 0, filter: 'blur(14px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.08 }
        );
      }

      if (paragraph.length) {
        tl.fromTo(
          paragraph,
          { y: 20, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, stagger: 0.06 },
          '-=0.5'
        );
      }

      if (cards.length) {
        tl.to(
          cards,
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.12
          },
          '-=0.6'
        );
      }

      if (chips.length) {
        tl.to(
          chips,
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.5,
            stagger: 0.08
          },
          '-=0.5'
        );
      }

      if (misc.length) {
        tl.to(
          misc,
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.6,
            stagger: 0.08
          },
          '-=0.5'
        );
      }
    });

    // Hero entrance sequence
    const hero = document.querySelector('.hero');
    if (hero) {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 });
      heroTimeline.from(hero, { y: 50, opacity: 0, duration: 1 });
      heroTimeline.from(
        hero.querySelectorAll('.hero__title, .hero__subtitle, .hero__actions .btn'),
        { y: 30, opacity: 0, filter: 'blur(10px)', duration: 0.8, stagger: 0.1 },
        '-=0.6'
      );
    }
  }

  function initGlitch() {
    const glitch = document.querySelector('.glitch');
    if (!glitch) return;
    const minDelay = 0.1;
    const maxDelay = 0.4;
    const randomDelay = (Math.random() * (maxDelay - minDelay) + minDelay).toFixed(2);
    glitch.style.setProperty('--glitch-delay', `${randomDelay}s`);

    if (reduceMotion) return;

    setInterval(() => {
      glitch.classList.remove('active');
      // Trigger reflow to restart animation
      void glitch.offsetWidth; // eslint-disable-line no-unused-expressions
      glitch.classList.add('active');
    }, 10000);

    glitch.classList.add('active');
  }

  // Connected Nodes Attack Visualization (from CyberAtlas)
  function initAttackVisualization() {
    const attackVizContainer = document.getElementById('attackViz');
    if (!attackVizContainer) return;

    const width = 800, height = 600;
    const attackSvg = d3.select("#attackViz").append("svg")
        .attr("width", width)
        .attr("height", height);

    const COLOR = {
        safe: "#6fcf97",
        attacked: "#eb5757",
        propagating: "#f2c94c",
        city: "#2f80ed",
    };

    const nodes = [
        { id: "New York City", type: "city" },
        { id: "Power Grid (Con Edison)", type: "utility" },
        { id: "Water Supply System", type: "utility" },
        { id: "Internet Backbone", type: "communication" },
        { id: "JFK Airport", type: "airport" },
        { id: "LaGuardia Airport", type: "airport" },
        { id: "Subway System", type: "transit" },
        { id: "Mount Sinai Hospital", type: "hospital" },
        { id: "NYU Langone Hospital", type: "hospital" },
        { id: "NYC Public Schools", type: "school" },
        { id: "Columbia University", type: "education" },
        { id: "Police Department", type: "security" },
        { id: "Fire Department", type: "security" },
        { id: "City Hall (Gov't)", type: "government" },
        { id: "Wall Street (Finance Hub)", type: "finance" },
        { id: "Media Networks", type: "media" },
        { id: "Cell Towers", type: "communication" },
        { id: "Traffic Control System", type: "transport" }
    ];

    const links = [
        ["New York City", "Power Grid (Con Edison)"],
        ["New York City", "Water Supply System"],
        ["New York City", "Internet Backbone"],
        ["New York City", "Subway System"],
        ["New York City", "Wall Street (Finance Hub)"],
        ["New York City", "City Hall (Gov't)"],
        ["Power Grid (Con Edison)", "Water Supply System"],
        ["Power Grid (Con Edison)", "Internet Backbone"],
        ["Power Grid (Con Edison)", "Cell Towers"],
        ["Power Grid (Con Edison)", "Subway System"],
        ["Power Grid (Con Edison)", "Mount Sinai Hospital"],
        ["Power Grid (Con Edison)", "NYU Langone Hospital"],
        ["Power Grid (Con Edison)", "Traffic Control System"],
        ["Mount Sinai Hospital", "Internet Backbone"],
        ["NYU Langone Hospital", "Internet Backbone"],
        ["Mount Sinai Hospital", "Water Supply System"],
        ["NYU Langone Hospital", "Water Supply System"],
        ["JFK Airport", "Power Grid (Con Edison)"],
        ["LaGuardia Airport", "Power Grid (Con Edison)"],
        ["JFK Airport", "Internet Backbone"],
        ["LaGuardia Airport", "Internet Backbone"],
        ["Subway System", "Power Grid (Con Edison)"],
        ["Traffic Control System", "Subway System"],
        ["Police Department", "City Hall (Gov't)"],
        ["Fire Department", "City Hall (Gov't)"],
        ["Internet Backbone", "Media Networks"],
        ["Internet Backbone", "Cell Towers"],
        ["Media Networks", "Wall Street (Finance Hub)"],
        ["NYC Public Schools", "Internet Backbone"],
        ["Columbia University", "Internet Backbone"],
        ["NYC Public Schools", "Power Grid (Con Edison)"],
        ["Columbia University", "Power Grid (Con Edison)"],
        ["Wall Street (Finance Hub)", "Power Grid (Con Edison)"],
        ["Wall Street (Finance Hub)", "Internet Backbone"],
        ["City Hall (Gov't)", "Internet Backbone"],
        ["City Hall (Gov't)", "Power Grid (Con Edison)"]
    ].map(d => ({ source: d[0], target: d[1] }));

    const propagationRules = {
        utility: [
            { targetType: "communication", delay: 700, prob: 0.8 },
            { targetType: "hospital", delay: 900, prob: 0.85 },
            { targetType: "transit", delay: 1000, prob: 0.75 },
            { targetType: "education", delay: 1100, prob: 0.6 }
        ],
        communication: [
            { targetType: "media", delay: 800, prob: 0.7 },
            { targetType: "emergency", delay: 900, prob: 0.8 }
        ],
        hospital: [
            { targetType: "emergency", delay: 1000, prob: 0.5 }
        ],
        transit: [
            { targetType: "education", delay: 900, prob: 0.6 }
        ],
        finance: [
            { targetType: "government", delay: 1000, prob: 0.5 }
        ],
        government: [
            { targetType: "security", delay: 1100, prob: 0.7 }
        ],
        default: [
            { targetType: "utility", delay: 1000, prob: 0.3 }
        ]
    };

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-350))
        .force("center", d3.forceCenter(width / 1.7, height / 2.5))
        .on("tick", ticked);

    const linkElems = attackSvg.append("g").selectAll("line")
        .data(links).enter()
        .append("line")
        .attr("stroke", "#bbb")
        .attr("stroke-width", 2);

    const nodeElems = attackSvg.append("g").selectAll("circle")
        .data(nodes).enter()
        .append("circle")
        .attr("r", d => d.type === "city" ? 22 : 14)
        .attr("fill", d => d.type === "city" ? COLOR.city : COLOR.safe)
        .attr("stroke", "#333")
        .attr("stroke-width", 1.2)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            if (d.state === "attacked" || d.state === "propagating") return;
            startAttack(d);
        });

    const labelElems = attackSvg.append("g").selectAll("text")
        .data(nodes).enter()
        .append("text")
        .text(d => d.id)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("fill", "#e6edf7")
        .attr("dy", -20);

    function ticked() {
        linkElems
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        nodeElems
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        labelElems
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    function markNodeState(node, state) {
        node.state = state;
        nodeElems.filter(d => d.id === node.id)
            .transition()
            .duration(300)
            .attr("r", state === "propagating" ? 18 : (state === "attacked" ? 16 : 14))
            .attr("fill", () => {
                if (state === "attacked") return COLOR.attacked;
                if (state === "propagating") return COLOR.propagating;
                if (node.type === "city") return COLOR.city;
                return COLOR.safe;
            });
    }

    function startAttack(sourceNode) {
        markNodeState(sourceNode, "attacked");

        const queue = [sourceNode];
        const visited = new Set([sourceNode.id]);

        function step() {
            if (queue.length === 0) {
                return;
            }
            const current = queue.shift();
            const ruleSet = propagationRules[current.type] || propagationRules.default;
            markNodeState(current, "propagating");

            ruleSet.forEach(rule => {
                const candidates = nodes.filter(n =>
                    n.type === rule.targetType &&
                    n.state !== "attacked" &&
                    links.some(l => (l.source.id === current.id && l.target.id === n.id) ||
                        (l.target.id === current.id && l.source.id === n.id))
                );

                candidates.forEach((cand, i) => {
                    if (Math.random() <= rule.prob) {
                        setTimeout(() => {
                            if (cand.state === "safe" || !cand.state) {
                                markNodeState(cand, "attacked");
                                queue.push(cand);
                                step();
                            }
                        }, rule.delay + i * 200);
                    }
                });
            });
        }

        step();
    }
  }
    function initIndustryVisualization() {
        const industryContainer = document.querySelector('#section7 .placeholder');
        if (!industryContainer) return;

        // Remove placeholder
        industryContainer.innerHTML = '';

        const width = 700;
        const height = 500;
        const margin = { top: 60, right: 40, bottom: 100, left: 80 };

        const svg = d3.select(industryContainer)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const chartArea = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'fixed')
            .style('background', '#1e1e2f')
            .style('color', '#e6edf7')
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('max-width', '240px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', 0);

        // Load CSV file
        d3.csv('data/Cybersecurity_Incidents_Database.csv').then(rawData => {
            // Count how many attacks per industry
            const industryCounts = d3.rollups(
                rawData,
                v => v.length,
                d => d.industry
            ).map(([industry, attacks]) => ({ industry, attacks }));

            // ✅ Sort industries by number of attacks (descending)
            industryCounts.sort((a, b) => d3.descending(a.attacks, b.attacks));

            // Tooltip impact descriptions
            const impactText = {
                'Finance': 'Financial breaches can drain citizens’ savings and compromise credit data.',
                'Healthcare': 'Attacks can expose medical records, delay treatments, and endanger lives.',
                'Education': 'Schools face class disruptions and leaks affecting students and parents.',
                'Manufacturing': 'Interrupts supply chains, raising prices and delaying goods.',
                'Government': 'Can leak citizen data and disrupt essential public services.',
                'Energy': 'Leads to outages, fuel shortages, and national security risks.',
                'Retail': 'Compromises payment data, causing identity theft and fraud.',
                'Technology': 'Exposes personal data that fuels scams and misinformation.'
            };

            const x = d3.scaleBand()
                .domain(industryCounts.map(d => d.industry))
                .range([0, width - margin.left - margin.right])
                .padding(0.3);

            const y = d3.scaleLinear()
                .domain([0, d3.max(industryCounts, d => d.attacks)])
                .nice()
                .range([height - margin.top - margin.bottom, 0]);

            const color = d3.scaleOrdinal()
                .domain(industryCounts.map(d => d.industry))
                .range(d3.schemeTableau10);

            chartArea.selectAll('.bar')
                .data(industryCounts)
                .enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', d => x(d.industry))
                .attr('y', d => y(d.attacks))
                .attr('width', x.bandwidth())
                .attr('height', d => height - margin.top - margin.bottom - y(d.attacks))
                .attr('fill', d => color(d.industry))
                .style('cursor', 'pointer')
                .on('mouseover', function (event, d) {
                    d3.select(this).attr('opacity', 0.8);
                    tooltip.transition().duration(150).style('opacity', 1);
                    tooltip.html(
                        `<strong>${d.industry}</strong><br>
                     Attacks: ${d.attacks}<br>
                     <em>${impactText[d.industry] || 'Impacts citizens through data exposure and service disruption.'}</em>`
                    )
                        .style('left', event.clientX + 12 + 'px')
                        .style('top', event.clientY - 40 + 'px');
                })
                .on('mousemove', event => {
                    tooltip.style('left', event.clientX + 12 + 'px')
                        .style('top', event.clientY - 40 + 'px');
                })
                .on('mouseout', function () {
                    d3.select(this).attr('opacity', 1);
                    tooltip.transition().duration(200).style('opacity', 0);
                });

            // X axis
            chartArea.append('g')
                .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll('text')
                .attr('transform', 'rotate(-40)')
                .style('text-anchor', 'end')
                .attr('fill', '#e6edf7');

            // Y axis
            chartArea.append('g')
                .call(d3.axisLeft(y))
                .selectAll('text')
                .attr('fill', '#e6edf7');

            // Axis labels
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height - 20)
                .attr('text-anchor', 'middle')
                .attr('fill', '#e6edf7')
                .attr('font-size', '14px')
                .text('Industry');

            svg.append('text')
                .attr('x', -height / 2)
                .attr('y', 25)
                .attr('transform', 'rotate(-90)')
                .attr('text-anchor', 'middle')
                .attr('fill', '#e6edf7')
                .attr('font-size', '14px')
                .text('Number of Attacks');

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', 25)
                .attr('text-anchor', 'middle')
                .attr('fill', '#e6edf7')
                .attr('font-size', '18px')
                .text('Cyber Attacks by Industry');
        });
    }

  // Linked Attack Type Visualizations (Area Chart + Bar Chart)
  function initLinkedAttackCharts() {
    const section = document.querySelector('#section9');
    if (!section) return;

    const areaCard = section.querySelector('.card:first-child .placeholder');
    const barCard = section.querySelector('.card:last-child .placeholder');
    if (!areaCard || !barCard) return;

    // Also get the parent cards to adjust overflow
    const areaCardParent = section.querySelector('.card:first-child');
    const barCardParent = section.querySelector('.card:last-child');
    
    // Clear placeholders and adjust styling
    areaCard.innerHTML = '';
    barCard.innerHTML = '';
    areaCard.style.display = 'flex';
    areaCard.style.justifyContent = 'center';
    areaCard.style.alignItems = 'flex-start';
    areaCard.style.overflow = 'visible';
    areaCard.style.paddingTop = '10px';
    barCard.style.display = 'flex';
    barCard.style.justifyContent = 'center';
    barCard.style.alignItems = 'flex-start';
    barCard.style.overflow = 'visible';
    barCard.style.paddingTop = '60px';
    
    // Ensure parent cards don't clip content
    if (areaCardParent) areaCardParent.style.overflow = 'visible';
    if (barCardParent) barCardParent.style.overflow = 'visible';

    // Dimensions - fit within split container
    const areaWidth = 480;
    const areaHeight = 400;
    const barWidth = 480;
    const barHeight = 400;
    const margin = { top: 30, right: 60, bottom: 90, left: 65 };

    // Create SVGs
    const areaSvg = d3.select(areaCard)
      .append('svg')
      .attr('width', areaWidth)
      .attr('height', areaHeight);

    const barSvg = d3.select(barCard)
      .append('svg')
      .attr('width', barWidth)
      .attr('height', barHeight);

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'linked-chart-tooltip')
      .style('position', 'fixed')
      .style('background', '#1e1e2f')
      .style('color', '#e6edf7')
      .style('padding', '10px 14px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('opacity', 0)
      .style('border', '1px solid rgba(168, 137, 255, 0.3)');

    // Load data
    d3.csv('data/Cybersecurity_Incidents_Database.csv').then(rawData => {
      // Parse dates and filter valid entries
      rawData = rawData.map(d => ({
        ...d,
        parsedDate: d.date ? new Date(d.date) : null
      })).filter(d => d.parsedDate !== null);

      console.log('Loaded', rawData.length, 'attacks with dates');

      // Count attacks by type
      const attackCounts = d3.rollups(
        rawData,
        v => v.length,
        d => d.attack_type
      ).map(([type, count]) => ({ type, count }))
        .sort((a, b) => d3.descending(a.count, b.count));

      // Get top attack types for better visualization
      const topAttackTypes = attackCounts.slice(0, 7).map(d => d.type);

      // Group data by month using actual dates
      const timeParser = d3.timeFormat('%Y-%m');
      const dataByMonth = d3.rollups(
        rawData,
        v => v,
        d => timeParser(d.parsedDate)
      );

      // Create temporal data from actual dates
      const temporalData = dataByMonth.map(([monthKey, attacks]) => {
        const dataPoint = { 
          date: new Date(monthKey + '-01'),
          monthKey: monthKey
        };
        
        // Count each attack type for this month
        topAttackTypes.forEach(type => {
          dataPoint[type] = attacks.filter(a => a.attack_type === type).length;
        });
        
        return dataPoint;
      }).sort((a, b) => a.date - b.date);

      // Color scale
      const colorScale = d3.scaleOrdinal()
        .domain(topAttackTypes)
        .range(['#a889ff', '#6fcf97', '#f2c94c', '#eb5757', '#56ccf2', '#ff6b9d', '#ffa94d']);

      // State for linked highlighting
      let selectedType = null;

      // ==================== AREA CHART ====================
      const areaG = areaSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xArea = d3.scaleTime()
        .domain(d3.extent(temporalData, d => d.date))
        .range([0, areaWidth - margin.left - margin.right]);

      const yArea = d3.scaleLinear()
        .domain([0, d3.max(temporalData, d => d3.sum(topAttackTypes, type => d[type]))])
        .nice()
        .range([areaHeight - margin.top - margin.bottom, 0]);

      // Stack data
      const stack = d3.stack()
        .keys(topAttackTypes)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(temporalData);

      // Area generator
      const area = d3.area()
        .x(d => xArea(d.data.date))
        .y0(d => yArea(d[0]))
        .y1(d => yArea(d[1]))
        .curve(d3.curveMonotoneX);

      // Draw areas
      const areaLayers = areaG.selectAll('.area-layer')
        .data(series)
        .enter()
        .append('path')
        .attr('class', 'area-layer')
        .attr('d', area)
        .attr('fill', d => colorScale(d.key))
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          if (selectedType && selectedType !== d.key) return;
          
          d3.select(this).attr('opacity', 1);
          const mouseDate = xArea.invert(d3.pointer(event, this)[0]);
          const bisect = d3.bisector(d => d.data.date).left;
          const index = bisect(d, mouseDate);
          const dataPoint = d[index];
          
          if (dataPoint) {
            const value = dataPoint[1] - dataPoint[0];
            tooltip.transition().duration(150).style('opacity', 1);
            tooltip.html(`<strong>${d.key}</strong><br/>Count: ${value.toLocaleString()}`)
              .style('left', event.clientX + 12 + 'px')
              .style('top', event.clientY - 40 + 'px');
          }
          
          // Highlight corresponding bar
          barBars.attr('opacity', bar => bar.type === d.key ? 1 : 0.3);
        })
        .on('mousemove', event => {
          tooltip.style('left', event.clientX + 12 + 'px')
            .style('top', event.clientY - 40 + 'px');
        })
        .on('mouseout', function(event, d) {
          if (selectedType) return;
          d3.select(this).attr('opacity', 0.7);
          tooltip.transition().duration(200).style('opacity', 0);
          barBars.attr('opacity', 1);
        })
        .on('click', function(event, d) {
          if (selectedType === d.key) {
            // Deselect
            selectedType = null;
            areaLayers.attr('opacity', 0.7).attr('stroke', 'none').attr('stroke-width', 0);
            barBars.attr('opacity', 1).attr('stroke', 'none').attr('stroke-width', 0);
          } else {
            // Select
            selectedType = d.key;
            areaLayers.attr('opacity', layer => layer.key === d.key ? 1 : 0.2)
              .attr('stroke', layer => layer.key === d.key ? '#fff' : 'none')
              .attr('stroke-width', layer => layer.key === d.key ? 2 : 0);
            barBars.attr('opacity', bar => bar.type === d.key ? 1 : 0.2)
              .attr('stroke', bar => bar.type === d.key ? '#fff' : 'none')
              .attr('stroke-width', bar => bar.type === d.key ? 2 : 0);
          }
        });

      // Axes
      areaG.append('g')
        .attr('transform', `translate(0,${areaHeight - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xArea).ticks(6).tickFormat(d3.timeFormat('%b %Y')))
        .selectAll('text')
        .attr('fill', '#e6edf7')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end');

      areaG.append('g')
        .call(d3.axisLeft(yArea).ticks(6))
        .selectAll('text')
        .attr('fill', '#e6edf7');

      // Labels
      areaSvg.append('text')
        .attr('x', areaWidth / 2)
        .attr('y', areaHeight - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e6edf7')
        .attr('font-size', '12px')
        .text('Time Period');

      areaSvg.append('text')
        .attr('x', -areaHeight / 2)
        .attr('y', 12)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('fill', '#e6edf7')
        .attr('font-size', '12px')
        .text('Attack Count');

      // ==================== BAR CHART ====================
      const barG = barSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xBar = d3.scaleBand()
        .domain(attackCounts.slice(0, 7).map(d => d.type))
        .range([0, barWidth - margin.left - margin.right])
        .padding(0.2);

      const yBar = d3.scaleLinear()
        .domain([0, d3.max(attackCounts.slice(0, 7), d => d.count)])
        .nice()
        .range([barHeight - margin.top - margin.bottom, 0]);

      const barBars = barG.selectAll('.bar')
        .data(attackCounts.slice(0, 7))
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xBar(d.type))
        .attr('y', d => yBar(d.count))
        .attr('width', xBar.bandwidth())
        .attr('height', d => barHeight - margin.top - margin.bottom - yBar(d.count))
        .attr('fill', d => colorScale(d.type))
        .attr('opacity', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          if (selectedType && selectedType !== d.type) return;
          
          d3.select(this).attr('opacity', 0.8);
          tooltip.transition().duration(150).style('opacity', 1);
          tooltip.html(`<strong>${d.type}</strong><br/>Total Attacks: ${d.count.toLocaleString()}`)
            .style('left', event.clientX + 12 + 'px')
            .style('top', event.clientY - 40 + 'px');
          
          // Highlight corresponding area
          areaLayers.attr('opacity', layer => layer.key === d.type ? 1 : 0.3);
        })
        .on('mousemove', event => {
          tooltip.style('left', event.clientX + 12 + 'px')
            .style('top', event.clientY - 40 + 'px');
        })
        .on('mouseout', function() {
          if (selectedType) return;
          d3.select(this).attr('opacity', 1);
          tooltip.transition().duration(200).style('opacity', 0);
          areaLayers.attr('opacity', 0.7);
        })
        .on('click', function(event, d) {
          if (selectedType === d.type) {
            // Deselect
            selectedType = null;
            areaLayers.attr('opacity', 0.7).attr('stroke', 'none').attr('stroke-width', 0);
            barBars.attr('opacity', 1).attr('stroke', 'none').attr('stroke-width', 0);
          } else {
            // Select
            selectedType = d.type;
            areaLayers.attr('opacity', layer => layer.key === d.type ? 1 : 0.2)
              .attr('stroke', layer => layer.key === d.type ? '#fff' : 'none')
              .attr('stroke-width', layer => layer.key === d.type ? 2 : 0);
            barBars.attr('opacity', bar => bar.type === d.type ? 1 : 0.2)
              .attr('stroke', bar => bar.type === d.type ? '#fff' : 'none')
              .attr('stroke-width', bar => bar.type === d.type ? 2 : 0);
          }
        });

      // Axes
      barG.append('g')
        .attr('transform', `translate(0,${barHeight - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xBar))
        .selectAll('text')
        .attr('fill', '#e6edf7')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end');

      barG.append('g')
        .call(d3.axisLeft(yBar).ticks(6).tickFormat(d => d3.format('.2s')(d)))
        .selectAll('text')
        .attr('fill', '#e6edf7');

      // Labels
      barSvg.append('text')
        .attr('x', barWidth / 2)
        .attr('y', barHeight - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e6edf7')
        .attr('font-size', '12px')
        .text('ATTACK TYPE');

      barSvg.append('text')
        .attr('x', -barHeight / 2)
        .attr('y', 12)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('fill', '#e6edf7')
        .attr('font-size', '12px')
        .text('Total Count');
    });
  }

  // Ability to check off items in checklist for Section 10
  function initChecklist() {
    const checklistItems = document.querySelectorAll('.checklist li');
    
    checklistItems.forEach(item => {
      item.style.cursor = 'pointer';
      
      item.addEventListener('click', function() {
        this.classList.toggle('checked');
      });
    });
  }

  function setupExploreDataButton() {
    const exploreBtn = document.getElementById('explore-data-btn');
    if (!exploreBtn || scenes.length < 2) return;

    exploreBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const nextScene = scenes[1]; // section2 is at index 1
      if (!nextScene) return;

      nextScene.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
      setActiveScene(1);
    });
  }

  function init() {
    buildDotRail();
    setActiveScene(0);
    setupIntersectionHighlight();
    setupMagnetic();
    initGlitch();
    setupExploreDataButton();
    initAttackVisualization();
    initIndustryVisualization();
    initLinkedAttackCharts();
    initChecklist();
    if (!hasGSAP || reduceMotion) {
      revealFallback();
      return;
    }

    setupParallax();
    setupSceneAnimations();
  }

  if (!scenes.length || !scroller) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  prefersReducedMotion.addEventListener('change', () => {
    window.location.reload();
  });
})();

// Handle form submission for question (from CyberAtlas)
function handleSubmit(event) {
    event.preventDefault();
    const numberInput = document.getElementById('audience-question');
    const resultMessage = document.getElementById('resultMessage');
    const questionContent = document.getElementById('questionContent');
    const userAnswer = parseInt(numberInput.value);
    const correctAnswer = 2244;
    
    // Calculate how far off they were
    const difference = Math.abs(userAnswer - correctAnswer);
    
    // Fade out the question and input
    questionContent.classList.add('fade-out');
    
    // Wait for fade out animation, then show result
    setTimeout(() => {
        questionContent.style.display = 'none';
        
        // Show different message based on whether they got it right
        if (difference === 0) {
            resultMessage.textContent = 'Perfect! Lucky guess or did you look it up? That is the correct answer.';
        } else {
            resultMessage.textContent = `Nice try. You were off by ${difference.toLocaleString()} attacks. The correct answer is ${correctAnswer.toLocaleString()} attacks per day.`;
        }
        
        resultMessage.classList.add('show');
    }, 500); // Match the CSS transition duration
    
    return false;
}

// ===== ATTACK–TOOL BIPARTITE NETWORK (Lift/PMI) =====
(function () {
  const container = d3.select('#attack-tool-network');
  if (container.empty()) return;

  const width = 820;
  const height = 520;
  const margin = { top: 60, right: 40, bottom: 70, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'network-tooltip');

  // Diverging color scale: under-expected -> neutral -> over-expected
  const colorUnder = d3.rgb(102, 224, 255, 0.25); // cyan, faint
  const colorOver = d3.rgb(168, 137, 255, 0.85); // purple, strong
  const assocColor = d3.scaleDiverging([-0.5, 0, 0.8], t =>
    d3.interpolateRgb(colorUnder, colorOver)(d3.scaleLinear().domain([-0.5, 0.8]).range([0, 1])(t))
  );

  fetch('data/Cybersecurity_Incidents_Database.csv')
    .then(r => r.text())
    .then(csvText => {
      const rows = d3.csvParse(csvText);
      console.log('Bipartite network loaded:', rows.length, 'rows');

      function computeAssociation(filteredRows) {
        const attacks = Array.from(new Set(filteredRows.map(d => d.attack_type))).sort();
        const tools = Array.from(new Set(filteredRows.map(d => d.security_tools_used))).sort();

        const n = filteredRows.length;
        const attackCount = d3.rollup(filteredRows, v => v.length, d => d.attack_type);
        const toolCount = d3.rollup(filteredRows, v => v.length, d => d.security_tools_used);
        const pairCount = d3.rollup(filteredRows, v => v.length, d => d.attack_type, d => d.security_tools_used);

        const matrix = Array.from({ length: attacks.length }, () => Array(tools.length).fill(0));
        const meta = Array.from({ length: attacks.length }, () => Array(tools.length).fill(null));

        attacks.forEach((a, i) => {
          tools.forEach((t, j) => {
            const obs = (pairCount.get(a) && pairCount.get(a).get(t)) || 0;
            const pa = (attackCount.get(a) || 0) / n;
            const pt = (toolCount.get(t) || 0) / n;
            const expected = pa * pt * n;
            const lift = expected > 0 ? obs / expected : 0;
            const centered = expected > 0 ? (obs - expected) / expected : 0;
            matrix[i][j] = centered;
            meta[i][j] = { attack: a, tool: t, obs, expected, lift, pmi: lift > 0 ? Math.log2(lift) : -Infinity };
          });
        });

        return { attacks, tools, matrix, meta };
      }

      function renderNetwork(currentRows) {
        svg.selectAll('*').remove();

        const { attacks, tools, matrix, meta } = computeAssociation(currentRows);

        // Even vertical spacing for both sides
        const attackScale = d3.scalePoint().domain(d3.range(attacks.length)).range([0, innerHeight]).padding(0.5);
        const toolScale = d3.scalePoint().domain(d3.range(tools.length)).range([0, innerHeight]).padding(0.5);

        const leftX = innerWidth * 0.15;
        const rightX = innerWidth * 0.85;

        const attackNodes = attacks.map((name, i) => ({ id: `attack-${i}`, name, type: 'attack', x: leftX, y: attackScale(i) }));
        const toolNodes = tools.map((name, i) => ({ id: `tool-${i}`, name, type: 'tool', x: rightX, y: toolScale(i) }));

        // All links (no threshold) so everything links to everything
        const links = [];
        for (let i = 0; i < attacks.length; i++) {
          for (let j = 0; j < tools.length; j++) {
            links.push({
              source: attackNodes[i],
              target: toolNodes[j],
              centered: matrix[i][j],
              meta: meta[i][j]
                });
            }
        }

        // Curved path generator between two points
        const linkPath = (a, b) => {
          const cx1 = a.x + (b.x - a.x) * 0.45;
          const cx2 = a.x + (b.x - a.x) * 0.55;
          return `M${a.x},${a.y} C${cx1},${a.y} ${cx2},${b.y} ${b.x},${b.y}`;
        };

        // Draw links (no tooltips on links)
        const link = svg.append('g')
          .attr('fill', 'none')
          .selectAll('path')
          .data(links)
          .enter().append('path')
          .attr('class', 'network-link')
          .attr('d', d => linkPath(d.source, d.target))
          .attr('stroke', d => assocColor(d.centered))
          .attr('stroke-width', d => 0.8 + 5.2 * Math.min(1, Math.abs(d.centered)))
          .attr('stroke-opacity', d => 0.18 + 0.62 * Math.min(1, Math.abs(d.centered)));

        // Draw nodes
        const nodes = [...attackNodes, ...toolNodes];
        const node = svg.append('g')
          .selectAll('circle')
          .data(nodes)
          .enter().append('circle')
          .attr('class', d => `network-node ${d.type}`)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('r', 18)
          .on('mouseover', function (event, d) {
            // Create description based on type
            let description = '';
            if (d.type === 'attack') {
              const attackDescriptions = {
                'Brute Force': 'Automated attempts to guess passwords or credentials through trial and error',
                'Business Email Compromise': 'Sophisticated email attacks targeting businesses to initiate fraudulent wire transfers',
                'Credential Stuffing': 'Using stolen credentials from one service to gain unauthorized access to other accounts',
                'Cross-Site Scripting': 'Injection of malicious scripts into web pages viewed by other users',
                'DDoS': 'Distributed Denial of Service attacks that overwhelm systems with traffic',
                'Insider Threat': 'Security risks from employees, contractors, or partners with authorized access',
                'Malware': 'Malicious software designed to damage, disrupt, or gain unauthorized access to systems',
                'Phishing': 'Deceptive emails or messages designed to trick users into revealing sensitive information',
                'Ransomware': 'Malware that encrypts files and demands payment for decryption',
                'SQL Injection': 'Exploitation of database vulnerabilities by injecting malicious SQL code',
                'Supply Chain Compromise': 'Attacks targeting software vendors or third-party suppliers to reach end customers',
                'Zero-Day Exploit': 'Attacks exploiting previously unknown vulnerabilities before patches are available'
              };
              description = attackDescriptions[d.name] || 'A type of cyber attack';
            } else {
              const toolDescriptions = {
                'Account Lockout': 'Automatically locks accounts after failed login attempts',
                'Antivirus': 'Scans and removes malicious software from systems',
                'CDN Scrubbing': 'Filters and blocks malicious traffic at the network edge',
                'Content Security Policy': 'Prevents XSS attacks by controlling which resources can be loaded',
                'DDoS Mitigation': 'Services that filter and absorb distributed denial of service attacks',
                'DMARC': 'Email authentication protocol that prevents email spoofing',
                'Database Firewall': 'Monitors and blocks unauthorized database access attempts',
                'EDR': 'Endpoint Detection and Response - monitors endpoints for suspicious activity',
                'Email Filtering': 'Scans and blocks malicious emails before they reach users',
                'Firewall': 'Network security device that filters traffic based on security rules',
                'IDS': 'Intrusion Detection System - monitors network traffic for suspicious activity',
                'MFA': 'Multi-Factor Authentication - requires multiple forms of verification',
                'Offline Backups': 'Backup copies stored offline to prevent ransomware encryption',
                'SIEM': 'Security Information and Event Management - aggregates and analyzes security logs',
                'WAF': 'Web Application Firewall - protects web applications from various attacks'
              };
              description = toolDescriptions[d.name] || 'A security tool or measure';
            }
            
            // Show tooltip with node name and description
            tooltip.classed('show', true)
              .html(`<div><strong>${d.name}</strong></div><div style="margin-top: 0.25rem; font-size: 0.85em; opacity: 0.9;">${description}</div>`);
            
            // Position tooltip to the left for attack types, right for tools
            // For attack types, position well to the left of cursor
            if (d.type === 'attack') {
              // Position to the left of cursor - use transform to ensure it's positioned correctly
              tooltip
                .style('left', (event.pageX - 250) + 'px')
                .style('right', 'auto')
                .style('transform', 'none');
            } else {
              // Position to the right of cursor
              tooltip
                .style('left', (event.pageX + 12) + 'px')
                .style('right', 'auto')
                .style('transform', 'none');
            }
            tooltip
              .style('top', (event.pageY - 28) + 'px')
              .style('margin', '0');
            
            // Highlight connected links and blur others
            link.each(function(l) {
              const isConnected = l.source.id === d.id || l.target.id === d.id;
              d3.select(this)
                .classed('hover', isConnected)
                .style('opacity', isConnected ? 1 : 0.08)
                .style('filter', isConnected ? 'none' : 'blur(1px)');
            });
            // Highlight connected nodes and blur others
            node.each(function(n) {
              const isConnected = n.id === d.id || 
                links.some(l => (l.source.id === d.id && l.target.id === n.id) || 
                               (l.target.id === d.id && l.source.id === n.id));
              d3.select(this)
                .style('opacity', isConnected ? 1 : 0.2)
                .style('filter', isConnected ? 'none' : 'blur(2px)');
            });
          })
          .on('mousemove', function(event, d) {
            if (d.type === 'attack') {
              // Position to the left of cursor
              tooltip
                .style('left', (event.pageX - 250) + 'px')
                .style('right', 'auto')
                .style('transform', 'none');
            } else {
              // Position to the right of cursor
              tooltip
                .style('left', (event.pageX + 12) + 'px')
                .style('right', 'auto')
                .style('transform', 'none');
            }
            tooltip
              .style('top', (event.pageY - 28) + 'px')
              .style('margin', '0');
          })
          .on('mouseout', function () {
            tooltip.classed('show', false);
            link.classed('hover', false)
              .style('opacity', null)
              .style('filter', null);
            node.style('opacity', null)
              .style('filter', null);
          });

        // Labels - positioned to avoid covering visualization
        // Left side (attack types): text appears to the left of nodes
        // Right side (tools): text appears to the right of nodes
        svg.append('g')
          .selectAll('text')
          .data(nodes)
          .enter().append('text')
          .attr('class', 'network-node-label')
          .text(d => d.name)
          .attr('x', d => d.type === 'attack' ? d.x - 90 : d.x + 90)
          .attr('y', d => d.y + 4)
          .attr('text-anchor', d => d.type === 'attack' ? 'end' : 'start');

        // Add legend at bottom center of chart
        const legendWidth = 220;
        const legendX = (innerWidth - legendWidth) / 2;
        const legendY = innerHeight + 32; // Moved down more
        
        const legendGroup = svg.append('g')
          .attr('class', 'chart-legend')
          .attr('transform', `translate(${legendX}, ${legendY})`);
        
        // Title - centered
        legendGroup.append('text')
          .attr('class', 'legend-title')
          .attr('x', legendWidth / 2)
          .attr('y', -3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e6edf7')
          .attr('font-size', '0.8rem')
          .attr('font-weight', '600')
          .text('Association strength');
        
        // Gradient bar - check if defs already exists
        let defs = svg.select('defs');
        if (defs.empty()) {
          defs = svg.append('defs');
        }
        
        // Remove existing gradient if it exists
        defs.select('#legend-gradient').remove();
        
        const gradientDef = defs.append('linearGradient')
          .attr('id', 'legend-gradient')
          .attr('x1', '0%')
          .attr('x2', '100%');
        
        gradientDef.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', 'rgba(102,224,255,0.25)');
        
        gradientDef.append('stop')
          .attr('offset', '50%')
          .attr('stop-color', 'rgba(102,224,255,0.4)');
        
        gradientDef.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', 'rgba(200,120,255,0.95)');
        
        legendGroup.append('rect')
          .attr('class', 'legend-gradient-bar')
          .attr('x', 0)
          .attr('y', 3)
          .attr('width', legendWidth)
          .attr('height', 11)
          .attr('rx', 6)
          .attr('fill', 'url(#legend-gradient)')
          .attr('stroke', 'rgba(102,224,255,0.35)')
          .attr('stroke-width', 1.5);
        
        // Labels below gradient - centered at ends
        legendGroup.append('text')
          .attr('class', 'legend-label-left')
          .attr('x', 0)
          .attr('y', 30)
          .attr('text-anchor', 'middle')
          .attr('fill', 'rgba(102,224,255,0.9)')
          .attr('font-size', '0.75rem')
          .attr('font-weight', '500')
          .text('Weak connection');
        
        legendGroup.append('text')
          .attr('class', 'legend-label-right')
          .attr('x', legendWidth)
          .attr('y', 30)
          .attr('text-anchor', 'middle')
          .attr('fill', 'rgba(200,120,255,1)')
          .attr('font-size', '0.75rem')
          .attr('font-weight', '500')
          .text('Strong connection');

        // Simple fade-in
        link.style('opacity', 0).transition().duration(500).style('opacity', 1);
        node.style('opacity', 0).transition().duration(600).delay(150).style('opacity', 1);
      }

      // Initial render with all data
      renderNetwork(rows);
    });
})();

document.addEventListener("DOMContentLoaded", async function() {
    try {
        // Load CSV data with all columns intact
        const csvData = await d3.csv("data/US_Cyber_Crimes.csv");

        console.log("CSV Data loaded:", csvData.length, "states");
        console.log("Sample data:", csvData[0]);

        // Initialize map visualization
        new CrimeMapVisual(
            "map-container",
            csvData,
            "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        );
    } catch (err) {
        console.error("Error loading data:", err);
    }
});