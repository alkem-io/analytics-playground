export class Hovercard {
  svg: any;

  cardContainer: any;
  card: any;
  cardTextName: any;
  cardBackground: any;
  cardTextPosition: any;
  currentTarget: any;

  constructor(svg: any) {
    this.svg = svg;
  }

  /**
 * Defines independent hovercard component for force directed graph.
 * Whenever Node is hovered over, as defined in different file, hovercard is moved to that location and updated with relevant text.
 * Note: need to have two levels of translation: one for zooming and one for the card position when displaying
 * relative to the node being explored
 */
  createHoverCard() {
    this.cardContainer = this.svg
      .append('g')
      .attr('class', 'hovercard')
      .attr('pointer-events', 'none');

    this.card = this.cardContainer.append('g').attr('display', 'none');

    this.cardBackground = this.card
      .append('rect')
      .attr('width', 180)
      .attr('height', 45)
      .attr('fill', '#eee')
      .attr('stroke', '#333')
      .attr('rx', 4);

    this.cardTextName = this.card
      .append('text')
      .attr('transform', 'translate(8, 20)');

    this.cardTextPosition = this.card
      .append('text')
      .attr('font-size', '10')
      .attr('transform', 'translate(8, 35)');
  }


  animateHovercard() {
    if (this.currentTarget) {
      /**
       * Determine the position of whatever is being hovered over, and if it's a Node, move a hovercard there.
       */

      const dist = this.currentTarget.r.baseVal.value + 3;

      const xPos = this.currentTarget.cx.baseVal.value + dist;
      const yPos = this.currentTarget.cy.baseVal.value - dist;

      this.card.attr('transform', `translate(${xPos}, ${yPos})`);
    }
  }

  registerHovercard(node: any, simulation: any) {

    node.on('mouseover', (event: any, d: any) => {
      /**
       * On mouse over any node, draw the tooltip in that place.
       */

      this.currentTarget = event.target;
      this.card.attr('display', 'block');

      this.cardTextName.text(d.displayName);
      this.cardTextPosition.text(d.nameID);

      /**
       * Automatically size the card to the widest of: the personnel name, personnel role.
       */

      const nameWidth = this.cardTextName.node().getBBox().width;
      const positionWidth = this.cardTextPosition.node().getBBox().width;
      const cardWidth = Math.max(nameWidth, positionWidth);

      this.cardBackground.attr('width', cardWidth + 16);

      simulation.alphaTarget(0).restart();
    });

    node.on('mouseout', () => {
      /**
       * When the mouse is moved off a node, hide the card.
       */
      this.card.attr('display', 'none');
      this.currentTarget = null;
    });
  }
}