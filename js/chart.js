/*---

Function to create time-series chart based on parameters

Parameters:
    (date) start: start date of time series
    (date) end: end date of time series
    (int) scene: determines what scene we are rendering

---*/

function chart(start, end, scene) {
    
    d3.csv('data/gun-violence-data_01-2013_03-2018-small.csv').then(data => {
        // Parse date and filter data
        const parseDate = d3.timeParse('%m/%d/%Y');
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.n_killed = +d.n_killed;
            d.n_injured = +d.n_injured;
        });

        const filteredData = data.filter(d => d.date >= new Date(startDate) && d.date <= new Date(endDate));

        // Aggregate data by date
        const aggregatedData = d3.rollup(
            filteredData,
            v => ({
                n_killed: d3.sum(v, d => d.n_killed),
                n_injured: d3.sum(v, d => d.n_injured),
                incident_count: v.length
            }),
            d => d3.timeDay(d.date)
        );

        const aggregatedArray = Array.from(aggregatedData, ([date, values]) => ({
            date,
            ...values
        }));

        // Set up the SVG and scales
        const svg = d3.select(`#${scene}`).append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 800 400')
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const x = d3.scaleTime()
            .domain(d3.extent(aggregatedArray, d => d.date))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedArray, d => Math.max(d.n_killed, d.n_injured, d.incident_count))])
            .nice()
            .range([height - margin.bottom, margin.top]);

        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.value));

        const color = d3.scaleOrdinal()
            .domain(['n_killed', 'n_injured', 'incident_count'])
            .range(['#e41a1c', '#377eb8', '#4daf4a']);

        const keys = ['n_killed', 'n_injured', 'incident_count'];

        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        const lineData = keys.map(key => ({
            id: key,
            values: aggregatedArray.map(d => ({ date: d.date, value: d[key] }))
        }));

        const lines = svg.append('g')
            .selectAll('.line-group')
            .data(lineData)
            .enter()
            .append('g')
            .attr('class', 'line-group');

        lines.append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .style('stroke', d => color(d.id));

        lines.append('text')
            .datum(d => ({ id: d.id, value: d.values[d.values.length - 1] }))
            .attr('transform', d => `translate(${x(d.value.date)},${y(d.value.value)})`)
            .attr('x', 5)
            .attr('dy', '.35em')
            .text(d => d.id);
    });

}