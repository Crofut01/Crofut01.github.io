// Events to complete on startup
document.addEventListener('DOMContentLoaded', async () => {
    // Check if the data loaded properly and display the results
    try {
        const data = await d3.csv("data/gun_incidents.csv", row => { // Parse data for D3
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
    }

    // increment to move to the next scene on click of next button
    document.querySelectorAll('.nextArrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            if (currentScene < scenes.length - 1) {
                currentScene++;
                showScene(currentScene);
                createChart(currentScene+1);
            }
        });
    });

    // decrement to move to prev scene on click of prev button
    document.querySelectorAll('.prevArrow').forEach(arrow => {
        arrow.addEventListener('click', () => {
            if (currentScene > 0) {
                currentScene--;
                showScene(currentScene);
                createChart(currentScene+1);
            }
        });
    });

    // Begin with first scene
    showScene(currentScene);
    createChart(currentScene+1);
});



/*---
FUNCTION

Draws a chart according to the parameters.

Params:
    start: start date
    end: end date
    sceneNumber: scene number
---*/
function createChart(sceneNumber) {
    console.log(`drawCircle called with sceneNumber: ${sceneNumber}`);
    
    // SVG dimensions
    const svgWidth = 500;
    const svgHeight = 500;

    // Create and append the SVG to the body if not already created
    let svg = d3.select('body').select('svg');
    if (svg.empty()) {
        svg = d3.select('body').append('svg')
            .attr('width', svgWidth)
            .attr('height', svgHeight);
        console.log('SVG created and appended to the body');
    } else {
        console.log('SVG already exists');
    }
    
    // Clear previous circles
    svg.selectAll('*').remove();
    
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
}