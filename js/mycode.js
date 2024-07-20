/*---

Function to create time-series chart based on parameters

Parameters:
    (date) start: start date of time series
    (date) end: end date of time series
    (int) scene: determines what scene we are rendering

---*/

function create_chart(start, end, scene) {
    
    // margins and dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // x and y scales for time on the x-axis and counts on the y-axis
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // lines for n_killed, n_injured, and number of incidents for time series data
    const killedLine = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.n_killed); });

    const injuredLine = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.n_injured); });

    const incidentsLine = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.incident_count); });

    // create svg for chart
    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // load the gun violence data from csv filepath
    d3.csv("../data/gun-violence-data_01-2013_03-2018-small.csv").then(function(data) {
        // Parse datetime data, then aggregate data for counts
        const parseDate = d3.timeParse("%m/%d/%Y");
        const nestedData = d3.nest()
            .key(function(d) { return parseDate(d.date); })
            .rollup(function(leaves) {
                return {
                    date: parseDate(leaves[0].date),
                    n_killed: d3.sum(leaves, function(d) { return +d.n_killed; }),
                    n_injured: d3.sum(leaves, function(d) { return +d.n_injured; }),
                    incident_count: leaves.length
                };
            })
            .entries(data)
            .map(function(d) { return d.value; })   
            // filters data for start and end date parameters
            .filter(function(d) { return d.date >= start && d.date <= end; });

        // Set the domains for the scales
        x.domain(d3.extent(nestedData, function(d) { return d.date; }));
        y.domain([0, d3.max(nestedData, function(d) { return Math.max(d.n_killed, d.n_injured, d.incident_count); })]);

        // Add the 3 lines to the chart
        svg.append("path")
            .datum(nestedData)
            .attr("class", "line")
            .attr("d", killedLine)
            .attr("stroke", "red");

        svg.append("path")
            .datum(nestedData)
            .attr("class", "line")
            .attr("d", injuredLine)
            .attr("stroke", "blue");

        svg.append("path")
            .datum(nestedData)
            .attr("class", "line")
            .attr("d", incidentsLine)
            .attr("stroke", "green");

        // Add the x and y axes
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));



    }).catch(function(error) {
        console.error('Error loading or processing data:', error);
    });

}