import * as d3 from "d3";

/**
 * Defines standard subroutines for when a node is dragged.
 * Basically, if a node is dragged, keep moving it to where the mouse is going.
 */

export const drag = (simulation) => {

    const dragstarted = (d) => {

        if (!d.active) {

            simulation.alphaTarget(0.3).restart();

        }

        d.subject.fx = d.x;
        d.subject.fy = d.y;

    };

    const dragged = (d) => {

        d.subject.fx = d.x;
        d.subject.fy = d.y;

    };

    const dragended = (d) => {

        if (!d.active) {

            simulation.alphaTarget(0);

        }

        d.subject.fx = null;
        d.subject.fy = null;

    };

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

};
