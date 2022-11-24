import * as d3 from 'd3';

const styles = {
  hub: {
    fill: '#1D384A',
    color: '#ffffff',
  },
  challenge: {
    fill: '#065F6B',
    color: '#ffffff',
  },
  opportunity: {
    fill: '#A2D2DB',
    color: '#1D384A',
  },
  user: {
    fill: '#1D384A',
    color: '#1D384A',
  },
};

export class NodeStyle {
  private static nodeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
  public static ApplyStyles(node: any) {

    // Squares:
    node.selectAll('rect')
      .style('fill', (d: any) => {
        switch(d.type) {
          case "hub": return styles.hub.fill;
          case "challenge": return styles.challenge.fill;
          case "opportunity": return styles.opportunity.fill;
          case "user": return styles.user.fill;
        }
        // default
        return NodeStyle.nodeColorScale(d.group)
      })
      .classed('node', true)
      .classed('fixed', (d: any) => d.fx !== undefined);

  }
}


  /*private displayNodesAsCircles() {
    this.nodesGroup = this.graphGroup.append('g').attr('class', 'nodes');
    this.node = this.nodesGroup
      .selectAll('circle')
      .data(this.graphDataProvider.getFilteredNodes(), (d: Node) => d.id)
      .enter()
      .append('circle')
      .attr('id', (d: Node) => d.id)
      .attr('r', (d: Node) => this.nodeScale(d.weight))
      .attr('stroke', '#251607 ')
      .attr('stroke-width', (d: Node) => {
        if (d.type === 'organization') return 3.0;
        if (d.type === 'hub') return 3.0;
        return 0.5;
      })
      .style('fill', (d: Node) => { console.log(d); return this.nodeColorScale(d.group) })
      .classed('node', true)
      .classed('fixed', (d: Node) => d.fx !== undefined);
  }
*/