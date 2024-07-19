/*---

Function to create time-series chart based on parameters

Parameters:
    (date) start: start date of time series
    (date) end: end date of time series
    (int) scene: determines what scene we are rendering

---*/

function chart(start, end, scene) {
    
    // Parse the date and time
    const parseDate = d3.timeParse("%Y-%m-%d");
    
    // Set the dimensions and margins of the graph
    const margin = {top: 20, right: 30, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    // Append the SVG object to the body of the page
    const svg = d3.select(`#${scene}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Load the data
    d3.csv("data/gun-violence-data_01-2013_03-2018-small.csv").then(data => {
        // Format the data
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.n_killed = +d.n_killed;
            d.n_injured = +d.n_injured;
        });
        
        // Filter data based on the provided date range
        data = data.filter(d => d.date >= new Date(start) && d.date <= new Date(end));
        
        // Aggregate data by date
        const aggregatedData = d3.rollups(data, v => ({
            date: v[0].date,
            n_killed: d3.sum(v, d => d.n_killed),
            n_injured: d3.sum(v, d => d.n_injured),
            incident_count: v.length
        }), d => d.date).map(d => d[1]);
        
        // Set the ranges
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        
        // Scale the range of the data
        x.domain(d3.extent(aggregatedData, d => d.date));
        y.domain([0, d3.max(aggregatedData, d => Math.max(d.n_killed, d.n_injured, d.incident_count))]);
        
        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
        
        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
        
        // Define the line for deaths
        const deathsLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.n_killed));
        
        // Define the line for injuries
        const injuriesLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.n_injured));
        
        // Define the line for incident count
        const incidentCountLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.incident_count));
        
        // Add the deathsLine path
        svg.append("path")
            .data([aggregatedData])
            .attr("class", "line")
            .style("stroke", "red")
            .attr("d", deathsLine);
        
        // Add the injuriesLine path
        svg.append("path")
            .data([aggregatedData])
            .attr("class", "line")
            .style("stroke", "blue")
            .attr("d", injuriesLine);
        
        // Add the incidentCountLine path
        svg.append("path")
            .data([aggregatedData])
            .attr("class", "line")
            .style("stroke", "green")
            .attr("d", incidentCountLine);
    });

}