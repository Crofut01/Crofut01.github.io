/*---

Test function to see what works

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
