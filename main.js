
// depending on size of laptop screen
var width = Math.max(960, window.innerWidth),
	height = Math.max(500, window.innerHeight);

// nice for spherical maps
var pi = Math.PI,
	tau = 2 * pi;

// for web maps w/ tiles in them
var projection = d3.geoMercator()
	.scale(1 / tau)
	.translate([0, 0]);

// create a path generator
var path = d3.geoPath()
	.projection(projection);

var tile = d3.tile()
	.size([width, height]);

// d3 zoom not just used for maps
var zoom = d3.zoom()
	.scaleExtent([
		// use a bit-wise operator
		// 1 converted to binary format, bits shifted 2 places
		// minimum and maximum zoom levels
		1 << 11,
		1 << 24
		])
	.on('zoom', zoomed);

// scale for magnitude
var radius = d3.scaleSqrt().range([0,10]);

// make an svg element
var svg = d3.select('body')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

//append tiles
var raster = svg.append('g');

// end up drawing all earthquake locations to a single path variable
// var vector = svg.append('path')
// to render to multiple paths:
var vector = svg.selectAll('path');

// load data asynchronously
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
	if (error) throw error;

	console.log(geojson);

	radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag;})])

	path.pointRadius(function(d) {
		return radius(d.properties.mag);
	});

	// bind vector data
	// to render to single path: 
	// vector = vector.datum(geojson);
	// for multiple paths:
	vector = vector
		.data(geojson.features)
		.enter().append('path')
		.attr('d', path)
		.on('mouseover', function(d) { console.log(d); });

	// set map projection to center of California (long, lat)
	var center = projection([-119.663, 37.414]);

	// call zoom transform on svg element
	svg.call(zoom)
		.call(
			zoom.transform,
			d3.zoomIdentity
				.translate(width / 2, height / 2)
				.scale(1 << 14)
				.translate(-center[0], -center[1])
				);
});

function zoomed() {
	// grab transform event passed by zoom
	var transform = d3.event.transform;
	var tiles = tile
		.scale(transform.k)
		.translate([transform.x, transform.y])
		();

	console.log(transform.x, transform.y, transform.k);

	projection
		.scale(transform.k / tau)
		.translate([transform.x, transform.y]);

	// redraw vector
	vector.attr('d', path);

	// add tiles, general update pattern
	var image = raster
		.attr('transform', stringify(tiles.scale, tiles.translate))
		.selectAll('image')
		.data(tiles, function(d) { return d;});

	image.exit().remove();

	image.enter().append('image')
		.attr('xlink:href', function(d) {
			return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
				d[2] + "/" + d[0] + "/" + d[1] + ".png";
		})
		// positioning our tiles based on how they should fall in map area
		.attr('x', function(d) { return d[0] * 256; })
		.attr('y', function(d) { return d[1] * 256; })
		.attr('width', 256)
		.attr('height', 256);
}

function stringify(scale, translate) {
	var k = scale / 256,
		r = scale % 1 ? Number : Math.round;
	return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}




