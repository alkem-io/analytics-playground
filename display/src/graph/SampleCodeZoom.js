var width = 960,
    height = 960,
    center = [width / 2, height / 2];

var projection = d3.geo.mercator()
    .translate([width / 2, height / 2])
    .scale((width - 1) / 2 / Math.PI);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g");

var g = svg.append("g");

svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

svg
    .call(zoom)
    .call(zoom.event);

d3.json("/mbostock/raw/4090846/world-50m.json", function(error, world) {
  g.append("path")
      .datum({type: "Sphere"})
      .attr("class", "sphere")
      .attr("d", path);

  g.append("path")
      .datum(topojson.merge(world, world.objects.countries.geometries))
      .attr("class", "land")
      .attr("d", path);

  g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);
});

function zoomed() {
  g.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
}

d3.select(self.frameElement).style("height", height + "px");

// Simplest possible buttons
svg.selectAll(".button")
    .data(['zoom_in', 'zoom_out'])
    .enter()
    .append("rect")
    .attr("x", function(d,i){return 10 + 50*i})
    .attr({y: 10, width: 40, height: 20, class: "button"})
    .attr("id", function(d){return d})
    .style("fill", function(d,i){ return i ? "red" : "green"})

d3.selectAll('.button').on('click', function(){
    d3.event.preventDefault();

    var scale = zoom.scale(),
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        x = translate[0], y = translate[1],
        factor = (this.id === 'zoom_in') ? 1.2 : 1/1.2,
        target_scale = scale * factor;

    // If we're already at an extent, done
    if (target_scale === extent[0] || target_scale === extent[1]) { return false; }
    // If the factor is too much, scale it down to reach the extent exactly
    var clamped_target_scale = Math.max(extent[0], Math.min(extent[1], target_scale));
    if (clamped_target_scale != target_scale){
        target_scale = clamped_target_scale;
        factor = target_scale / scale;
    }

    // Center each vector, stretch, then put back
    x = (x - center[0]) * factor + center[0];
    y = (y - center[1]) * factor + center[1];

    // Transition to the new view over 350ms
    d3.transition().duration(350).tween("zoom", function () {
        var interpolate_scale = d3.interpolate(scale, target_scale),
            interpolate_trans = d3.interpolate(translate, [x,y]);
        return function (t) {
            zoom.scale(interpolate_scale(t))
                .translate(interpolate_trans(t));
            zoomed();
        };
    });
});