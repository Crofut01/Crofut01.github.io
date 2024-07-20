/*---

Test function to see what works: drawing a line

---*/


function test_chart() {
    // Margins and dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Static data (just two points for simplicity)
    const data = [
        { x: 0, y: 0 },
        { x: width, y: height }
    ];

    // Line generator
    const line = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    // Add line to SVG
    svg.append("path")
        .datum(data)
        .attr("d", line)
        .attr("stroke", "steelblue")
        .attr("fill", "none")
        .attr("stroke-width", 2);

    // Add x and y axes (optional, for better visualization)
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(d3.scaleLinear().domain([0, width]).range([0, width])));

    svg.append("g")
        .call(d3.axisLeft(d3.scaleLinear().domain([0, height]).range([height, 0])));
}





function test_chart_with_data() {
    // Margins and dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value));

    // Load the CSV data
    d3.csv("data/gun-violence-data_01-2013_03-2018-small.csv").then(function(data) {
        // Parse date and aggregate data
        const parseDate = d3.timeParse("%m/%d/%Y");
        const parsedData = data.map(d => ({
            date: parseDate(d.date),
            n_killed: +d.n_killed,
            n_injured: +d.n_injured
        }));

        // Aggregate data by date
        const aggregatedData = d3.nest()
            .key(d => d.date)
            .rollup(leaves => ({
                date: d3.min(leaves, d => d.date),
                total_killed: d3.sum(leaves, d => d.n_killed),
                total_injured: d3.sum(leaves, d => d.n_injured)
            }))
            .entries(parsedData)
            .map(d => d.value);

        // Set domains
        x.domain(d3.extent(aggregatedData, d => d.date));
        y.domain([0, d3.max(aggregatedData, d => Math.max(d.total_killed, d.total_injured))]);

        // Add line for total killed
        svg.append("path")
            .datum(aggregatedData.map(d => ({ date: d.date, value: d.total_killed })))
            .attr("d", line)
            .attr("stroke", "red")
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Add line for total injured
        svg.append("path")
            .datum(aggregatedData.map(d => ({ date: d.date, value: d.total_injured })))
            .attr("d", line)
            .attr("stroke", "blue")
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Add x and y axes
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

    }).catch(function(error) {
        console.error('Error loading or processing data:', error);
    });
}

