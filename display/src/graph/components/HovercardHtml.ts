import { TransformationHandler } from '../handlers/TransformationHandler';
import { INode } from '../model/node.interface';

/**
 * Defines independent hovercard component for force directed graph.
 * Whenever Node is hovered over, as defined in different file, hovercard is moved to that location and updated with relevant text.
 * Note: need to have two levels of translation: one for zooming and one for the card position when displaying
 * relative to the node being explored
 */
export class HovercardHtml {
  svg: any;
  svgX: number;
  svgY: number;

  width = 200;
  height = 120;

  cardGroup: any;
  cardBackground: any;
  cardHtmlBody: any;

  constructor(svg: any, svgX: number, svgY: number) {
    this.svgX = svgX;
    this.svgY = svgY;
    this.svg = svg;
    this.cardGroup = this.svg
      .append('g')
      .attr('id', 'hovercard')
      .attr('class', 'hovercard')
      //.attr('pointer-events', 'none')
      .attr('z-index', '99')
      .style('opacity', 0);

    this.cardBackground = this.cardGroup
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', '#eee')
      .attr('stroke', '#333')
      .attr('rx', 4);

    this.cardHtmlBody = this.cardGroup
      .append('foreignObject')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('xhtml:body')
      .style('font', "14px 'Helvetica Neue'");
    this.cardHtmlBody.html("");

    // Note: some locations online state that the namespace needs to be specified
    // this.cardHtmlDiv = this.cardHtml.append("div")
    //   .attr("xmlns", "http://www.w3.org/TR/SVG11/feature#Extensibility")
    //   .text(htmlText);
    //.text(function (d) { return d.statement; });
  }

  updateHtmlText(node: INode) {
    let tdImage = ''
    if (node.avatar ) {
      tdImage = `<td><img src="${node.avatar}" width="50" height="50" vertical-align="top"></td>`;
    }
    return `
    <table style="width:100%">
      <tr>
        ${tdImage}
        <td><b>${node.displayName}</b><br/>- ${node.nameID}<br/><a href="${node.url}" target=”_blank”>Link</a></td>
      </tr>
    </table>`;
  }

  moveTo(x: number, y: number, node: any) {

    const nodeWithData: INode = node;

    // Todo: update the hovercard size depending on the text? Or scale it?
    // this.cardBackground.attr('width', this.width + 16);
    this.cardHtmlBody.html(this.updateHtmlText(node));

    this.cardGroup.attr('transform', `translate(${x}, ${y})`);

    this.cardGroup.transition().duration(200).style('opacity', 1);
  }

  registerHovercard(
    node: any,
    simulation: any,
    transformationHandler: TransformationHandler
  ) {
    node.on('mouseover', (event: any, d: any) => {
      const radius = event.target.r.baseVal.value;
      const offset = radius + 4;
      const [newX, newY] = transformationHandler.transformCoordinates(
        d.x + offset,
        d.y - offset
      );
      this.moveTo(newX, newY, d);

      simulation.alphaTarget(0).restart();
    });

    node.on('mouseout', () => {
      // When the mouse is moved off a node, hide the card.
      this.remove();
    });
  }

  remove() {
    this.cardGroup.transition().delay(1000).duration(750).style('opacity', 0);
  }
}
