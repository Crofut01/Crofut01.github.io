// Check if the data loaded properly and display the results
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await d3.csv("data/gun_incidents.csv");
        console.log(data);  // Log the data to the console for debugging
        document.getElementById('data-status').innerText = 'Data loaded successfully.';
        document.getElementById('data-status').innerText += ` Loaded ${data.length} records.`;

    } catch (error) {
        console.error('Error loading data', error);
        document.getElementById('data-status').innerText = 'Failed to load data.';
    }
});

//