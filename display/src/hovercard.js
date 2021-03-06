/**
 * Defines independent hovercard component for force directed graph.
 * Whenever Node is hovered over, as defined in different file, hovercard is moved to that location and updated with relevant text.
 * Note: need to have two levels of translation: one for zooming and one for the card position when displaying
 * relative to the node being explored
 */


import {node} from "./node";
import {simulation} from "./simulation";
import {svg} from "../config";

let currentTarget = null;

const cardContainer = svg
    .append("g")
    .attr('class', 'hovercard')
    .attr("pointer-events", "none")

const card = cardContainer
    .append("g")
    .attr("display", "none");

const cardBackground = card.append("rect")
    .attr("width", 180)
    .attr("height", 45)
    .attr("fill", "#eee")
    .attr("stroke", "#333")
    .attr("rx", 4);

const cardTextName = card
    .append("text")
    .attr("transform", "translate(8, 20)");

const cardTextPosition = card
    .append("text")
    .attr("font-size", "10")
    .attr("transform", "translate(8, 35)");

node.on("mouseover", (event, d) => {
    /**
     * On mouse over any node, draw the tooltip in that place.
     */

    currentTarget = event.target;
    card.attr("display", "block");

    cardTextName.text(d.displayName);
    cardTextPosition.text(d.nameID);

    /**
     * Automatically size the card to the widest of: the personnel name, personnel role.
     */

    const nameWidth = cardTextName.node().getBBox().width;
    const positionWidth = cardTextPosition.node().getBBox().width;
    const cardWidth = Math.max(nameWidth, positionWidth);

    cardBackground.attr("width", cardWidth + 16);

    simulation.alphaTarget(0).restart();

});

node.on("mouseout", () => {

    /**
     * When the mouse is moved off a node, hide the card.
     */
    card.attr("display", "none");
    currentTarget = null;

});

export const animate = () => {

    if (currentTarget) {

        /**
         * Determine the position of whatever is being hovered over, and if it's a Node, move a hovercard there.
         */

        const dist = currentTarget.r.baseVal.value + 3;

        const xPos = currentTarget.cx.baseVal.value + dist;
        const yPos = currentTarget.cy.baseVal.value - dist;

        card.attr("transform", `translate(${xPos}, ${yPos})`);

    }

};

