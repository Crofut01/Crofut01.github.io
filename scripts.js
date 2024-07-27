// data as global var
// minDate and maxDate as global vars
let data = [];
let minDate, maxDate;
let firstUpdate = true;
let slideFirst, slideLast;

/*===
EVENT LISTENER

Actions to complete on startup, after the DOM content has been loaded
---*/
document.addEventListener('DOMContentLoaded', async () => {

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
        //minDate = d3.min(data, d => d.date);
        minDate = new Date('2014-01-01');
        maxDate = d3.max(data, d => d.date);
        slideFirst = minDate;
        slideLast = maxDate;
        console.log('data ranging from: ', minDate, 'to: ', maxDate);

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
                createChart('2015-01-01', '2015-12-31', index+1);
                break;
            case 1:
                createChart('2016-01-01', '2016-12-31', index+1);
                break;
            case 2:
                createChart('2017-01-01', '2017-12-31', index+1);
                break;
            case 3:
                createChart(minDate, maxDate, 4);
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
    const margin = { top: 200, right: 200, bottom: 200, left: 200 };
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
        .attr('transform', `translate(${width - 150},${-margin.top + 30})`);

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

    // Add hover tooltip as div
    const tooltip = d3.select(currentScene).append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('opacity', 0)
        .style('background', '#f9f9f9')
        .style('border', '1px solid #d3d3d3')
        .style('padding', '5px')
        .style('pointer-events', 'none');

    // Overlay rect for tooltip
    svg.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .on('mouseover', function() { tooltip.style('opacity', 1); })
        .on('mouseout', function() { tooltip.style('opacity', 0); })
        .on('mousemove', function(event) {
            const mouse = d3.pointer(event);
            const mouseDate = x.invert(mouse[0]);
            
            const bisect = d3.bisector(d => d.date).left;
            const index = bisect(aggDataArr, mouseDate, 1);
            const d0 = aggDataArr[index - 1];
            const d1 = aggDataArr[index];
            const d = mouseDate - d0.date > d1.date - mouseDate ? d1 : d0;

            tooltip.html(`
                <strong>Date:</strong> ${d.date.toDateString()}<br>
                <strong>Incidents:</strong> ${d.count}<br>
                <strong>Injured:</strong> ${d.injured}<br>
                <strong>Killed:</strong> ${d.killed}
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        });

    // Calculate the total number of incidents
    const totalIncidents = filteredData.length;

    // Add the annotation for the total number of incidents
    g.append('text')
        .attr('x', width - 200)
        .attr('y', margin.top - 250) // decrease to raise number position
        .attr('text-anchor', 'end')
        .style('font-size', '24px')
        .style('fill', 'black')
        .style('font-weight', 'bold')
        .text(`Total Incidents: ${totalIncidents}`);

    // Scene 1 annotation
    // July 4th trends as high incident count
    const scene1AnnDate = new Date('2015-07-04');
    const scene1AnnDateString = scene1AnnDate.toISOString().split('T')[0];
    const scene1AnnData = aggDataArr.find(d => d.date.toISOString().split('T')[0] === scene1AnnDateString);

    if (sceneNumber==1 && scene1AnnData) {
        console.log('Annotation 1 added');
        // mark data point with circle
        g.append('circle')
        .attr('cx', x(scene1AnnDate))
        .attr('cy', y(scene1AnnData.count))
        .attr('r', 5)
        .style('fill', 'purple');

        g.append('text')
        .attr('x', x(scene1AnnDate) + 30) // Adjust as needed, -left +right
        .attr('y', y(scene1AnnData.count) - 30) // Adjust as needed, -up +down
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('font-weight', 'bold')
        .text('July 4th tends to have more incidents every year');
    }

    // Scene 2 annotation
    // Jun 12 Orlando shooting
    const scene2AnnDate = new Date('2016-06-12');
    const scene2AnnDateString = scene2AnnDate.toISOString().split('T')[0];
    const scene2AnnData = aggDataArr.find(d => d.date.toISOString().split('T')[0] === scene2AnnDateString);

    if (sceneNumber==2 && scene2AnnData) {
        // mark data point with circle
        g.append('circle')
        .attr('cx', x(scene2AnnDate))
        .attr('cy', y(scene2AnnData.count))
        .attr('r', 5)
        .style('fill', 'purple');

        g.append('text')
        .attr('x', x(scene2AnnDate) - 45) // Adjust as needed, -left +right
        .attr('y', y(scene2AnnData.count) - 85) // Adjust as needed, -up +down
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('font-weight', 'bold')
        .text('Orlando Shooting');
    }

    // Scene 3 annotation
    // Oct 1 Vegas shooting TODO: enter injured and killed data for event below
    const scene3AnnDate = new Date('2017-10-01');
    const scene3AnnDateString = scene3AnnDate.toISOString().split('T')[0];
    const scene3AnnData = aggDataArr.find(d => d.date.toISOString().split('T')[0] === scene3AnnDateString);

    if (sceneNumber==3 && scene3AnnData) {
        // mark data point with circle
        g.append('circle')
        .attr('cx', x(scene3AnnDate))
        .attr('cy', y(scene3AnnData.injured))
        .attr('r', 5)
        .style('fill', 'purple');

        g.append('text')
        .attr('x', x(scene3AnnDate) - 130) // Adjust as needed, -left +right
        .attr('y', y(scene3AnnData.injured) + 50) // Adjust as needed, -up +down
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('fill', 'black')
        .style('font-weight', 'bold')
        .text('Vegas Shooting');
    }

    // Create date slider for scene 4
    if (sceneNumber == 4) {

        // Create and append the slider elements within the same SVG
        const sliderG = svg.append('g')
            .attr('class', 'slider')
            .attr('transform', `translate(${margin.left},${svgHeight - margin.bottom + 50})`); // Adjust position of slider, add more to lower

        // Create scale for the slider
        const xSlider = d3.scaleTime()
            .domain([minDate, maxDate])
            .range([0, width]);

        // Create and append the axis for the slider
        sliderG.append('g')
            .attr('transform', `translate(0,${30})`) // Position the axis
            .call(d3.axisBottom(xSlider));

         // Initial values for the handles
         const handle1 = sliderG.append('circle')
            .attr('class', 'handle')
            .attr('r', 8)
            .attr('cx', xSlider(slideFirst))
            .attr('cy', 30) // Adjust position
            .call(d3.drag().on('drag', dragged1));

        const handle2 = sliderG.append('circle')
            .attr('class', 'handle')
            .attr('r', 8)
            .attr('cx', xSlider(slideLast))
            .attr('cy', 30) // Adjust position
            .call(d3.drag().on('drag', dragged2));

        // Retrieve label elements from HTML
        const startLabel = document.getElementById('start-label');
        const endLabel = document.getElementById('end-label');

        // Function to update start and end labels, updates start and end dates to filter by
        function updateLabels() {
            console.log('Labels updated');
            const startDate = xSlider.invert(handle1.attr('cx'));
            const endDate = xSlider.invert(handle2.attr('cx'));
            startLabel.textContent = `Start Date: ${startDate.toDateString()}`;
            endLabel.textContent = `End Date: ${endDate.toDateString()}`;

            slideFirst = startDate;
            slideLast = endDate;

            createChart(startDate, endDate, 4);
        }

        // Functions to handle updates from slider drag
        function dragged1(event) {
            const newX = Math.max(0, Math.min(width, event.x));
            handle1.attr('cx', newX);
            updateLabels();
        }

        function dragged2(event) {
            const newX = Math.max(0, Math.min(width, event.x));
            handle2.attr('cx', newX);
            updateLabels();
        }

        // Initial labels update
        console.log('date slider created');
        if (firstUpdate) {
            firstUpdate = false;
            updateLabels();
        }

    }

    // Debugging log of svg
    //console.log('SVG contents:', svg.node().innerHTML);
    console.log('chart drawn');

}