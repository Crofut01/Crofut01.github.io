// data as global var
let data = [];

// Events to complete on startup
document.addEventListener('DOMContentLoaded', async () => {

    let minDate, maxDate;

    // Check if the data loaded properly and display the results
    try {
        data = await d3.csv("data/gun_incidents.csv", row => { // Parse data for D3
            return {
                incident_id: +row.incident_id,
                date: new Date(row.date),
                state: row.state,
                city_or_county: row.city_or_county,
                address: row.address,
                n_killed: +row.n_killed,
                n_injured: +row.n_injured
            };
        });
        console.log(data);
        
        // Store min and max date for slider
        minDate = d3.min(data, d => d.date);
        maxDate = d3.max(data, d => d.date);

        // Set slider attributes
        const slider = document.querySelector('#date-slider');
        slider.min = 0;
        slider.max = 100;
        slider.value = 0;

        // Function to convert slider value to date
        // 0-100 to minDate-maxDate
        function sliderValueToDate(value) {
            const range = maxDate - minDate;
            return new Date(minDate.getTime() + (value / 100) * range);
        }

        // Function to update chart based on slider value
        function updateChart() {
            const selectedDate = sliderValueToDate(slider.value);
            document.querySelector('#slider-label').textContent = `Date: ${selectedDate.toDateString()}`;
            createChart(minDate, selectedDate, 4);  // Pass Scene 4 as the scene number
        }

        // Initial chart rendering
        updateChart();

        // Event listener for slider input
        slider.addEventListener('input', updateChart);

    } catch (error) {
        console.error('Error loading data', error);
    }

    // Handle scene navigation
    const scenes = document.querySelectorAll('.scene');
    let currentScene = 0;

    // show the scene if it is on the current index, else block
    function showScene(index) {
        scenes.forEach((scene, i) => {
            scene.style.display = i === index ? 'block' : 'none';
        });

        // Call createChart for different scene numbers
        switch (index) {
            case 0:
                createChart('2015-01-01', '2015-12-31', index);
                break;
            case 1:
                createChart('2016-01-01', '2016-12-31', index);
                break;
            case 2:
                createChart('2017-01-01', '2017-12-31', index);
                break;
            case 3:
                updateChart();
                break;
            default:
                console.log('Scene', index, 'does not require a chart.');
        }
    }

    // increment to move to the next scene on click of next button
    document.querySelectorAll('.nextArrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            if (currentScene < scenes.length - 1) {
                currentScene++;
                showScene(currentScene);
            }
        });
    });

    // decrement to move to prev scene on click of prev button
    document.querySelectorAll('.prevArrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            if (currentScene > 0) {
                currentScene--;
                showScene(currentScene);
            }
        });
    });

    // Begin with first scene
    showScene(currentScene);
});



/*---
FUNCTION

Draws a chart according to the parameters.

Params:
    startDate: start date
    endDate: end date
    sceneNumber: scene number
---*/
function createChart(startDate, endDate, sceneNumber) {
    console.log('drawChart called from dates: ', startDate, 'to ', endDate);

    // convert start and end to Date vars
    const start = new Date(startDate);
    const end = new Date(endDate);

    // filter for data in specified dates
    const filteredData = data.filter(d => d.date >= start && d.date <= end);

    // Aggregate data by date for counts of
    // incidents, injured, and killed
    const aggData = d3.rollup(
        filteredData,
        v => ({
            count: v.length,
            injured: d3.sum(v, d => d.n_injured),
            killed: d3.sum(v, d => d.n_killed)
        }),
        d => d3.timeDay(d.date)
    );

    // convert agg data to an array
    const aggDataArr = Array.from(aggData, ([date, values]) => ({ date, ...values }));

    // sort time series data by date
    aggDataArr.sort((a, b) => d3.ascending(a.date, b.date));

    // set the dimensions of the svg
    const svgWidth = window.innerWidth;
    const svgHeight = window.innerHeight;
    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    
    // select the existing scene svg to prevent overlap, add chart onto the current scene
    const currentScene = document.querySelector('.scene:not([style*="display: none"])');
    if (!currentScene) {
        console.error('No visible scene found');
        return;
    }

    let svg = d3.select(currentScene).select('svg');
    if (svg.empty()) {
        svg = d3.select(currentScene).append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
        console.log('SVG created and appended to scene', sceneNumber);
    } else {
        console.log('SVG already exists in scene', sceneNumber);
        // Clear previous contents
        svg.selectAll('*').remove();
    }

    // append new element to the svg
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // create scales and axes, add to svg
    const x = d3.scaleTime()
        .domain(d3.extent(aggDataArr, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(aggDataArr, d => Math.max(d.count, d.injured, d.killed))])
        .range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    g.append('g')
        .call(yAxis);

    // create three lines for time series chart
    // incidents, injured, and killed
    // append them to g
    const incidentLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count));

    const injuredLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.injured));

    const killedLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.killed));

    g.append('path')
        .datum(aggDataArr)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', incidentLine);

    g.append('path')
        .datum(aggDataArr)
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 1.5)
        .attr('d', injuredLine);

    g.append('path')
        .datum(aggDataArr)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1.5)
        .attr('d', killedLine);

    // Add legend
    const legend = g.append('g')
        .attr('transform', `translate(${width - 150},${margin.top})`);

    legend.append('rect')
        .attr('width', 150)
        .attr('height', 80)
        .attr('fill', 'white')
        .attr('stroke', 'black');

    legend.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .text('Incident Count')
        .style('fill', 'steelblue');

    legend.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .text('People Injured')
        .style('fill', 'orange');

    legend.append('text')
        .attr('x', 10)
        .attr('y', 60)
        .text('People Killed')
        .style('fill', 'red');

    // Debugging log of svg
    console.log('SVG contents:', svg.node().innerHTML);

}


/*---
FUNCTION
Testing paramaeters and general architecture to build my createChart function
---*/
function drawCircle(sceneNumber) {
    console.log(`drawCircle called with sceneNumber: ${sceneNumber}`);

    // SVG dimensions
    const svgWidth = window.innerWidth;
    const svgHeight = window.innerHeight;

    // Find the current scene
    const currentScene = document.querySelector('.scene:not([style*="display: none"])');
    if (!currentScene) {
        console.error('No visible scene found');
        return;
    }

    // Select existing SVG or create a new one if it doesn't exist
    let svg = d3.select(currentScene).select('svg');
    if (svg.empty()) {
        svg = d3.select(currentScene).append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
        console.log('SVG created and appended to the current scene');
    } else {
        console.log('SVG already exists');
        // Clear previous contents
        svg.selectAll('*').remove();
    }

    // Define circle attributes based on scene number
    let x, y, radius, color;
    switch (sceneNumber) {
        case 1:
            x = 100; y = 100; radius = 50; color = 'steelblue'; break;
        case 2:
            x = 200; y = 200; radius = 75; color = 'green'; break;
        case 3:
            x = 300; y = 300; radius = 100; color = 'red'; break;
        case 4:
            x = 400; y = 400; radius = 125; color = 'purple'; break;
        case 5:
            x = 250; y = 250; radius = 150; color = 'orange'; break;
        default:
            x = svgWidth / 2; y = svgHeight / 2; radius = 50; color = 'gray'; break;
    }

    // Log circle attributes to verify
    console.log(`Drawing circle with x: ${x}, y: ${y}, radius: ${radius}, color: ${color}`);

    // Append the circle to the SVG
    svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', color);
    
    // Log the SVG contents for debugging
    console.log('SVG contents:', svg.node().innerHTML);
}