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
        { id: "Bus Network", type: "transit" },
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
        { id: "Emergency Call Centers (911)", type: "emergency" },
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
        ["Bus Network", "Subway System"],
        ["Traffic Control System", "Subway System"],
        ["Police Department", "City Hall (Gov't)"],
        ["Fire Department", "City Hall (Gov't)"],
        ["Emergency Call Centers (911)", "Internet Backbone"],
        ["Emergency Call Centers (911)", "Cell Towers"],
        ["Emergency Call Centers (911)", "Police Department"],
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
        .force("center", d3.forceCenter(width / 2, height / 2))
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

  function init() {
    buildDotRail();
    setActiveScene(0);
    setupIntersectionHighlight();
    setupMagnetic();
    initGlitch();
    initAttackVisualization();

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
            resultMessage.textContent = 'Perfect! Lucky guess or are you part of the organization? That is the correct answer.';
        } else {
            resultMessage.textContent = `Nice try. You were off by ${difference.toLocaleString()} attacks. The correct answer is ${correctAnswer.toLocaleString()} attacks per day.`;
        }
        
        resultMessage.classList.add('show');
    }, 500); // Match the CSS transition duration
    
    return false;
}
