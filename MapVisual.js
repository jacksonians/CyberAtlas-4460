class CrimeMapVisual {
    constructor(containerId, data, topoJsonUrl) {
        this.container = d3.select(`#${containerId}`);
        this.data = data;
        this.topoJsonUrl = topoJsonUrl;

        // Create tooltip if it doesn't exist
        if (d3.select("#tooltip").empty()) {
            d3.select("body").append("div")
                .attr("id", "tooltip")
                .style("position", "absolute")
                .style("display", "none")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "white")
                .style("padding", "10px")
                .style("border-radius", "5px")
                .style("pointer-events", "none")
                .style("font-size", "14px")
                .style("z-index", "1000");
        }

        this.initVis();
    }

    async initVis() {
        // Get container dimensions dynamically
        const bbox = this.container.node().getBoundingClientRect();
        const width = bbox.width;
        const height = bbox.height;

        // Add title
        this.container.append("div")
            .attr("class", "map-title")
            .style("text-align", "center")
            .style("margin-bottom", "10px")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .text("US Cyber Crimes by State")
            .on("mouseover", (event) => {
                d3.select("#tooltip")
                    .style("display", "block")
            })
            .on("mousemove", (event) => {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 12) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", () => {
                d3.select("#tooltip").style("display", "none");
            });

        // Append SVG
        const svg = this.container.append("svg")
            .attr("width", width)
            .attr("height", height);

        // Load TopoJSON
        const us = await d3.json(this.topoJsonUrl);
        const states = topojson.feature(us, us.objects.states).features;

        // Map state names to crime counts
        const crimeByState = {};
        this.data.forEach(d => {
            if (d.state) {
                crimeByState[d.state.toUpperCase()] = d.totalCrimeCount || 0;
            }
        });

        // Color scale
        const maxCrime = d3.max(Object.values(crimeByState));
        const colorScale = d3.scaleSequential()
            .domain([0, maxCrime])
            .interpolator(d3.interpolateReds);

        // Fit projection to container
        const projection = d3.geoAlbersUsa()
            .fitSize([width, height], topojson.feature(us, us.objects.states));
        const path = d3.geoPath(projection);

        // Draw states
        svg.selectAll("path")
            .data(states)
            .enter()
            .append("path")
            .attr("d", path)
            //use this if u want to all be same color.attr("fill", d => {
            //     const stateName = d.properties.name.toUpperCase();
            //     return crimeByState[stateName] ? colorScale(crimeByState[stateName]) : "#ccc";
            // })
            .attr("fill", "#477091")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // Highlight the state
                d3.select(this)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2);

                const stateName = d.properties.name;
                const count = crimeByState[stateName.toUpperCase()] || 0;
                d3.select("#tooltip")
                    .style("display", "block")
                    .html(`<strong>${stateName}</strong><br>Cyber Crimes: ${count.toLocaleString()}`);
            })
            .on("mousemove", function(event) {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function() {
                // Remove highlight
                d3.select(this)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5);

                d3.select("#tooltip").style("display", "none");
            });
    }
}