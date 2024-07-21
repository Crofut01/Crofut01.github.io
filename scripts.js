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