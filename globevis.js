
class MapVis {
    constructor(parentElement, cyberData, geoData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.cyberData = cyberData;

        // Define colors
        this.colors = ['#2d5016', '#4a7c34', '#5cb85c', '#7ef77e'];

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Add title
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('Global Cybersecurity Index')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        let zoom = vis.height / 700;

        vis.projection = d3.geoOrthographic()
            .translate([vis.width / 2, vis.height / 2])
            .scale(249.5 * zoom);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "graticule")
            .attr('fill', '#0a0e27')
            .attr("stroke", "rgba(255,255,255,0.2)")
            .attr("d", vis.path);

        vis.graticule = d3.geoGraticule();

        vis.svg.append("path")
            .datum(vis.graticule)
            .attr("class", "graticule")
            .attr("fill", "none")
            .attr("stroke", "rgba(255,255,255,0.15)")
            .attr("d", vis.path);

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr('fill', 'transparent')
            .attr('stroke', '#00fff2')
            .attr('stroke-width', '0.5px');

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');
        
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 3 / 4}, ${vis.height - 50})`);

        // Scale for positioning rectangles
        vis.legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, 120]);

        // Colored rectangles
        vis.legend.selectAll('.legend-rect')
            .data(vis.colors)
            .enter()
            .append('rect')
            .attr('class', 'legend-rect')
            .attr('x', (d, i) => i * 30)
            .attr('y', 0)
            .attr('width', 30)
            .attr('height', 10)
            .attr('fill', d => d);

        // Axis labels
        vis.legendAxis = d3.axisBottom(vis.legendScale)
            .tickValues([0, 50, 100])
            .tickFormat(d => d);

        vis.legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', 'translate(0, 10)')
            .call(vis.legendAxis);

        let m0, o0;
        vis.svg.call(
            d3.drag()
                .on("start", function (event) {
                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }
        
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path);
                    d3.selectAll(".graticule").attr("d", vis.path);
                })
        );

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Country name mapping from GeoJSON names to CSV names
        vis.countryNameMap = {
            'United States of America': 'United States',
            'United States': 'United States',
            'USA': 'United States',
            'Russian Federation': 'Russia',
            'Myanmar': 'Myanmar',
            'Czechia': 'Czech Republic',
            'Macedonia': 'North Macedonia',
            'Swaziland': 'Eswatini',
            'Cape Verde': 'Cabo Verde',
            'Ivory Coast': 'Cote d\'ivoire',
            'East Timor': 'Timor-Leste',
            'Palestine': 'Palestine',
            'Brunei': 'Brunei Darussalam',
            'Laos': 'Lao PDR',
            'Syria': 'Syria',
            'Vatican': 'Vatican City'
        };

        // Country info structure with cybersecurity data
        vis.countryInfo = {};
        
        // Process the cyber data
        vis.cyberData.forEach(d => {
            // Average score from available metrics
            let scores = [];
            if (d.CEI && d.CEI !== '') scores.push(parseFloat(d.CEI) * 100);
            if (d.GCI && d.GCI !== '') scores.push(parseFloat(d.GCI));
            if (d.NCSI && d.NCSI !== '') scores.push(parseFloat(d.NCSI));
            if (d.DDL && d.DDL !== '') scores.push(parseFloat(d.DDL));
            
            let avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            
            let colorIndex;
            if (avgScore < 25) colorIndex = 0;
            else if (avgScore < 50) colorIndex = 1;
            else if (avgScore < 75) colorIndex = 2;
            else colorIndex = 3;
            
            vis.countryInfo[d.Country] = {
                name: d.Country,
                cei: d.CEI || 'N/A',
                gci: d.GCI || 'N/A',
                ncsi: d.NCSI || 'N/A',
                ddl: d.DDL || 'N/A',
                avgScore: avgScore,
                color: vis.colors[colorIndex],
                category: colorIndex
            };
        });

        vis.updateVis();
    }

    // Helper function to find country info by GeoJSON name
    findCountryInfo(geoJsonName) {
        let vis = this;
        
        // Try exact match first
        if (vis.countryInfo[geoJsonName]) {
            return vis.countryInfo[geoJsonName];
        }
        
        // Try mapped name
        const mappedName = vis.countryNameMap[geoJsonName];
        if (mappedName && vis.countryInfo[mappedName]) {
            return vis.countryInfo[mappedName];
        }
        
        // Try case-insensitive match
        for (let csvName in vis.countryInfo) {
            if (csvName.toLowerCase() === geoJsonName.toLowerCase()) {
                return vis.countryInfo[csvName];
            }
        }
        
        return null;
    }

    updateVis() {
        let vis = this;

        vis.countries
            .attr('fill', d => {
                let countryName = d.properties.name;
                let info = vis.findCountryInfo(countryName);
                if (info) {
                    return info.color;
                }
                return '#3a3a52';
            })
            .on('mouseover', function(event, d) {
                let countryName = d.properties.name;
                let info = vis.findCountryInfo(countryName);

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', '#ffd700')
                    .attr('fill', '#00fff2');

                if (info) {
                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px")
                        .html(`
                            <div style="border: thin solid #00fff2; border-radius: 5px; background: #1a1a2e; padding: 20px; color: white;">
                                <h3 style="color: #00fff2; border-bottom: 2px solid #00fff2;">${info.name}</h3>
                                <h4><strong>CEI:</strong> ${info.cei}</h4>
                                <h4><strong>GCI:</strong> ${info.gci}</h4>
                                <h4><strong>NCSI:</strong> ${info.ncsi}</h4>
                                <h4><strong>DDL:</strong> ${info.ddl}</h4>
                                <h4><strong>Avg Score:</strong> ${info.avgScore.toFixed(2)}</h4>                         
                            </div>`);
                }
            })
            .on('mouseout', function(event, d) {
                let countryName = d.properties.name;
                let info = vis.findCountryInfo(countryName);

                d3.select(this)
                    .attr('stroke-width', '0.5px')
                    .attr('stroke', '#00fff2')
                    .attr('fill', info ? info.color : '#3a3a52');

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });
    }
}

// Load map data function
async function loadMapData() {
    try {
        console.log('Starting to load map data...');
        
        // Load CSV data
        const cyberData = await d3.csv('data/Cyber_Metrics_Per_Country.csv');
        console.log('CSV data loaded:', cyberData.length, 'countries');
        
        // Load GeoJSON/TopoJSON data
        const geoData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        console.log('GeoJSON data loaded');
        
        // Check if mapVis element exists
        const mapVisElement = document.getElementById('mapVis');
        console.log('mapVis element:', mapVisElement);
        console.log('mapVis dimensions:', mapVisElement?.getBoundingClientRect());
        
        // Initialize the map visualization
        const mapVis = new MapVis('mapVis', cyberData, geoData);
        
        console.log('Map visualization initialized successfully');
    } catch (error) {
        console.error('Error loading map data:', error);
    }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadMapData();
});
