// chart-script.js
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(drawChart);

function drawChart() {
    var data = google.visualization.arrayToDataTable([
        ['Asset', 'Number per total'],
        ['Disabled', 2],
        ['Available', 12],
        ['Borrowed', 2],
    ]);

    var options = {
        pieHole: 0.4,
        pieSliceTextStyle: { color: 'black' },
        slices: {
            0: { color: 'red' },
            1: { color: 'lightgreen' },
            2: { color: 'yellow' },
        },
    };

    var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
}
