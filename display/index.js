d3.json('./data/data.json').then(data => {
  // The raw data
  const contributorNodes = data.nodes.contributors;
  const challengeNodes = data.nodes.challenges;
  const eges = data.edges;

  // Where to draw
  var svg = d3.select('#Target')

  // Start the visualization
  const d3Category10 = d3.schemeCategory10;
  var color = d3.scaleOrdinal(d3Category10);

  const nodes = contributorNodes.concat(challengeNodes);
  const graphData = {
    nodes: nodes,
    links: eges,
  };

  const graphLayout = d3
    .forceSimulation(graphData.nodes)
    .force(
      'link',
      d3
        .forceLink(graphData)
        .id((d, i) => d.id)
        .distance(200)
        .strength(0.7)
    )
    .force('charge', d3.forceManyBody().strength(-80))
    .force(
      'collision',
      d3
        .forceCollide()
        .radius(function (d) {
          return d.radius;
        })
        .strength(-10)
    );

  const node = svg
    .append('g')
    .attr('class', 'nodes')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(graphData.nodes)
    .join('circle')
    .attr('r', function (d, i) {
      if (d.group === 'hub') return 50;
      if (d.group === 'challenge') return 30;
      if (d.group === 'opportunity') return 20;
      if (d.group === 'organization') return 10;
      if (d.group === 'user') return 5;
      // ??
      return 15;
    })
    .attr('fill', function (d, i) {
      if (d.group === 'hub') return 'black';
      if (d.group === 'challenge') return 'red';
      if (d.group === 'opportunity') return 'blue';
      if (d.group === 'user') return 'green';
      if (d.group === 'organization') return 'green';
      return color(d.group);
    })
    .attr('stroke', function (d, i) {
      if (d.group === 'hub') return 'black';
      if (d.group === 'challenge') return 'red';
      if (d.group === 'opportunity') return 'blue';
      if (d.group === 'user') return 'green';
      if (d.group === 'organization') return 'black';
      // is a utxo
      return color(`${d.who}-xxx`);
    })
    .attr('stroke-width', 4)
    .on('mouseover', mouseOverNode)
    .on('mouseout', function (d) {
      div.transition().duration(500).style('opacity', 0);
    })
    .call(drag(graphLayout));

  const link = svg
    .append('g')
    .attr('class', 'links')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(graphData.links)
    .join('line')
    .attr('stroke-width', 1)
    .attr('marker-end', 'url(#arrowhead)');

  graphLayout
    .nodes(graphData.nodes)
    .on('tick', ticked)
    .force('link')
    .links(graphData.links);

  function ticked() {
    link
      .attr('x1', function (d, i) {
        if (d.source.group === 'challenge') {
          return d.source.x;
        }
        return d.source.x;
      })
      .attr('y1', function (d, i) {
        if (d.source.group === 'challenge') {
          return d.source.y;
        }
        return d.source.y;
      })
      .attr('x2', function (d, i) {
        if (d.target.group === 'challenge') {
          return d.target.x;
        }
        return d.target.x;
      })
      .attr('y2', function (d, i) {
        if (d.target.group === 'challenge') {
          return d.target.y;
        }
        return d.target.y;
      });
    node
      .attr('cx', function (d, i) {
        if (d.group === 'challenge') {
          return d.x;
        }
        return d.x;
      })
      .attr('cy', function (d, i) {
        if (d.group === 'challenge') {
          return d.y;
        }
        return d.y;
      });
  }

  function mouseOverNode(d) {
    const nodeData = this.__data__;
    const leftPosition = d.pageX + 'px';
    const topPosition = d.pageY - 28 + 'px';
    div.transition().duration(200).style('opacity', 0.9);
    var labelText = '';
    if (nodeData.group === 'hub') {
      labelText = `<b>${nodeData.label}</b><br/>Lead orgs count: ${nodeData.leadOrgsCount}`;
    } else if (nodeData.group === 'challenge') {
      labelText = `<b>${nodeData.label}</b><br/>Lead orgs count: ${nodeData.leadOrgsCount}`;
    } else if (nodeData.group === 'opportunity') {
      labelText = `<b>${nodeData.label}</b><br/>Lead orgs count: ${nodeData.leadOrgsCount}`;
    } else {
      labelText = `<b>${nodeData.label}</b><br/>group: ${nodeData.group}`;
    }
    div.html(labelText).style('left', leftPosition).style('top', topPosition);
  }

  function click() {
    if (d3.select(this).attr('class') == 'nodes') {
      // do something
    }
  }

  function drag(graphLayout) {
    function dragstarted(event) {
      if (!event.active) graphLayout.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) graphLayout.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // allow zooming
  function handleZoom(e) {
    d3.select('svg').selectAll('g').attr('transform', e.transform);
  }
  let zoom = d3.zoom().on('zoom', handleZoom);

  d3.select('svg').call(zoom);
});
