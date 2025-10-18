// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const sections = document.querySelectorAll('.content-section');
    const numSections = sections.length;
    const circleRadius = 8;
    const circleSpacing = 40;
    const svgHeight = numSections * circleSpacing;

    // Update SVG height
    const svg = d3.select('.nav-svg')
        .attr('height', svgHeight);

    // Create navigation circles using D3.js
    const navCircles = svg.selectAll('.nav-circle')
        .data(d3.range(numSections))
        .enter()
        .append('g')
        .attr('class', 'nav-circle')
        .attr('transform', (d, i) => `translate(30, ${circleSpacing * i + 30})`)
        .attr('data-section', d => d);

    // Add circles
    navCircles.append('circle')
        .attr('r', circleRadius)
        .attr('cx', 0)
        .attr('cy', 0);

    // Add numbers to circles
    navCircles.append('text')
        .attr('x', 0)
        .attr('y', 4)
        .text(d => d + 1);

    // Click handler for navigation circles
    navCircles.on('click', function(event, d) {
        const targetSection = document.getElementById(`section${d + 1}`);
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });

    // Scroll detection logic
    let ticking = false;

    function updateActiveCircle() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        let activeIndex = 0;

        // Find which section is currently in view
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeIndex = index;
            }
        });

        // Update active circle
        navCircles.classed('active', function(d) {
            return d === activeIndex;
        });

        ticking = false;
    }

    // Throttled scroll handler
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateActiveCircle);
            ticking = true;
        }
    }

    // Add scroll event listener
    window.addEventListener('scroll', onScroll);

    // Initialize - set first circle as active
    updateActiveCircle();

    // Add hover effects with D3
    navCircles
        .on('mouseenter', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', function() {
                    const currentTransform = d3.select(this).attr('transform');
                    const match = currentTransform.match(/translate\((\d+),\s*(\d+)\)/);
                    if (match) {
                        return `translate(${match[1]}, ${match[2]}) scale(1.2)`;
                    }
                    return currentTransform;
                });
        })
        .on('mouseleave', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('transform', function() {
                    const currentTransform = d3.select(this).attr('transform');
                    const match = currentTransform.match(/translate\((\d+),\s*(\d+)\)/);
                    if (match) {
                        return `translate(${match[1]}, ${match[2]})`;
                    }
                    return currentTransform;
                });
        });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            updateActiveCircle();
        }, 250);
    });

    document.addEventListener('keydown', function(e) {
        const activeCircle = document.querySelector('.nav-circle.active');
        if (!activeCircle) return;

        const currentIndex = parseInt(activeCircle.getAttribute('data-section'));
        let targetIndex;

        // Arrow Up or Page Up
        if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            targetIndex = Math.max(0, currentIndex - 1);
        }
        // Arrow Down or Page Down
        else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            targetIndex = Math.min(numSections - 1, currentIndex + 1);
        }
        // Home key
        else if (e.key === 'Home') {
            e.preventDefault();
            targetIndex = 0;
        }
        // End key
        else if (e.key === 'End') {
            e.preventDefault();
            targetIndex = numSections - 1;
        }

        if (targetIndex !== undefined) {
            const targetSection = document.getElementById(`section${targetIndex + 1}`);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });

    console.log('CyberAtlas navigation initialized with', numSections, 'sections');



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
        { id: "City Hall (Gov’t)", type: "government" },
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
        ["New York City", "City Hall (Gov’t)"],
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
        ["Police Department", "City Hall (Gov’t)"],
        ["Fire Department", "City Hall (Gov’t)"],
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
        ["City Hall (Gov’t)", "Internet Backbone"],
        ["City Hall (Gov’t)", "Power Grid (Con Edison)"]
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
        .attr("dy", -20);

    document.getElementById("statusText").textContent = "Status: idle";

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
                document.getElementById("statusText").textContent = "Propagation complete.";
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

});

// Handle form submission in Section 2
function handleSubmit(event) {
    event.preventDefault();
    const numberInput = document.getElementById('numberInput');
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
            resultMessage.textContent = 'Lucky guess or are you part of the organization? Either way, that is the correct answer.';
        } else {
            resultMessage.textContent = `Nice try. You were off by ${difference} attacks. The correct answer is ${correctAnswer}.`;
        }
        
        resultMessage.classList.add('show');
    }, 500); // Match the CSS transition duration
    
    return false;
}
