import { TransformationHandler } from "../handlers/TransformationHandler";

/**
 * Defines independent hovercard component for force directed graph.
 * Whenever Node is hovered over, as defined in different file, hovercard is moved to that location and updated with relevant text.
 * Note: need to have two levels of translation: one for zooming and one for the card position when displaying
 * relative to the node being explored
 */ export class Hovercard {
  svg: any;
  svgX: number;
  svgY: number;

  cardGroup: any;
  cardTextName: any;
  cardBackground: any;
  cardTextPosition: any;
  currentTarget: any;

  constructor(svg: any, svgX: number, svgY: number) {
    this.svgX = svgX;
    this.svgY = svgY;
    this.svg = svg;
    this.cardGroup = this.svg
      .append('g')
      .attr('id', 'hovercard')
      .attr('class', 'hovercard')
      .attr('pointer-events', 'none')
      .attr('z-index', "99")
      .style('opacity', 0);

    this.cardBackground = this.cardGroup
      .append('rect')
      .attr('width', 180)
      .attr('height', 45)
      .attr('fill', '#eee')
      .attr('stroke', '#333')
      .attr('rx', 4);

    this.cardTextName = this.cardGroup
      .append('text')
      .attr('transform', 'translate(8, 20)');

    this.cardTextPosition = this.cardGroup
      .append('text')
      .attr('font-size', '10')
      .attr('transform', 'translate(8, 35)');
  }

  moveTo(x: number, y: number, node: any) {
    // Update the hovercard data
    this.cardTextName.text(node.displayName);
    this.cardTextPosition.text(node.nameID);

    const nameWidth = this.cardTextName.node().getBBox().width;
    const positionWidth = this.cardTextPosition.node().getBBox().width;
    const cardWidth = Math.max(nameWidth, positionWidth);

    this.cardBackground.attr('width', cardWidth + 16);

    this.cardGroup.attr('transform', `translate(${x}, ${y})`);

    this.cardGroup.transition().duration(200).style('opacity', 1);
  }

  // animateHovercard() {
  //   if (this.currentTarget) {
  //     /**
  //      * Determine the position of whatever is being hovered over, and if it's a Node, move a hovercard there.
  //      */

  //     const dist = this.currentTarget.r.baseVal.value + 3;

  //     const xPos = this.currentTarget.cx.baseVal.value + dist;
  //     const yPos = this.currentTarget.cy.baseVal.value - dist;

  //     this.cardGroup.attr('transform', `translate(${xPos}, ${yPos})`);
  //   }
  // }

  registerHovercard(node: any, simulation: any, transformationHandler: TransformationHandler) {
    node.on('mouseover', (event: any, d: any) => {

      const radius = event.target.r.baseVal.value;
      const offset = radius + 4;
      const [newX, newY] = transformationHandler.transformCoordinates(d.x + offset, d.y - offset);
      this.moveTo(newX, newY, d);

      simulation.alphaTarget(0).restart();
    });

    node.on('mouseout', () => {
      // When the mouse is moved off a node, hide the card.
      this.remove();
    });
  }

  remove() {
    this.cardGroup.style('opacity', 0);
  }
}
