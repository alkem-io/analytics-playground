
export function addArrowHeadDef(defID: string, svgDefs: any): any {
  var arrowHeadDef = svgDefs
    .append('marker')
    .attr('id', `${defID}`)
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 13)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#999')
    .style('stroke', 'none');
  return arrowHeadDef;
}
