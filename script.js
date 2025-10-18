// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const sections = document.querySelectorAll('.content-section');
    const numSections = sections.length;
    const circleRadius = 12;
    const circleSpacing = 60;
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
    
    // Optional: Add keyboard navigation
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
            resultMessage.textContent = 'Lucky guess or are you part of the organization? Either way, that was the correct answer.';
        } else {
            resultMessage.textContent = `Nice try. You were off by ${difference} attacks. The correct answer is ${correctAnswer}.`;
        }
        
        resultMessage.classList.add('show');
    }, 500); // Match the CSS transition duration
    
    return false;
}
