class CrimeMapVisual {
    constructor(containerId, data, topoJsonUrl) {
        this.container = d3.select(`#${containerId}`);
        this.data = data;
        this.topoJsonUrl = topoJsonUrl;

        // Color schemes for pie charts
        this.lossColors = {
            'BEC': '#ff6b9d',
            'Romance': '#a889ff',
            'Credit Card': '#66e0ff',
            'Data Breach': '#6bffa8',
            'Govt Impersonation': '#ffb86b'
        };
        
        this.ageColors = {
            '<20': '#ff6b6b',
            '20-29': '#ffa06b',
            '30-39': '#ffd93d',
            '40-49': '#6bcf7f',
            '50-59': '#4facfe',
            '60+': '#a06bff'
        };

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
        const vis = this;
        
        // Get container dimensions dynamically
        const bbox = this.container.node().getBoundingClientRect();
        const width = bbox.width || 600;
        const height = 400; // Fixed height for smaller map

        // Append SVG
        const svg = vis.container.append("svg")
            .attr("width", width)
            .attr("height", height);

        // Load TopoJSON
        const us = await d3.json(vis.topoJsonUrl);
        const states = topojson.feature(us, us.objects.states).features;

        // Map state names to crime data
        const crimeDataByState = {};
        vis.data.forEach(d => {
            if (d.State) {
                const stateName = d.State.toUpperCase();
                crimeDataByState[stateName] = {
                    totalCrimeCount: this.parseNumber(d.Totalcrime_count),
                    totalCrimeLoss: this.parseNumber(d.Totalcrime_loss),
                    becLoss: this.parseNumber(d.Bec_loss),
                    romanceLoss: this.parseNumber(d.Romance_loss),
                    creditcardLoss: this.parseNumber(d.Creditcard_loss),
                    databreachLoss: this.parseNumber(d.Databreach_loss),
                    govtImpLoss: this.parseNumber(d.GovtImp_loss),
                    age20: this.parseNumber(d['Age<20_count']),
                    age29: this.parseNumber(d['Age<29_count']),
                    age39: this.parseNumber(d['Age<39_count']),
                    age49: this.parseNumber(d['Age<49_count']),
                    age59: this.parseNumber(d['Age<59_count']),
                    age60plus: this.parseNumber(d['Age>60_count'])
                };
            }
        });

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
            .attr("fill", "#477091")
            .attr("stroke", "#66e0ff")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                // Highlight the state
                d3.select(this)
                    .attr("stroke", "#ffd700")
                    .attr("stroke-width", 2)
                    .attr("fill", "#5a8fb3");

                const stateName = d.properties.name;
                const stateData = crimeDataByState[stateName.toUpperCase()];
                
                if (stateData) {
                    // Update pie charts
                    vis.updateLossPieChart(stateName, stateData);
                    vis.updateAgePieChart(stateName, stateData);
                    
                    d3.select("#tooltip")
                        .style("display", "block")
                        .html(`<strong>${stateName}</strong><br>Total Crimes: ${stateData.totalCrimeCount.toLocaleString()}<br>Total Loss: $${(stateData.totalCrimeLoss / 1000000).toFixed(2)}M`);
                }
            })
            .on("mousemove", function(event) {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function() {
                // Remove highlight
                d3.select(this)
                    .attr("stroke", "#66e0ff")
                    .attr("stroke-width", 0.5)
                    .attr("fill", "#477091");

                d3.select("#tooltip").style("display", "none");
            });

        // Show default data for a state (California) on load
        const defaultState = states.find(s => s.properties.name === "California");
        if (defaultState) {
            const stateName = defaultState.properties.name;
            const stateData = crimeDataByState[stateName.toUpperCase()];
            if (stateData) {
                vis.updateLossPieChart(stateName, stateData);
                vis.updateAgePieChart(stateName, stateData);
            }
        }
    }

    parseNumber(value) {
        if (!value) return 0;
        // Remove $ and commas, then parse
        return parseFloat(value.toString().replace(/[$,]/g, '')) || 0;
    }

    updateLossPieChart(stateName, stateData) {
        const data = [
            { label: 'BEC', value: stateData.becLoss, color: this.lossColors['BEC'] },
            { label: 'Romance', value: stateData.romanceLoss, color: this.lossColors['Romance'] },
            { label: 'Credit Card', value: stateData.creditcardLoss, color: this.lossColors['Credit Card'] },
            { label: 'Data Breach', value: stateData.databreachLoss, color: this.lossColors['Data Breach'] },
            { label: 'Govt Impersonation', value: stateData.govtImpLoss, color: this.lossColors['Govt Impersonation'] }
        ].filter(d => d.value > 0);

        // Update title and subtitle
        d3.select("#loss-title").text(`${stateName}: Crime Loss Breakdown`);
        d3.select("#loss-title").node().nextElementSibling.textContent = `Total Loss: $${(stateData.totalCrimeLoss / 1000000).toFixed(2)}M`;

        this.drawPieChart("#loss-pie-chart", data);
    }

    updateAgePieChart(stateName, stateData) {
        const data = [
            { label: 'Under 20', value: stateData.age20, color: this.ageColors['<20'] },
            { label: '20-29', value: stateData.age29, color: this.ageColors['20-29'] },
            { label: '30-39', value: stateData.age39, color: this.ageColors['30-39'] },
            { label: '40-49', value: stateData.age49, color: this.ageColors['40-49'] },
            { label: '50-59', value: stateData.age59, color: this.ageColors['50-59'] },
            { label: '60+', value: stateData.age60plus, color: this.ageColors['60+'] }
        ].filter(d => d.value > 0);

        const totalVictims = data.reduce((sum, d) => sum + d.value, 0);
        
        // Update title and subtitle
        d3.select("#age-title").text(`${stateName}: Victim Age Distribution`);
        d3.select("#age-title").node().nextElementSibling.textContent = `Total Victims: ${totalVictims.toLocaleString()}`;

        this.drawPieChart("#age-pie-chart", data);
    }

    drawPieChart(containerId, data) {
        const container = d3.select(containerId);
        container.selectAll("*").remove();

        const width = 320;
        const height = 320;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.6);

        const arcs = svg.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color)
            .attr("stroke", "#1a1a2e")
            .attr("stroke-width", 2)
            .style("opacity", 0.85)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("opacity", 1)
                    .attr("stroke-width", 3);
                
                const percentage = ((d.data.value / d3.sum(data, d => d.value)) * 100).toFixed(1);
                const formattedValue = d.data.value >= 1000000 
                    ? `$${(d.data.value / 1000000).toFixed(2)}M`
                    : d.data.value.toLocaleString();
                
                d3.select("#tooltip")
                    .style("display", "block")
                    .html(`<strong>${d.data.label}</strong><br>${formattedValue} (${percentage}%)`);
            })
            .on("mousemove", function(event) {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 25) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("opacity", 0.85)
                    .attr("stroke-width", 2);
                d3.select("#tooltip").style("display", "none");
            });

        // Add percentage labels
        arcs.append("text")
            .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .style("pointer-events", "none")
            .text(d => {
                const percentage = ((d.data.value / d3.sum(data, d => d.value)) * 100);
                return percentage > 5 ? `${percentage.toFixed(0)}%` : '';
            });

        // Add legend
        const legend = container.append("div")
            .attr("class", "pie-legend")
            .style("margin-top", "24px");

        data.forEach(d => {
            const item = legend.append("div")
                .attr("class", "pie-legend-item");
            
            item.append("div")
                .attr("class", "pie-legend-color")
                .style("background-color", d.color);
            
            const formattedValue = d.value >= 1000000 
                ? `$${(d.value / 1000000).toFixed(1)}M`
                : d.value.toLocaleString();
            
            item.append("span")
                .text(`${d.label}: ${formattedValue}`);
        });
    }
}